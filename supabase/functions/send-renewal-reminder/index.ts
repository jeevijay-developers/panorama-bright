import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Parse the reminder_windows field from renewal_config (e.g. "60, 30, 15, 7")
function parseReminderWindows(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a); // descending: 60, 30, 15, 7
}

// Replace {{placeholder}} in templates
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// How many days until the policy end_date (negative means expired)
function daysUntil(endDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Check if a reminder was already sent today for this policy at this days_before window
async function alreadySentToday(
  adminClient: ReturnType<typeof createClient>,
  policyId: string,
  daysBefore: number,
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data } = await adminClient
    .from("reminders_log")
    .select("id")
    .eq("policy_id", policyId)
    .eq("days_before", daysBefore)
    .gte("sent_at", todayStart.toISOString())
    .lte("sent_at", todayEnd.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // --- Parse request body (optional policyId for manual single-fire) ---
    let reqPolicyId: string | null = null;
    let isManual = false;
    try {
      const body = await req.json();
      if (body?.policyId) {
        reqPolicyId = body.policyId;
        isManual = true;
      }
    } catch (_e) {
      // Empty body = scheduled bulk run
    }

    // --- Load renewal_config ---
    const { data: configData } = await adminClient
      .from("renewal_config")
      .select("enabled, reminder_windows, client_email_template, intermediary_email_template")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no config, use safe defaults
    const config = configData ?? {
      enabled: true,
      reminder_windows: "60, 30, 15, 7",
      client_email_template:
        "Your insurance policy with {{insurerName}} is expiring in {{days}} days. Please contact your agent to renew.",
      intermediary_email_template:
        "Your client {{clientName}}'s policy {{policyNumber}} is expiring in {{days}} days. Please follow up for renewal.",
    };

    // For scheduled runs: respect the enabled flag. Manual sends always proceed.
    if (!isManual && !config.enabled) {
      return new Response(
        JSON.stringify({ success: true, message: "Renewal reminders disabled — skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reminderWindows = isManual ? [0] : parseReminderWindows(config.reminder_windows);

    // --- Fetch policies to process ---
    let policiesToProcess: any[] = [];

    if (reqPolicyId) {
      // Manual: single policy
      const { data, error } = await adminClient
        .from("policies")
        .select("*, clients(full_name, email), insurers(name), profiles!policies_intermediary_id_fkey(full_name, email)")
        .eq("id", reqPolicyId)
        .single();

      if (error || !data) throw new Error("Policy not found");
      policiesToProcess = [{ policy: data, daysBefore: 0, isManual: true }];
    } else {
      // Scheduled bulk: find policies whose expiry matches any reminder window
      const { data: allPolicies, error } = await adminClient
        .from("policies")
        .select("*, clients(full_name, email), insurers(name), profiles!policies_intermediary_id_fkey(full_name, email)")
        .in("status", ["active", "expiring"])
        .not("renewal_status", "in", '("renewed","lapsed")');

      if (error) throw error;

      for (const policy of allPolicies ?? []) {
        if (!policy.end_date) continue;
        const days = daysUntil(policy.end_date);

        for (const window of reminderWindows) {
          if (days === window) {
            // Duplicate check
            const sent = await alreadySentToday(adminClient, policy.id, window);
            if (!sent) {
              policiesToProcess.push({ policy, daysBefore: window, isManual: false });
            }
          }
        }
      }
    }

    if (policiesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No policies matched reminder windows today.", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") || "RiskMarshal <noreply@riskmarshall.in>";

    const results = await Promise.all(
      policiesToProcess.map(async ({ policy, daysBefore, isManual: manual }: any) => {
        const client = policy.clients;
        const insurer = policy.insurers;
        const days = manual ? daysUntil(policy.end_date) : daysBefore;
        const actualDaysBefore = manual ? Math.max(0, days) : daysBefore;

        if (!client?.email) {
          return { policyId: policy.id, error: "No client email" };
        }

        const amount = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(policy.premium_amount || 0));

        const templateVars: Record<string, string> = {
          clientName: client.full_name || "Valued Customer",
          policyNumber: policy.policy_number || "",
          insurerName: insurer?.name || "your insurer",
          days: String(days),
          expiryDate: policy.end_date || "",
          premium: amount,
        };

        const clientBody = renderTemplate(config.client_email_template, templateVars);

        const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; color: #1e293b;">
  <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #e11d48; font-size: 20px; margin: 0;">🔔 Policy Renewal Reminder</h1>
    </div>
    <p style="margin: 0 0 16px;">Dear <strong>${client.full_name || "Valued Customer"}</strong>,</p>
    <p style="margin: 0 0 16px;">${clientBody}</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Policy Number</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right;">${policy.policy_number}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Insurer</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right;">${insurer?.name || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Expiry Date</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #e11d48;">${policy.end_date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Premium</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right;">${amount}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
      Please contact your insurance agent immediately to ensure continuous coverage.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
      RiskMarshal Insurance Services &bull; This is an automated reminder.
    </p>
  </div>
</body>
</html>`;

        let success = false;
        let errorMessage: string | undefined;

        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [client.email],
              subject: days <= 7
                ? `⚠️ Urgent: Policy Expiring in ${days} day${days === 1 ? "" : "s"} — ${policy.policy_number}`
                : `Policy Renewal Reminder — ${policy.policy_number} expires in ${days} days`,
              html: emailHtml,
            }),
          });

          if (!resendRes.ok) {
            const resendError = await resendRes.text();
            throw new Error(`Resend API error: ${resendError}`);
          }

          success = true;

          // Update policy renewal_status to 'reminder_sent' if not already actioned
          const nonReminderStatuses = ["renewed", "lapsed"];
          if (!nonReminderStatuses.includes(policy.renewal_status ?? "")) {
            await adminClient
              .from("policies")
              .update({ renewal_status: "reminder_sent" })
              .eq("id", policy.id);
          }

          // Create an in-app notification for the intermediary
          const intermediaryProfile = policy.profiles;
          if (intermediaryProfile) {
            const { data: userRow } = await adminClient
              .from("profiles")
              .select("user_id")
              .eq("id", policy.intermediary_id)
              .single();

            if (userRow?.user_id) {
              await adminClient.from("notifications").insert({
                user_id: userRow.user_id,
                type: "renewal_due",
                title: "Renewal Reminder Sent",
                message: `Renewal reminder email sent to ${client.full_name} for policy ${policy.policy_number} (expires ${policy.end_date}).`,
                reference_id: policy.id,
              });
            }
          }
        } catch (e: any) {
          errorMessage = e.message;
          success = false;
          console.error(`Error sending reminder for policy ${policy.id}:`, e.message);
        }

        // Log the reminder attempt (success or failure)
        await adminClient.from("reminders_log").insert({
          policy_id: policy.id,
          days_before: actualDaysBefore,
          type: manual ? "manual" : "reminder",
          sent_to: client.email,
          success,
          error_message: errorMessage ?? null,
        });

        return { policyId: policy.id, success, error: errorMessage };
      }),
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Renewal reminders: ${successCount} sent, ${failCount} failed.`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("send-renewal-reminder critical error:", e.message);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
