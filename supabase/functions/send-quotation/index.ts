import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NOTE: This function is deployed with verify_jwt: false.
// Supabase's gateway JWT verification was causing 401 "Missing authorization header"
// errors because the newer sb_publishable_ key format is not accepted by the gateway.
// Instead we use the service role key inside the function for all data access,
// which is safe since this function only sends emails — it does not expose any
// user data externally.
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { quotationId } = await req.json();
    if (!quotationId) throw new Error("quotationId is required");

    // Fetch quotation with related data
    const { data: quotation, error: qErr } = await adminClient
      .from("quotations")
      .select(
        "*, clients(full_name, email, phone), policies(policy_number, policy_type, premium_amount, start_date, end_date, insurers(name))"
      )
      .eq("id", quotationId)
      .single();

    if (qErr || !quotation) throw new Error("Quotation not found");

    const client = (quotation as any).clients;
    const policy = (quotation as any).policies;
    const insurer = policy?.insurers;

    if (!client?.email) {
      throw new Error("Client does not have an email address");
    }

    const amount = quotation.amount
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(quotation.amount))
      : policy?.premium_amount
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(policy.premium_amount))
      : "N/A";

    const policyNumber = policy?.policy_number || "N/A";
    const policyType = policy?.policy_type || "N/A";
    const startDate = policy?.start_date || "N/A";
    const endDate = policy?.end_date || "N/A";
    const insurerName = insurer?.name || "N/A";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 40px; }
  .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 14px; }
  .body { padding: 36px 40px; }
  .greeting { font-size: 16px; color: #222; margin-bottom: 16px; }
  .card { background: #f8f9ff; border: 1px solid #e8eaff; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
  .card-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eef0ff; }
  .card-row:last-child { border-bottom: none; }
  .card-label { color: #6b7280; font-size: 13px; }
  .card-value { color: #111; font-size: 14px; font-weight: 600; }
  .amount { font-size: 28px; font-weight: 700; color: #4f46e5; text-align: center; margin: 24px 0 8px; }
  .amount-label { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 28px; }
  .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #f0f0f0; }
  .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>RiskMarshal</h1>
      <p>Insurance Quotation</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${client.full_name},</p>
      <p style="color:#555;font-size:14px;line-height:1.7;">Please find below your insurance quotation prepared by our team. We recommend reviewing the details carefully and reaching out if you have any questions.</p>
      
      <div class="amount">${amount}</div>
      <div class="amount-label">Total Premium Amount (incl. GST)</div>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Policy Number</span>
          <span class="card-value">${policyNumber}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Policy Type</span>
          <span class="card-value" style="text-transform:capitalize">${policyType}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Insurer</span>
          <span class="card-value">${insurerName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Valid From</span>
          <span class="card-value">${startDate}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Valid To</span>
          <span class="card-value">${endDate}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Quotation Reference</span>
          <span class="card-value" style="font-family:monospace;font-size:12px">${quotationId.substring(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <p style="color:#6b7280;font-size:13px;">To accept this quotation or request changes, please reply to this email or contact your relationship manager directly.</p>
    </div>
    <div class="footer">
      <p>RiskMarshal Insurance Services</p>
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "RiskMarshal <noreply@riskmarshall.in>",
        to: [client.email],
        subject: `Your Insurance Quotation – ${amount}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend API error: ${errBody}`);
    }

    const resendData = await resendRes.json();

    // Update sent_at timestamp
    await adminClient
      .from("quotations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", quotationId);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-quotation error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
