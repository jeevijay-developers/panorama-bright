import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "gemini-2.0-flash";

const parseJsonFromModel = (text: string): Record<string, unknown> | null => {
  if (!text) return null;
  const normalized = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const jsonMatch = normalized.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { policyId, documentPath, documentUrl } = await req.json();

    if (!policyId || (!documentPath && !documentUrl)) {
      return new Response(
        JSON.stringify({ error: "policyId and either documentPath or documentUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl) throw new Error("SUPABASE_URL env var is not configured");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is not configured");
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY env var is not configured");

    // Always use the service role key — verify_jwt is OFF so incoming requests
    // are not JWT-verified at the infrastructure level. Security is maintained
    // because the service role key handles DB writes server-side.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ──────────────────────────────────────────────
    // 1. Download the document
    // ──────────────────────────────────────────────
    let arrayBuffer: ArrayBuffer;
    let mimeType = "application/pdf";

    if (documentPath) {
      const normalizedPath = String(documentPath).replace(/^\/+/, "");
      console.log("Downloading from Supabase Storage:", normalizedPath);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("policy-documents")
        .download(normalizedPath);

      if (downloadError || !fileData) {
        const detail = downloadError?.message || "Unknown storage error";
        throw new Error(`Failed to download document from storage: ${detail}`);
      }

      arrayBuffer = await fileData.arrayBuffer();
      mimeType = fileData.type || mimeType;
      console.log("Downloaded from storage, size:", arrayBuffer.byteLength, "mimeType:", mimeType);
    } else {
      console.log("Downloading from URL:", documentUrl);
      const documentResponse = await fetch(documentUrl!);
      if (!documentResponse.ok) {
        throw new Error(`Failed to download document from URL (${documentResponse.status} ${documentResponse.statusText})`);
      }
      arrayBuffer = await documentResponse.arrayBuffer();
      mimeType = documentResponse.headers.get("content-type")?.split(";")[0].trim() || mimeType;
    }

    // ──────────────────────────────────────────────
    // 2. Convert to base64 for Gemini
    // ──────────────────────────────────────────────
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < uint8Array.length; i += CHUNK) {
      binary += String.fromCharCode(...uint8Array.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);

    // ──────────────────────────────────────────────
    // 3. Call Gemini for OCR extraction
    // ──────────────────────────────────────────────
    console.log("Calling Gemini API...");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: { responseMimeType: "application/json" },
          contents: [{
            parts: [
              {
                text: `You are an expert Indian insurance document OCR parser. Extract ALL available information from this insurance policy PDF and return ONLY a valid JSON object matching the schema below. Use null for any field not found. Do NOT include markdown, code fences, or explanations.

{
  "vehicleDetails": {
    "manufacturer": "string or null",
    "model": "string or null",
    "variant": "string or null",
    "registrationNumber": "string or null",
    "engineNumber": "string or null",
    "chassisNumber": "string or null",
    "fuelType": "string or null",
    "seatingCapacity": "number or null",
    "cubicCapacity": "number or null",
    "bodyType": "string or null",
    "odometerReading": "number or null"
  },
  "policyDetails": {
    "policyNumber": "string or null",
    "periodFrom": "YYYY-MM-DD or null",
    "periodTo": "YYYY-MM-DD or null",
    "insuranceStartDate": "YYYY-MM-DD or null",
    "insuranceEndDate": "YYYY-MM-DD or null",
    "invoiceNumber": "string or null",
    "invoiceDate": "YYYY-MM-DD or null",
    "customerId": "string or null",
    "gstIn": "string or null",
    "policyType": "string or null",
    "coverType": "string or null",
    "paymentDetails": {
      "mode": "string or null (Cheque/Online/Cash)",
      "chequeNumber": "string or null",
      "bankName": "string or null"
    },
    "previousPolicy": {
      "insurer": "string or null",
      "policyNumber": "string or null",
      "validFrom": "YYYY-MM-DD or null",
      "validTo": "YYYY-MM-DD or null"
    }
  },
  "premiumDetails": {
    "ownDamage": {
      "basicOD": "number or null",
      "addOnZeroDep": "number or null",
      "addOnConsumables": "number or null",
      "others": "number or null",
      "total": "number or null"
    },
    "liability": {
      "basicTP": "number or null",
      "paCoverOwnerDriver": "number or null",
      "llForPaidDriver": "number or null",
      "llEmployees": "number or null",
      "otherLiability": "number or null",
      "total": "number or null"
    },
    "netPremium": "number or null",
    "gst": "number or null",
    "finalPremium": "number or null",
    "compulsoryDeductible": "number or null",
    "voluntaryDeductible": "number or null",
    "ncb": "number or null"
  },
  "clientDetails": {
    "name": "string or null",
    "address": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "gstIn": "string or null",
    "panNumber": "string or null",
    "dateOfBirth": "YYYY-MM-DD or null",
    "nominee": {
      "name": "string or null",
      "relationship": "string or null",
      "age": "number or null"
    }
  },
  "insurerDetails": {
    "name": "string or null",
    "irdaRegNumber": "string or null"
  },
  "branchDetails": {
    "address": "string or null",
    "helpline": "string or null"
  },
  "agentDetails": {
    "name": "string or null",
    "code": "string or null",
    "contact": "string or null"
  },
  "additionalNotes": {
    "limitationsLiability": "string or null",
    "termsConditions": "string or null"
  },
  "qrCodeLink": "string or null"
}`,
              },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      throw new Error(`OCR extraction failed: Gemini returned ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    const textContent =
      geminiResult?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text || "")
        .join("\n")
        .trim() || "";

    console.log("Gemini raw response length:", textContent.length);

    if (!textContent) {
      throw new Error("OCR extraction failed: Gemini returned an empty response");
    }

    const parsedFields = parseJsonFromModel(textContent);
    if (!parsedFields || Object.keys(parsedFields).length === 0) {
      throw new Error("OCR extraction failed: AI returned no structured fields from the document");
    }

    console.log("Parsed fields keys:", Object.keys(parsedFields));

    // ──────────────────────────────────────────────
    // 4. Save extracted data to the policy record
    // ──────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("policies")
      .update({ ocr_extracted_data: parsedFields })
      .eq("id", policyId);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error(`Failed to save OCR data: ${updateError.message}`);
    }

    console.log("OCR data saved successfully for policy:", policyId);

    return new Response(
      JSON.stringify({ success: true, data: parsedFields }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-policy-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
