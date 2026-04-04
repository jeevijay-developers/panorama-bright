import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if it's a specific single policy OR scheduled bulk trigger
    let isScheduled = false;
    let reqPolicyId = null;

    try {
      const body = await req.json();
      reqPolicyId = body.policyId;
    } catch (e) {
      // Body might be empty if invoked via standard GET/cron without body
      isScheduled = true; 
    }
    
    if (!reqPolicyId) isScheduled = true; // If no policy ID, assume bulk run

    let policiesToProcess = [];

    if (isScheduled) {
      // Find all active policies 
      const { data, error } = await adminClient
        .from("policies")
        .select("*, clients(full_name, email), insurers(name)")
        .in("status", ["active", "expiring"]);

      if (error) throw error;
      
      const now = new Date();
      now.setHours(0,0,0,0);

      const excludedRenewalStatuses = ["renewed", "paid", "cancelled", "lapsed", "closed"];

      policiesToProcess = (data || []).filter(p => {
        // Exclude if already paid, cancelled, renewed, etc.
        if (p.renewal_status && excludedRenewalStatuses.includes(p.renewal_status.toLowerCase())) {
          return false;
        }
        if (p.status === 'cancelled') {
          return false;
        }

        const endDate = new Date(p.end_date);
        endDate.setHours(0,0,0,0);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });

    } else {
      // Find specific policy
      const { data, error } = await adminClient
        .from("policies")
        .select("*, clients(full_name, email), insurers(name)")
        .eq("id", reqPolicyId)
        .single();

      if (error || !data) throw new Error("Policy not found");
      policiesToProcess = [data];
    }

    const emailPromises = policiesToProcess.map(async (policy) => {
      const client = policy.clients;
      const insurer = policy.insurers;
      
      if (!client?.email) return { error: `No email for policy ${policy.policy_number}` };

      const amount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(policy.premium_amount || 0));

      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>Action Required: Your Policy is Expiring</h2>
        <p>Dear ${client.full_name},</p>
        <p>This is a reminder that your insurance policy <strong>${policy.policy_number}</strong> with ${insurer?.name || 'your insurer'} will expire on <strong>${policy.end_date}</strong>.</p>
        <p>Please ensure you renew your policy to maintain continuous coverage.</p>
        <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;">
           <p><strong>Premium Amount:</strong> ${amount}</p>
        </div>
        <p>Please reply to this email or contact your agent to process your renewal.</p>
        <p>Best regards,<br/>RiskMarshal Insurance Services</p>
      </body>
      </html>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") || "RiskMarshal <noreply@riskmarshall.in>",
          to: [client.email],
          subject: `Urgent: Policy Renewal Reminder - ${policy.policy_number}`,
          html: emailHtml,
        }),
      });

      if (!resendRes.ok) return { error: await resendRes.text() };

      // Update status to 'contacted' if applicable
      if (!["in-discussion", "pending", "contacted"].includes(policy.renewal_status)) {
        await adminClient
          .from("policies")
          .update({ renewal_status: "contacted" })
          .eq("id", policy.id);
      }
      return { success: true, policyId: policy.id };
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
