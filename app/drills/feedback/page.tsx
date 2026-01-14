"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feedback = Record<string, any>;

function getIcon(value: string | boolean | undefined | null) {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") {
    return value ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  }
  const v = String(value).toLowerCase();
  if (v.includes("good") || v.includes("wide") || v.includes("clear") || v.includes("smooth")) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (v.includes("adequate") || v.includes("moderate")) {
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function FeedbackSection({ title, score, comment, items, itemsLabel, errors, errorsLabel }: {
  title: string;
  score?: string;
  comment?: string;
  items?: string[];
  itemsLabel?: string;
  errors?: string[];
  errorsLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getIcon(score)}
            {title}
          </span>
          {score && <Badge variant="outline">{score}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comment ? (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm leading-relaxed">{comment}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">No detailed analysis provided for this criterion.</p>
          </div>
        )}
        
        {items && items.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{itemsLabel || "Highlights"}:</p>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {errors && errors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{errorsLabel || "Issues"}:</p>
            <ul className="space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    // Load feedback from sessionStorage
    const stored = sessionStorage.getItem("ielts-feedback");
    const storedWordCount = sessionStorage.getItem("ielts-word-count");
    
    if (stored) {
      try {
        setFeedback(JSON.parse(stored));
      } catch {
        console.error("Failed to parse feedback");
      }
    }
    
    if (storedWordCount) {
      setWordCount(parseInt(storedWordCount, 10));
    }
  }, []);

  if (!feedback) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Feedback Available</h1>
        <p className="text-muted-foreground mb-6">Submit an essay to see feedback here.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // Handle both nested and flat structures
  const taskComment = feedback.task_response_comment || feedback.task_response?.comment;
  const taskScore = feedback.task_response_score || feedback.task_response?.score_indicator;
  const taskIssues = feedback.task_response_issues || feedback.task_response?.issues;
  
  const coherenceComment = feedback.coherence_comment || feedback.coherence_cohesion?.comment;
  const coherenceScore = feedback.coherence_score || feedback.coherence_cohesion?.score_indicator;
  const coherenceIssues = feedback.coherence_issues || feedback.coherence_cohesion?.issues;
  
  const lexicalComment = feedback.lexical_comment || feedback.lexical_resource?.comment;
  const lexicalScore = feedback.lexical_score || feedback.lexical_resource?.score_indicator;
  const lexicalGood = feedback.lexical_good || feedback.lexical_resource?.good_vocabulary;
  const lexicalErrors = feedback.lexical_errors || feedback.lexical_resource?.errors;
  
  const grammarComment = feedback.grammar_comment || feedback.grammar_accuracy?.comment;
  const grammarScore = feedback.grammar_score || feedback.grammar_accuracy?.score_indicator || feedback.grammar_accuracy?.range;
  const grammarGood = feedback.grammar_good || feedback.grammar_accuracy?.good_sentences || feedback.grammar_accuracy?.highlights;
  const grammarErrors = feedback.grammar_errors || feedback.grammar_accuracy?.errors;
  
  const strengths = feedback.strengths || feedback.overall_strengths;
  const improvements = feedback.improvements || feedback.priority_improvements;
  const overallComment = feedback.overall_comment;
  const estimatedBand = feedback.estimated_band;
  const totalWords = feedback.word_count?.total || wordCount;
  const meetsMinimum = feedback.word_count?.meets_minimum;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drill
        </Button>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Estimated Band: {estimatedBand || "N/A"}
        </Badge>
      </div>

      <h1 className="text-3xl font-bold mb-2">Essay Feedback</h1>
      <p className="text-muted-foreground mb-6">Detailed AI analysis of your IELTS Writing Task 2 essay</p>

      {/* Word Count */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="text-4xl font-bold">{totalWords}</div>
          <div>
            <p className="font-medium">Total Words</p>
            <p className={`text-sm ${meetsMinimum ? "text-green-600" : "text-red-500"}`}>
              {meetsMinimum ? "✓ Meets minimum (250 words)" : "✗ Below minimum (250 words required)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4 Criteria */}
      <div className="space-y-6">
        <FeedbackSection
          title="Task Response"
          score={taskScore}
          comment={taskComment}
          errors={taskIssues}
          errorsLabel="Issues Found"
        />

        <FeedbackSection
          title="Coherence & Cohesion"
          score={coherenceScore}
          comment={coherenceComment}
          errors={coherenceIssues}
          errorsLabel="Issues Found"
        />

        <FeedbackSection
          title="Lexical Resource"
          score={lexicalScore}
          comment={lexicalComment}
          items={lexicalGood}
          itemsLabel="Good Vocabulary"
          errors={lexicalErrors}
          errorsLabel="Vocabulary Errors"
        />

        <FeedbackSection
          title="Grammar Accuracy"
          score={grammarScore}
          comment={grammarComment}
          items={grammarGood}
          itemsLabel="Well-constructed Sentences"
          errors={grammarErrors}
          errorsLabel="Grammar Errors"
        />
      </div>

      <Separator className="my-8" />

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths && strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths identified.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Priority Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {improvements && improvements.length > 0 ? (
              <ol className="space-y-2">
                {improvements.map((p: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500 font-bold">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No improvements suggested.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Comment */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {overallComment || "No overall feedback provided."}
          </p>
        </CardContent>
      </Card>

      {/* Debug: Raw Feedback */}
      <details className="mt-8">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          View Raw AI Response (for debugging)
        </summary>
        <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
          {JSON.stringify(feedback, null, 2)}
        </pre>
      </details>
    </div>
  );
}

