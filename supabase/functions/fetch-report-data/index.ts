import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for reporting — this is admin-level data access.
    // JWT authenticity is verified by the Supabase relay (verify_jwt: true in config.toml).
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { reportType, dateFrom, dateTo } = await req.json();

    if (!reportType) {
      throw new Error("Missing reportType parameter");
    }

    // Normalise date bounds
    const from = dateFrom || "1970-01-01";
    const to = dateTo || "2100-01-01";

    let data: any[] = [];
    let error: any = null;

    switch (reportType) {
      case "premium_commission": {
        const { data: pcData, error: pcError } = await supabaseClient
          .from("commissions")
          .select(`
            id,
            premium_amount,
            commission_rate,
            commission_amount,
            status,
            policies ( policy_number, policy_type ),
            profiles!commissions_intermediary_id_fkey ( full_name )
          `)
          .gte("created_at", from)
          .lte("created_at", to);
        data = pcData ?? [];
        error = pcError;
        break;
      }

      case "renewals": {
        const { data: renewData, error: renewError } = await supabaseClient
          .from("policies")
          .select(`
            id,
            policy_number,
            policy_type,
            end_date,
            status,
            renewal_status,
            premium_amount,
            clients ( full_name, email, phone )
          `)
          .gte("end_date", dateFrom || new Date().toISOString().split("T")[0])
          .lte("end_date", to);
        data = renewData ?? [];
        error = renewError;
        break;
      }

      case "performance": {
        const { data: perfData, error: perfError } = await supabaseClient
          .from("policies")
          .select(`
            id,
            policy_number,
            premium_amount,
            created_at,
            profiles!policies_intermediary_id_fkey ( full_name, intermediary_code )
          `)
          .gte("created_at", from)
          .lte("created_at", to);
        data = perfData ?? [];
        error = perfError;
        break;
      }

      case "policy_status": {
        const { data: statData, error: statError } = await supabaseClient
          .from("policies")
          .select(`
            id,
            policy_number,
            policy_type,
            status,
            start_date,
            end_date,
            premium_amount,
            clients ( full_name ),
            insurers ( name )
          `)
          .gte("created_at", from)
          .lte("created_at", to);
        data = statData ?? [];
        error = statError;
        break;
      }

      default:
        throw new Error(`Invalid reportType: ${reportType}`);
    }

    if (error) {
      console.error(`Edge Function DB Error [${reportType}]:`, JSON.stringify(error));
      throw new Error(error.message || "Database query failed");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("fetch-report-data error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
