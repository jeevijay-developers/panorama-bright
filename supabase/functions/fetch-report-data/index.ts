// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    )

    // Grab query params
    const { reportType, dateFrom, dateTo } = await req.json()

    if (!reportType) {
      throw new Error("Missing reportType parameter")
    }

    let data = []
    let error = null

    switch (reportType) {
      case "premium_commission":
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
          .gte("created_at", dateFrom || "1970-01-01")
          .lte("created_at", dateTo || "2100-01-01")
        data = pcData
        error = pcError
        break

      case "renewals":
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
          .gte("end_date", dateFrom || new Date().toISOString())
          .lte("end_date", dateTo || "2100-01-01")
        data = renewData
        error = renewError
        break

      case "performance":
        const { data: perfData, error: perfError } = await supabaseClient
          .from("policies")
          .select(`
            id,
            policy_number,
            premium_amount,
            created_at,
            profiles!policies_intermediary_id_fkey ( full_name, intermediary_code )
          `)
          .gte("created_at", dateFrom || "1970-01-01")
          .lte("created_at", dateTo || "2100-01-01")
        data = perfData
        error = perfError
        break

      case "policy_status":
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
          .gte("created_at", dateFrom || "1970-01-01")
          .lte("created_at", dateTo || "2100-01-01")
        data = statData
        error = statError
        break

      default:
        throw new Error("Invalid reportType")
    }

    if (error) {
      console.error(`Edge Function Error [${reportType}]:`, error)
      throw error
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-report-data' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
