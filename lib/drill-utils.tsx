"use client";

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

/**
 * Format seconds into MM:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get timer color class based on remaining time
 */
export function getTimerColorClass(seconds: number): string {
  if (seconds < 300) return "text-red-500"; // < 5 min
  if (seconds < 600) return "text-yellow-500"; // < 10 min
  return "text-primary";
}

/**
 * Count words in text (handles empty strings properly)
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Get feedback icon based on quality indicator
 */
export function getQualityIcon(quality: boolean | string): ReactNode {
  // Positive indicators
  const positiveValues = [
    true,
    "clear",
    "unmistakable",
    "skillful",
    "wide",
    "excellent",
    "strong",
    "irrefutable",
    "band9",
    "effortless",
    "smooth",
    "natural",
    "precise",
  ];
  
  // Neutral/adequate indicators  
  const neutralValues = [
    "adequate",
    "vague",
    "unclear",
    "moderate",
    "mostly_formal",
    "some",
    "band7",
    "band8",
  ];
  
  // Check type
  if (typeof quality === "boolean") {
    return quality 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  }
  
  const lowerQuality = quality.toLowerCase();
  
  if (positiveValues.some(v => typeof v === "string" && lowerQuality.includes(v))) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  
  if (neutralValues.some(v => lowerQuality.includes(v))) {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  
  return <XCircle className="h-4 w-4 text-red-500" />;
}

/**
 * Get progress percentage towards target word count
 */
export function getWordCountProgress(currentWords: number, targetWords: number): number {
  return Math.min(100, (currentWords / targetWords) * 100);
}

/**
 * Get word count status label and color
 */
export function getWordCountStatus(
  currentWords: number,
  minWords: number,
  targetWords: number
): { label: string; colorClass: string; meetsMinimum: boolean; meetsTarget: boolean } {
  if (currentWords >= targetWords) {
    return {
      label: "✓ Band 9 word count achieved",
      colorClass: "text-green-600",
      meetsMinimum: true,
      meetsTarget: true,
    };
  }
  
  if (currentWords >= minWords) {
    return {
      label: `${targetWords - currentWords} more for Band 9 target`,
      colorClass: "text-yellow-600",
      meetsMinimum: true,
      meetsTarget: false,
    };
  }
  
  return {
    label: `${minWords - currentWords} more words to minimum`,
    colorClass: "text-red-600",
    meetsMinimum: false,
    meetsTarget: false,
  };
}

