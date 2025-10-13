import OpenAI from "npm:openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

if (!openaiApiKey) {
  console.error("OPENAI_API_KEY is not set for the screen-assistant function.");
}

const client = new OpenAI({ apiKey: openaiApiKey ?? "" });

type AssistantPayload = {
  question?: string;
  screenshot?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: "Assistant is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as AssistantPayload;
    const question = payload.question?.trim();
    const screenshot = payload.screenshot ?? "";

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!screenshot.startsWith("data:image")) {
      return new Response(JSON.stringify({ error: "Screenshot data URL is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base64Data = screenshot.split(",")[1];

    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Invalid screenshot payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: question },
            { type: "input_image", image_base64: base64Data },
          ],
        },
      ],
    });

    const answer = response.output_text ?? "";

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("screen-assistant error", error);
    return new Response(JSON.stringify({ error: "Failed to process assistant request." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
