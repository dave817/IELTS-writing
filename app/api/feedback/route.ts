import { NextResponse } from "next/server";
import { getOpenAIClient, getDeploymentName } from "@/lib/openai";
import { parseAIResponse, createFallbackFeedback } from "@/lib/ai-response-parser";

const SYSTEM_PROMPTS: Record<string, string> = {
  opening: `IELTS examiner. Return ONLY JSON:
{"hook":{"type":"controversy|example|definition|rephrasing","quality":"good|ok|weak"},"thesis":{"clarity":"clear|vague|missing","answers_prompt":true},"errors":["max 2"],"comment":"1-2 sentences","improvement":"one suggestion"}`,

  body: `IELTS examiner. Return ONLY JSON:
{"topic_sentence":"clear|indirect|missing","reasoning":{"method":"deductive|inductive|cause_effect|example","strength":"strong|ok|weak"},"evidence":"concrete|vague|missing","errors":["max 2"],"comment":"1-2 sentences","improvement":"one suggestion"}`,

  counter: `IELTS examiner. Return ONLY JSON:
{"acknowledgment":"fair|straw_man|dismissive","rebuttal":{"strategy":"alternative|evidence|scope_limit","strength":"strong|ok|weak"},"errors":["max 2"],"comment":"1-2 sentences","improvement":"one suggestion"}`,

  points: `IELTS examiner. Analyze brainstormed points. Return ONLY JSON:
{"points":[{"point":"text","strength":"strong|ok|weak","tip":"short"}],"missed":["max 2"],"best_3":["p1","p2","p3"],"comment":"1-2 sentences"}
Max 5 points.`,

  task1_report: `IELTS Task 1 examiner. Return ONLY JSON:
{"addressed":true,"overview":true,"key_features":true,"structure":"good|ok|weak","errors":["max 3"],"words":0,"comment":"1-2 sentences","improvements":["max 2"]}`,

  template_fill: `IELTS Task 2 examiner. Return ONLY this JSON (no extra text):
{"task_response":{"addressed":true,"clarity":"clear|vague|missing","issues":["max 2"]},"coherence":{"structure":"good|ok|weak","issues":["max 2"]},"vocabulary":{"errors":["max 2"]},"grammar":{"errors":["max 2"],"range":"wide|ok|limited"},"words":0,"band":"8|7|6|5","comment":"1-2 sentences","improvements":["top 2 only"]}`,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drillType, prompt, userResponse, userTemplate } = body;

    if (!drillType || !userResponse) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[drillType];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Invalid drill type" },
        { status: 400 }
      );
    }

    const userMessage = prompt
      ? [
          `IELTS Prompt: "${prompt}"`,
          userTemplate ? `\n\nUser Template (for reference):\n${userTemplate}` : "",
          `\n\nStudent's Response:\n${userResponse}`,
        ].join("")
      : [
          userTemplate ? `User Template (for reference):\n${userTemplate}` : "",
          `\n\nStudent's Response:\n${userResponse}`,
        ].join("");

    const openai = getOpenAIClient();
    const deployment = getDeploymentName();
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt + "\n\nIMPORTANT: You must respond with valid JSON only, no markdown formatting, no code blocks, just pure JSON." },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
    });

    const feedbackText = response.choices[0]?.message?.content;
    if (!feedbackText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse AI response with robust error handling
    const parseResult = parseAIResponse<Record<string, unknown>>(feedbackText);
    
    if (parseResult.success && parseResult.data) {
      return NextResponse.json({ feedback: parseResult.data });
    }
    
    // Parsing failed - return fallback feedback so user still gets something useful
    console.warn("AI response parsing failed:", parseResult.error);
    console.warn("Raw response:", feedbackText.slice(0, 500));
    
    const fallbackFeedback = createFallbackFeedback(feedbackText, drillType);
    return NextResponse.json({ 
      feedback: fallbackFeedback,
      parseWarning: "Response was partially parsed. Some feedback may be missing.",
    });
    
  } catch (err) {
    console.error("AI Feedback Error:", err);
    
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    // Log full error for debugging
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT?.slice(0, 30),
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });
    
    // Differentiate between different error types
    if (err instanceof Error) {
      // Check for specific Azure OpenAI errors
      if (errorMessage.includes("rate limit")) {
        return NextResponse.json(
          { error: "AI service rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        return NextResponse.json(
          { error: "AI service timeout. Your essay may be too long, or the service is busy." },
          { status: 504 }
        );
      }
      if (errorMessage.includes("Invalid API Key") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "AI service authentication failed. Check API key.", details: errorMessage },
          { status: 401 }
        );
      }
      if (errorMessage.includes("404") || errorMessage.includes("DeploymentNotFound") || errorMessage.includes("model")) {
        return NextResponse.json(
          { error: "AI model/deployment not found. Check AZURE_OPENAI_DEPLOYMENT_NAME.", details: errorMessage },
          { status: 404 }
        );
      }
      if (errorMessage.includes("AZURE_OPENAI_ENDPOINT") || errorMessage.includes("Missing")) {
        return NextResponse.json(
          { error: "Missing environment variable.", details: errorMessage },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to get AI feedback. Please try again.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

