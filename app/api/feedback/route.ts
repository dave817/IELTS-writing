import { NextResponse } from "next/server";
import { openai, deployment } from "@/lib/openai";

const SYSTEM_PROMPTS: Record<string, string> = {
  opening: `You are an expert IELTS Writing Task 2 examiner focusing on Opening Paragraphs. 
Analyze the student's opening paragraph and provide feedback in JSON format:
{
  "hook": {
    "type": "controversy|example|definition|comparison|direct_address|just_rephrasing",
    "effectiveness": "strong|adequate|weak",
    "comment": "brief feedback"
  },
  "transition": {
    "clarity": "clear|unclear|missing",
    "comment": "brief feedback"
  },
  "stance": {
    "clarity": "unmistakable|vague|missing",
    "points_previewed": 0-3,
    "comment": "brief feedback"
  },
  "language": {
    "sophistication": "band9|band8|band7|below7",
    "errors": ["list of specific errors"]
  },
  "overall_comment": "2-3 sentences of constructive feedback",
  "improved_version": "Rewrite the opening to Band 9 standard"
}`,

  body: `You are an expert IELTS Writing Task 2 examiner focusing on Body Paragraphs.
Analyze the student's body paragraph and provide feedback in JSON format:
{
  "topic_sentence": {
    "directness": "direct|indirect|missing",
    "connection_to_thesis": "clear|weak|disconnected",
    "comment": "brief feedback"
  },
  "explanation": {
    "answers_why": true|false,
    "logic": "sound|flawed|missing",
    "depth": "fully_developed|adequate|underdeveloped",
    "comment": "brief feedback"
  },
  "example": {
    "specificity": "concrete|vague|missing",
    "relevance": "supports_point|tangential|irrelevant",
    "comment": "brief feedback"
  },
  "small_conclusion": {
    "present": true|false,
    "reinforces_point": true|false
  },
  "logic_flow": {
    "coherent": true|false,
    "flow_breaks": ["list any logic gaps"]
  },
  "language": {
    "sophistication": "band9|band8|band7|below7",
    "errors": ["list of specific errors"]
  },
  "overall_comment": "2-3 sentences of constructive feedback",
  "improved_version": "Rewrite the paragraph to Band 9 standard"
}`,

  counter: `You are an expert IELTS Writing Task 2 examiner focusing on Counter-Arguments.
Analyze the student's counter-argument paragraph and provide feedback in JSON format:
{
  "acknowledgment": {
    "fairness": "fair|straw_man|dismissive",
    "opposing_view_strength": "strongest_counter|weak_counter|irrelevant",
    "comment": "brief feedback"
  },
  "rebuttal": {
    "strategy": "alternative_methods|causal_breakdown|other|none",
    "logic": "sound|flawed|weak",
    "effectiveness": "neutralizes|partially_addresses|fails",
    "comment": "brief feedback"
  },
  "stance_reinforcement": {
    "present": true|false,
    "strength": "strong|adequate|weak"
  },
  "language": {
    "sophistication": "band9|band8|band7|below7",
    "errors": ["list of specific errors"]
  },
  "overall_comment": "2-3 sentences of constructive feedback",
  "improved_version": "Rewrite the counter-argument to Band 9 standard"
}`,

  points: `You are an expert IELTS Writing Task 2 examiner focusing on Point Generation.
Analyze the student's brainstormed points for the given prompt and provide feedback in JSON format:
{
  "points_analysis": [
    {
      "point": "the point they wrote",
      "relevance": "highly_relevant|somewhat_relevant|off_topic",
      "development_potential": "strong|moderate|weak",
      "suggestion": "how to develop this point"
    }
  ],
  "missed_angles": ["strong points they could have considered"],
  "best_3_selection": ["the 3 strongest points to use, in order"],
  "overall_comment": "2-3 sentences of constructive feedback"
}`,

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

  template_fill: `You are an expert IELTS Writing examiner. Do NOT provide a band score.
You must return STRICT JSON matching this schema (no extra keys, no markdown):
{
  "task_response": {
    "prompt_addressed": true|false,
    "position_clarity": "clear|unclear|missing",
    "development_issues": ["string"],
    "relevance_flags": ["string"]
  },
  "coherence_cohesion": {
    "paragraph_structure": "skillful|adequate|weak",
    "cohesive_device_issues": ["string"],
    "logic_flow": {
      "coherent": true|false,
      "adequate": true|false,
      "consistent": true|false,
      "breaks": ["string"]
    }
  },
  "lexical_resource": {
    "precision_issues": ["string"],
    "collocation_errors": ["string"],
    "register_issues": ["string"]
  },
  "grammar_accuracy": {
    "errors": ["string"],
    "range": "wide|adequate|limited"
  },
  "band_9_comparison": {
    "model": "string",
    "key_differences": ["string"],
    "upgrade_suggestions": ["string"]
  },
  "word_count": {
    "total": 0,
    "meets_minimum": true|false
  }
}

Instructions:
- Evaluate the student essay for IELTS Task 2 only.
- Create a Band 9 model answer (approx 350-420 words) in "band_9_comparison.model".
- Keep feedback specific and actionable (no vague advice).
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

    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_completion_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const feedbackText = response.choices[0]?.message?.content;
    if (!feedbackText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const feedback = JSON.parse(feedbackText);
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("AI Feedback Error:", err);
    return NextResponse.json(
      { error: "Failed to get AI feedback" },
      { status: 500 }
    );
  }
}

