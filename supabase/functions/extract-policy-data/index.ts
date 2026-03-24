import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { policyId, documentPath } = await req.json();
    if (!policyId || !documentPath) {
      return new Response(JSON.stringify({ error: "policyId and documentPath are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("policy-documents")
      .download(documentPath);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download document" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || "application/pdf";

    // Call Gemini API for OCR extraction
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: { mimeType, data: base64 },
              },
              {
                text: `Extract the following information from this insurance policy document and return ONLY valid JSON with these fields:
{
  "policy_number": "string or null",
  "client_name": "string or null",
  "insurer_name": "string or null",
  "policy_type": "string or null",
  "premium_amount": "number or null",
  "coverage_amount": "number or null",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "additional_details": "any other relevant info as string"
}`,
              },
            ],
          }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(JSON.stringify({ error: "OCR extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiResult = await geminiResponse.json();
    const textContent = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    let extractedData;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_text: textContent };
    } catch {
      extractedData = { raw_text: textContent };
    }

    // Store extracted data
    const { error: updateError } = await supabase
      .from("policies")
      .update({ ocr_extracted_data: extractedData })
      .eq("id", policyId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
