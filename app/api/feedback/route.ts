import { NextResponse } from "next/server";
import { getOpenAIClient, getDeploymentName } from "@/lib/openai";
import { parseAIResponse, createFallbackFeedback } from "@/lib/ai-response-parser";

const SYSTEM_PROMPTS: Record<string, string> = {
  opening: `You are an expert IELTS examiner (Band 8-9 standard). Analyze the opening paragraph thoroughly.

Return STRICT JSON:
{
  "hook": {
    "type": "controversy|example|definition|comparison|direct_address|rephrasing",
    "effectiveness": "band9_engaging|band8_good|adequate|weak",
    "demonstrates_understanding": true|false,
    "comment": "2-3 sentences analyzing hook quality"
  },
  "background_context": {
    "relevance": "essential|helpful|generic|missing",
    "depth": "insightful|adequate|superficial",
    "comment": "feedback on context provided"
  },
  "thesis": {
    "clarity": "unmistakable|clear|vague|missing",
    "directly_answers_prompt": true|false,
    "stance_strength": "definitive|moderate|weak",
    "points_previewed": 0,
    "comment": "2-3 sentences on thesis quality"
  },
  "lexical_resource": {
    "level": "band9_sophisticated|band8_precise|adequate|limited",
    "highlights": [{"phrase": "good phrase", "why": "why it's good"}],
    "errors": [{"error": "issue", "correction": "fix"}],
    "formality_issues": ["contractions or informal words found"]
  },
  "grammar_accuracy": {
    "errors": [{"error": "issue", "correction": "fix", "type": "error type"}],
    "highlights": ["well-constructed sentence"]
  },
  "cohesion": {
    "flow": "effortless|smooth|adequate|choppy",
    "transitions": "natural|adequate|awkward|missing"
  },
  "overall_comment": "3-4 sentences of comprehensive feedback",
  "priority_improvements": ["improvement 1", "improvement 2"]
}`,

  body: `You are an expert IELTS examiner (Band 8-9 standard). Analyze the body paragraph thoroughly.

CRITERIA: Band 8 = very good logic (极低可抬杠性), Band 9 = irrefutable arguments

Return STRICT JSON:
{
  "topic_sentence": {
    "quality": "direct|indirect|missing",
    "connection_to_thesis": "clear|weak|disconnected",
    "signals_content": true|false,
    "comment": "2-3 sentences on topic sentence"
  },
  "reasoning": {
    "method": "deductive|inductive|cause_effect|exemplification|compare_contrast|unclear",
    "logic_quality": "irrefutable|strong|adequate|flawed",
    "counter_vulnerability": "none|minimal|some|significant",
    "depth": "fully_developed|adequate|underdeveloped",
    "answers_why_how": true|false,
    "comment": "2-3 sentences analyzing reasoning quality"
  },
  "evidence": {
    "type": "concrete_example|data|expert_opinion|hypothetical|none",
    "plausibility": "highly_plausible|plausible|questionable",
    "specificity": "concrete|vague|missing",
    "relevance": "directly_supports|tangential|irrelevant",
    "comment": "2-3 sentences on evidence quality"
  },
  "mini_conclusion": {
    "present": true|false,
    "reinforces_point": true|false,
    "links_to_thesis": true|false
  },
  "lexical_resource": {
    "level": "band9_sophisticated|band8_precise|adequate|limited",
    "highlights": [{"phrase": "good phrase", "why": "why it's good"}],
    "errors": [{"error": "issue", "correction": "fix"}],
    "over_exaggeration": ["dramatic claims found"]
  },
  "grammar_accuracy": {
    "errors": [{"error": "issue", "correction": "fix", "type": "error type"}],
    "highlights": ["well-constructed sentence"]
  },
  "cohesion": {
    "flow": "effortless|smooth|adequate|choppy",
    "transitions": "natural|adequate|overused|awkward",
    "flow_breaks": ["specific issue"]
  },
  "overall_comment": "3-4 sentences of comprehensive feedback",
  "priority_improvements": ["improvement 1", "improvement 2"]
}`,

  counter: `You are an expert IELTS examiner (Band 8-9 standard). Analyze the counter-argument paragraph thoroughly.

CRITERIA: Band 8 = minimal room for counter (极低可抬杠性), Band 9 = irrefutable rebuttal

Return STRICT JSON:
{
  "acknowledgment": {
    "fairness": "fair_strongest|fair_moderate|straw_man|dismissive",
    "opposing_view_strength": "strongest_counter|moderate|weak|irrelevant",
    "intellectual_honesty": true|false,
    "comment": "2-3 sentences on how fairly the opposing view is presented"
  },
  "rebuttal": {
    "strategy": "alternative_methods|causal_breakdown|scope_limitation|evidence_based|multiple|none",
    "logic_quality": "irrefutable|strong|adequate|flawed",
    "counter_vulnerability": "none|minimal|some|significant",
    "effectiveness": "fully_neutralizes|mostly_neutralizes|partial|fails",
    "comment": "2-3 sentences analyzing rebuttal quality"
  },
  "stance_reinforcement": {
    "present": true|false,
    "strength": "definitive|strong|adequate|weak",
    "links_to_thesis": true|false
  },
  "balance_and_tone": {
    "acknowledges_valid_points": true|false,
    "maintains_objectivity": true|false,
    "avoids_dismissiveness": true|false
  },
  "lexical_resource": {
    "level": "band9_sophisticated|band8_precise|adequate|limited",
    "highlights": [{"phrase": "good phrase", "why": "why it's good"}],
    "errors": [{"error": "issue", "correction": "fix"}],
    "hedging_language": "appropriate|overused|underused"
  },
  "grammar_accuracy": {
    "errors": [{"error": "issue", "correction": "fix", "type": "error type"}],
    "highlights": ["well-constructed sentence"]
  },
  "cohesion": {
    "flow": "effortless|smooth|adequate|choppy",
    "contrast_markers": "natural|adequate|overused|missing"
  },
  "overall_comment": "3-4 sentences of comprehensive feedback",
  "priority_improvements": ["improvement 1", "improvement 2"]
}`,

  points: `You are an expert IELTS examiner (Band 8-9 standard). Analyze brainstormed points thoroughly.

CRITERIA: Band 9 = 论点清晰，主题明确，不重不漏 (no repetition, no omission)

Return STRICT JSON:
{
  "points_analysis": [
    {
      "point": "the point text",
      "relevance": "highly_relevant|somewhat_relevant|off_topic",
      "logic_strength": "irrefutable|strong|moderate|weak",
      "counter_vulnerability": "none|minimal|some|significant",
      "development_potential": "strong|moderate|weak",
      "suggested_method": "deductive|inductive|cause_effect|exemplification|compare_contrast",
      "evidence_suggestion": "specific example or data to use",
      "improvement": "how to strengthen this point"
    }
  ],
  "repetition_issues": ["points that overlap"],
  "missed_angles": ["important perspective not considered"],
  "stakeholder_coverage": {
    "covered": ["stakeholders addressed"],
    "missing": ["stakeholders not considered"]
  },
  "best_3_selection": {
    "points": ["point 1", "point 2", "point 3"],
    "reasoning": "why these 3 work best together"
  },
  "essay_structure": {
    "format": "opinion|discussion|problem_solution|advantage_disadvantage",
    "paragraph_plan": "suggested outline"
  },
  "overall_comment": "3-4 sentences on point quality and variety"
}

Analyze up to 5 points in detail.`,

  task1_report: `You are an expert IELTS Writing Task 1 examiner (Band 8-9 standard).

CRITERIA: Band 8 = all important details, no major mistakes. Band 9 = 詳略得當,重點突出, prioritize effectively

Return STRICT JSON:
{
  "task_response": {
    "prompt_addressed": true|false,
    "key_features_covered": true|false,
    "overview_present": true|false,
    "overview_quality": "insightful|adequate|superficial|missing",
    "data_selection": "prioritized_well|adequate|poor",
    "development_issues": ["specific issue"],
    "comment": "2-3 sentences on task achievement"
  },
  "coherence_cohesion": {
    "paragraph_structure": "skillful|adequate|weak",
    "logical_organization": "clear_progression|adequate|confusing",
    "cohesive_devices": {
      "usage": "natural|adequate|overused|underused",
      "issues": ["specific issue"]
    },
    "comment": "2-3 sentences on organization"
  },
  "lexical_resource": {
    "range": "wide|adequate|limited",
    "data_language": {
      "accuracy": "accurate|mostly_accurate|inaccurate",
      "variety": "good|adequate|repetitive",
      "examples": ["good phrases used"]
    },
    "errors": [{"error": "issue", "correction": "fix"}],
    "improvements": [{"original": "phrase", "better": "improvement"}],
    "comment": "2-3 sentences on vocabulary"
  },
  "grammar_accuracy": {
    "range": "wide|adequate|limited",
    "errors": [{"error": "issue", "correction": "fix", "type": "error type"}],
    "highlights": ["well-constructed sentence"],
    "comment": "2-3 sentences on grammar"
  },
  "word_count": {
    "total": 0,
    "meets_minimum": true|false
  },
  "estimated_band": "8.5-9|8-8.5|7.5-8|7-7.5|below7",
  "overall_strengths": ["strength 1", "strength 2"],
  "priority_improvements": ["fix 1", "fix 2", "fix 3"],
  "overall_comment": "3-4 sentences of comprehensive feedback"
}

Instructions:
- Check for 150+ words minimum
- Evaluate overview presence and quality
- Focus on data description accuracy and variety
- Check prioritization of information (詳略得當)
`,

  template_fill: `You are an expert IELTS Writing Task 2 examiner (Band 8-9 standard).

GRADING CRITERIA:
- Band 8: Very good logic (极低可抬杠性), plausible evidence, highly accurate language
- Band 9: Optimized arguments, format variety, layered reasoning, 论点清晰不重不漏

Return STRICT JSON:
{
  "task_response": {
    "all_questions_answered": true|false,
    "position_clarity": "unmistakable|clear|vague|missing",
    "stance_strength": "definitive|moderate|weak",
    "argument_methods_used": ["deductive|inductive|cause_effect|exemplification|compare_contrast|counter_argument"],
    "logic_strength": "band9_irrefutable|band8_minimal_counter|band7_gaps|weak",
    "development_analysis": "Detailed paragraph-by-paragraph analysis of argument development",
    "issues": ["specific issue 1", "specific issue 2"],
    "comment": "2-3 sentences on task response quality"
  },
  "coherence_cohesion": {
    "overall_flow": "effortless|smooth|adequate|choppy",
    "paragraph_structure": "skillful|adequate|weak",
    "paragraph_analysis": "Analysis of each paragraph's role and transitions",
    "cohesive_devices": {
      "usage": "natural|adequate|overused|underused",
      "examples": ["good examples used"],
      "issues": ["problematic usages"]
    },
    "logic_flow_breaks": ["specific gap or break in logic"],
    "comment": "2-3 sentences on coherence quality"
  },
  "lexical_resource": {
    "range": "wide_sophisticated|adequate|limited",
    "precision": "precise|mostly_accurate|imprecise",
    "vocabulary_highlights": ["excellent word/phrase 1", "excellent word/phrase 2"],
    "formality_issues": ["any contractions like don't/can't", "abbreviations", "informal words"],
    "over_exaggeration": ["overly dramatic or imprecise claims"],
    "collocation_errors": [{"error": "wrong collocation", "correction": "correct form"}],
    "word_choice_improvements": [{"original": "word used", "better": "suggested improvement", "reason": "why"}],
    "comment": "2-3 sentences on vocabulary quality and sophistication"
  },
  "grammar_accuracy": {
    "range": "wide_flexible|adequate|limited",
    "sentence_variety": "excellent|good|limited",
    "error_frequency": "extremely_rare|occasional|frequent",
    "errors": [{"error": "the grammatical error", "correction": "corrected version", "type": "tense|agreement|article|etc"}],
    "punctuation_issues": [{"issue": "punctuation problem", "correction": "how to fix"}],
    "highlights": ["well-constructed sentences"],
    "comment": "2-3 sentences on grammar quality"
  },
  "word_count": {
    "total": 0,
    "meets_minimum": true|false
  },
  "conclusion_quality": {
    "summarizes_differently": true|false,
    "broadens_perspective": true|false,
    "avoids_new_info": true|false,
    "is_concise": true|false,
    "comment": "feedback on conclusion"
  },
  "estimated_band": "8.5-9|8-8.5|7.5-8|7-7.5|below7",
  "overall_strengths": ["strength 1", "strength 2"],
  "priority_improvements": ["most important fix 1", "most important fix 2", "most important fix 3"],
  "overall_comment": "3-4 sentences of comprehensive feedback"
}

Instructions:
- Be thorough and specific with examples from the essay
- Quote actual phrases when pointing out errors or highlights
- Focus on logic strength and argument irrefutability (可抬杠性)
- Check formal register: no contractions (don't, can't), no abbreviations
- Evaluate reasoning depth using multiple methods
- Count actual words accurately
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

