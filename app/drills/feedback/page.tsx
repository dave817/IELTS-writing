"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feedback = Record<string, any>;

function getIcon(value: string | boolean | undefined | null) {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") {
    return value ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  }
  const v = String(value).toLowerCase();
  if (v.includes("good") || v.includes("wide") || v.includes("clear") || v.includes("smooth") || v.includes("strong")) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (v.includes("adequate") || v.includes("moderate") || v.includes("ok")) {
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
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment}</p>
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
                  <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
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
                  <span>{typeof err === 'string' ? err : JSON.stringify(err)}</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load feedback from sessionStorage
    try {
      const stored = sessionStorage.getItem("ielts-feedback");
      const storedWordCount = sessionStorage.getItem("ielts-word-count");
      
      console.log("Loading from sessionStorage:", stored); // Debug
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Parsed feedback:", parsed); // Debug
        setFeedback(parsed);
      }
      
      if (storedWordCount) {
        setWordCount(parseInt(storedWordCount, 10));
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading feedback...</p>
      </div>
    );
  }

  // No feedback available
  if (!feedback) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Feedback Available</h1>
        <p className="text-muted-foreground mb-6">Submit an essay to see feedback here.</p>
        <Button onClick={() => router.push("/drills/template-fill")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Template Fill Drill
        </Button>
      </div>
    );
  }

  // Extract feedback data - handle multiple possible field names
  // Task Response
  const taskComment = feedback.task_response_comment 
    || feedback.taskResponseComment
    || feedback.task_response?.comment
    || feedback.taskResponse?.comment;
  const taskScore = feedback.task_response_score 
    || feedback.taskResponseScore
    || feedback.task_response?.score_indicator
    || feedback.task_response?.score
    || feedback.taskResponse?.score;
  const taskIssues = feedback.task_response_issues 
    || feedback.taskResponseIssues
    || feedback.task_response?.issues
    || feedback.taskResponse?.issues;
  
  // Coherence & Cohesion
  const coherenceComment = feedback.coherence_comment 
    || feedback.coherenceComment
    || feedback.coherence_cohesion?.comment
    || feedback.coherenceCohesion?.comment;
  const coherenceScore = feedback.coherence_score 
    || feedback.coherenceScore
    || feedback.coherence_cohesion?.score_indicator
    || feedback.coherence_cohesion?.score
    || feedback.coherenceCohesion?.score;
  const coherenceIssues = feedback.coherence_issues 
    || feedback.coherenceIssues
    || feedback.coherence_cohesion?.issues
    || feedback.coherenceCohesion?.issues;
  
  // Lexical Resource
  const lexicalComment = feedback.lexical_comment 
    || feedback.lexicalComment
    || feedback.lexical_resource?.comment
    || feedback.lexicalResource?.comment;
  const lexicalScore = feedback.lexical_score 
    || feedback.lexicalScore
    || feedback.lexical_resource?.score_indicator
    || feedback.lexical_resource?.score
    || feedback.lexical_resource?.range
    || feedback.lexicalResource?.score;
  const lexicalGood = feedback.lexical_good 
    || feedback.lexicalGood
    || feedback.lexical_resource?.good_vocabulary
    || feedback.lexical_resource?.good
    || feedback.lexicalResource?.good;
  const lexicalErrors = feedback.lexical_errors 
    || feedback.lexicalErrors
    || feedback.lexical_resource?.errors
    || feedback.lexicalResource?.errors;
  
  // Grammar Accuracy
  const grammarComment = feedback.grammar_comment 
    || feedback.grammarComment
    || feedback.grammar_accuracy?.comment
    || feedback.grammarAccuracy?.comment;
  const grammarScore = feedback.grammar_score 
    || feedback.grammarScore
    || feedback.grammar_accuracy?.score_indicator
    || feedback.grammar_accuracy?.score
    || feedback.grammar_accuracy?.range
    || feedback.grammarAccuracy?.score;
  const grammarGood = feedback.grammar_good 
    || feedback.grammarGood
    || feedback.grammar_accuracy?.good_sentences
    || feedback.grammar_accuracy?.good
    || feedback.grammar_accuracy?.highlights
    || feedback.grammarAccuracy?.good;
  const grammarErrors = feedback.grammar_errors 
    || feedback.grammarErrors
    || feedback.grammar_accuracy?.errors
    || feedback.grammarAccuracy?.errors;
  
  // Overall
  const strengths = feedback.strengths 
    || feedback.overall_strengths
    || feedback.overallStrengths;
  const improvements = feedback.improvements 
    || feedback.priority_improvements
    || feedback.priorityImprovements;
  const overallComment = feedback.overall_comment 
    || feedback.overallComment;
  const estimatedBand = feedback.estimated_band 
    || feedback.estimatedBand
    || feedback.band;
  const totalWords = feedback.word_count?.total 
    || feedback.wordCount?.total
    || feedback.words
    || wordCount;
  const meetsMinimum = (
    feedback.word_count?.meets_minimum 
    || feedback.wordCount?.meetsMinimum
  ) ?? (totalWords >= 250);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/drills/template-fill")}>
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
                    <span>{typeof s === 'string' ? s : JSON.stringify(s)}</span>
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
                    <span>{typeof p === 'string' ? p : JSON.stringify(p)}</span>
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {overallComment || "No overall feedback provided."}
          </p>
        </CardContent>
      </Card>

      {/* Debug: Raw Feedback - Always visible for debugging */}
      <Card className="mt-8 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Debug: Raw AI Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(feedback, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
