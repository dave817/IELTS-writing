/**
 * Safe AI response parser with validation
 * Handles common LLM output issues without external dependencies
 */

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawText?: string;
}

/**
 * Clean up markdown code blocks from LLM output
 */
function cleanMarkdownCodeBlocks(text: string): string {
  let cleaned = text.trim();
  
  // Remove various code block formats
  const patterns = [
    /^```json\s*/i,
    /^```javascript\s*/i,
    /^```\s*/,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "");
      break;
    }
  }
  
  // Remove trailing code block markers
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return cleaned.trim();
}

/**
 * Attempt to fix common JSON issues from LLM output
 */
function attemptJsonFix(text: string): string {
  let fixed = text;
  
  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([}\]])/g, "$1");
  
  // Try to fix unquoted property names (common LLM mistake)
  // This is a simplified fix that handles basic cases
  fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  
  return fixed;
}

/**
 * Parse AI response with multiple fallback strategies
 */
export function parseAIResponse<T>(responseText: string | null | undefined): ParseResult<T> {
  if (!responseText) {
    return {
      success: false,
      error: "Empty response from AI",
    };
  }

  const rawText = responseText;
  let text = cleanMarkdownCodeBlocks(responseText);

  // First attempt: direct parse
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data, rawText };
  } catch {
    // Continue to next strategy
  }

  // Second attempt: fix common issues
  try {
    const fixedText = attemptJsonFix(text);
    const data = JSON.parse(fixedText) as T;
    return { success: true, data, rawText };
  } catch {
    // Continue to next strategy
  }

  // Third attempt: extract JSON from surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]) as T;
      return { success: true, data, rawText };
    } catch {
      // Continue
    }
  }

  // All attempts failed
  return {
    success: false,
    error: "Failed to parse AI response as JSON",
    rawText,
  };
}

/**
 * Validate that required fields exist in parsed feedback
 */
export function validateFeedbackStructure(
  data: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Create a default/fallback feedback object when parsing fails
 */
export function createFallbackFeedback(rawText: string, drillType: string): Record<string, unknown> {
  const baseMessage = "AI response could not be parsed. Here's the raw feedback:";
  
  switch (drillType) {
    case "opening":
      return {
        hook: { type: "unknown", effectiveness: "unknown", comment: baseMessage },
        transition: { clarity: "unknown", comment: rawText },
        stance: { clarity: "unknown", points_previewed: 0, comment: "" },
        language: { sophistication: "unknown", errors: [] },
        overall_comment: rawText.slice(0, 500),
        improved_version: "",
      };
    
    case "body":
    case "counter":
      return {
        overall_comment: rawText.slice(0, 500),
        improved_version: "",
      };
    
    case "template_fill":
    case "task1_report":
      return {
        task_response: {
          prompt_addressed: false,
          position_clarity: "unknown",
          development_issues: [baseMessage],
          relevance_flags: [],
        },
        coherence_cohesion: {
          paragraph_structure: "unknown",
          cohesive_device_issues: [],
          logic_flow: { coherent: false, breaks: [] },
        },
        lexical_resource: {
          precision_issues: [],
          collocation_errors: [],
        },
        grammar_accuracy: {
          errors: [],
          range: "unknown",
        },
        word_count: { total: 0, meets_minimum: false },
        overall_comment: rawText.slice(0, 500),
      };
    
    default:
      return {
        overall_comment: rawText.slice(0, 500),
        error: "Unable to parse structured feedback",
      };
  }
}

