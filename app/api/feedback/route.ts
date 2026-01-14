import { NextResponse } from "next/server";
import { getOpenAIClient, getDeploymentName } from "@/lib/openai";
import { parseAIResponse, createFallbackFeedback } from "@/lib/ai-response-parser";

const SYSTEM_PROMPTS: Record<string, string> = {
  opening: `You are an expert IELTS examiner. Analyze the opening paragraph concisely.

Return STRICT JSON only:
{
  "hook": {
    "type": "controversy|example|definition|comparison|rephrasing",
    "effectiveness": "engaging|good|adequate|weak",
    "comment": "brief feedback"
  },
  "thesis": {
    "clarity": "clear|vague|missing",
    "answers_prompt": true|false,
    "comment": "brief feedback"
  },
  "language": {
    "level": "sophisticated|adequate|limited",
    "errors": ["error1"],
    "highlights": ["good phrase"]
  },
  "overall_comment": "2-3 sentences of key feedback",
  "one_sentence_improvement": "Single most important improvement suggestion"
}`,

  body: `You are an expert IELTS examiner. Analyze the body paragraph concisely.

Return STRICT JSON only:
{
  "topic_sentence": {
    "quality": "clear|indirect|missing",
    "comment": "brief feedback"
  },
  "reasoning": {
    "method": "deductive|inductive|cause_effect|example|unclear",
    "strength": "strong|adequate|weak",
    "comment": "brief feedback"
  },
  "evidence": {
    "quality": "concrete|vague|missing",
    "comment": "brief feedback"
  },
  "language": {
    "level": "sophisticated|adequate|limited",
    "errors": ["error1"]
  },
  "overall_comment": "2-3 sentences of key feedback",
  "one_sentence_improvement": "Single most important improvement"
}`,

  counter: `You are an expert IELTS examiner. Analyze the counter-argument paragraph concisely.

Return STRICT JSON only:
{
  "acknowledgment": {
    "fairness": "fair|straw_man|dismissive",
    "comment": "brief feedback"
  },
  "rebuttal": {
    "strategy": "alternative|causal_breakdown|scope_limit|evidence|none",
    "effectiveness": "strong|adequate|weak",
    "comment": "brief feedback"
  },
  "language": {
    "level": "sophisticated|adequate|limited",
    "errors": ["error1"]
  },
  "overall_comment": "2-3 sentences of key feedback",
  "one_sentence_improvement": "Single most important improvement"
}`,

  points: `You are an expert IELTS examiner. Analyze brainstormed points concisely.

Return STRICT JSON only:
{
  "points_analysis": [
    {
      "point": "the point",
      "strength": "strong|moderate|weak",
      "improvement": "brief suggestion"
    }
  ],
  "missed_angles": ["angle1"],
  "best_3_points": ["point1", "point2", "point3"],
  "overall_comment": "2-3 sentences of key feedback"
}

Keep points_analysis to max 5 items.`,

  task1_report: `You are an expert IELTS Writing Task 1 examiner. Do NOT provide a band score.
Analyze the student's Task 1 report (describing data, charts, maps, or processes) and return STRICT JSON:
{
  "task_response": {
    "prompt_addressed": true|false,
    "position_clarity": "clear|unclear|missing",
    "development_issues": ["string"],
    "key_features_covered": true|false,
    "overview_present": true|false
  },
  "coherence_cohesion": {
    "paragraph_structure": "skillful|adequate|weak",
    "cohesive_device_issues": ["string"],
    "logic_flow": {
      "coherent": true|false,
      "breaks": ["string"]
    }
  },
  "lexical_resource": {
    "precision_issues": ["string"],
    "collocation_errors": ["string"],
    "data_language_accuracy": "accurate|mostly_accurate|inaccurate"
  },
  "grammar_accuracy": {
    "errors": ["string"],
    "range": "wide|adequate|limited"
  },
  "word_count": {
    "total": 0,
    "meets_minimum": true|false
  },
  "overall_comment": "2-3 sentences of constructive feedback"
}

Instructions:
- Evaluate for IELTS Task 1 (150+ words minimum).
- Check if key features and an overview are present.
- Focus on accuracy of data description language.
`,

  template_fill: `You are an expert IELTS Writing Task 2 examiner. Provide concise, actionable feedback.

Return STRICT JSON only (no markdown):
{
  "task_response": {
    "prompt_addressed": true|false,
    "position_clarity": "clear|vague|missing",
    "development_issues": ["issue1", "issue2"]
  },
  "coherence_cohesion": {
    "paragraph_structure": "skillful|adequate|weak",
    "logic_flow": {
      "coherent": true|false,
      "breaks": ["issue1"]
    }
  },
  "lexical_resource": {
    "collocation_errors": ["error1"],
    "improvement_suggestions": ["suggestion1"]
  },
  "grammar_accuracy": {
    "errors": ["error with correction"],
    "range": "wide|adequate|limited"
  },
  "word_count": {
    "total": 0,
    "meets_minimum": true|false
  },
  "overall_comment": "2-3 sentences of key feedback",
  "top_3_improvements": ["improvement1", "improvement2", "improvement3"],
  "estimated_band": "8-9|7-8|6-7|below6"
}

Instructions:
- Count the actual words in the essay
- Be specific but concise
- Focus on the most important issues only
- Keep arrays short (max 3 items each)
`,
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_completion_tokens: 16000,
      response_format: { type: "json_object" },
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

