"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Send, Info, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutoSave, formatTimeSince } from "@/lib/hooks/use-auto-save";
import { formatTime, getTimerColorClass, countWords, getQualityIcon } from "@/lib/drill-utils";
import { useDebounceSubmit } from "@/lib/hooks/use-api-request";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
}

interface BodyFeedback {
  topic_sentence: {
    directness: string;
    connection_to_thesis: string;
    comment: string;
  };
  explanation: {
    answers_why: boolean;
    logic: string;
    depth: string;
    comment: string;
  };
  example: {
    specificity: string;
    relevance: string;
    comment: string;
  };
  small_conclusion: {
    present: boolean;
    reinforces_point: boolean;
  };
  logic_flow: {
    coherent: boolean;
    flow_breaks: string[];
  };
  language: {
    sophistication: string;
    errors: string[];
  };
  overall_comment: string;
  improved_version: string;
}

interface SavedSession {
  text: string;
  timer: number;
  questionId?: string;
  questionText?: string;
  savedAt: number;
}

export default function BodyDrill() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [paraType, setParaType] = useState("mp1");
  const [feedback, setFeedback] = useState<BodyFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  // Auto-save hook
  const { save, load, clear } = useAutoSave({ key: "body-drill" });
  
  // Prevent double-submit
  const { withDebounce, isDebouncing } = useDebounceSubmit(1000);

  const wordCount = countWords(text);

  // Check for saved session on mount
  useEffect(() => {
    const saved = load();
    if (saved && saved.text && saved.text.trim().length > 0) {
      setSavedSession(saved as SavedSession);
      setShowRestoreDialog(true);
    } else {
      fetchRandomQuestion();
    }
  }, [load]);

  // Auto-save when text changes
  useEffect(() => {
    if (question && text.trim().length > 0) {
      save({
        text,
        timer,
        questionId: question.id,
        questionText: question.questionText,
      });
    }
  }, [text, timer, question, save]);

  // Restore previous session
  const restoreSession = useCallback(() => {
    if (savedSession) {
      setText(savedSession.text);
      setTimer(savedSession.timer);
      if (savedSession.questionText) {
        setQuestion({
          id: savedSession.questionId || "restored",
          questionText: savedSession.questionText,
          questionType: "Restored",
        });
      }
      setIsRunning(true);
      setShowRestoreDialog(false);
      toast.success("Session restored!");
    }
  }, [savedSession]);

  // Start fresh
  const startFresh = useCallback(() => {
    clear();
    setSavedSession(null);
    setShowRestoreDialog(false);
    fetchRandomQuestion();
  }, [clear]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      toast.warning("Time's up!");
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions/random");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setQuestion(data);
      setTimer(600);
      setIsRunning(true);
      setText("");
      setFeedback(null);
      clear();
    } catch {
      toast.error("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const submitForFeedback = async () => {
    if (!text.trim()) {
      toast.error("Please write something first");
      return;
    }
    
    await withDebounce(async () => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drillType: "body",
            prompt: question?.questionText,
            userResponse: text,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get feedback");
        }
        const data = await res.json();
        setFeedback(data.feedback);
        setShowFeedback(true);
        setIsRunning(false);
        clear();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get AI feedback";
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Body Paragraph Drill
            <Badge>Task 2</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: High Level → Mid Level → Detail logic flow (10 min)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-mono font-bold ${getTimerColorClass(timer)}`}>
            {formatTime(timer)}
          </div>
          <Button variant="outline" size="icon" onClick={fetchRandomQuestion} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Prompt</span>
              <Badge variant="secondary">{question?.questionType || "Loading..."}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed font-medium">
              {question?.questionText || "Loading question..."}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium">Practice Mode:</span>
          <Select value={paraType} onValueChange={setParaType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp1">MP1: Reasoning</SelectItem>
              <SelectItem value="mp2">MP2: Exemplification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
          <Info className="h-4 w-4 text-purple-500" />
          <AlertTitle>Logic Flow Checklist</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-2 space-y-1">
            <p>1. <strong>TS (High):</strong> Direct topic sentence connected to thesis.</p>
            <p>2. <strong>Explain (Mid):</strong> Why is this true? (Logic chain)</p>
            <p>3. <strong>Detail (Low):</strong> Concrete example or evidence.</p>
            <p>4. <strong>SC (Wrap):</strong> Small conclusion linking back.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Write your ${paraType.toUpperCase()} body paragraph here...`}
              className="min-h-[250px] text-lg leading-relaxed p-4 resize-none focus-visible:ring-1"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Words: {wordCount} / ~90-100 target
              </span>
              <Button onClick={submitForFeedback} disabled={submitting || isDebouncing || !text.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit for Feedback
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Session Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RotateCcw className="h-5 w-5" /> 發現未完成的練習
            </DialogTitle>
            <DialogDescription>
              你有一篇 {savedSession ? formatTimeSince(savedSession.savedAt) : ""} 保存的段落。
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-lg text-sm max-h-24 overflow-hidden">
            <p className="line-clamp-3 text-muted-foreground">
              {savedSession?.text?.slice(0, 200)}...
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={startFresh} className="flex-1">
              重新開始
            </Button>
            <Button onClick={restoreSession} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              恢復練習
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Feedback - Body Paragraph</DialogTitle>
            <DialogDescription>Analysis by AI</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Topic Sentence */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getQualityIcon(feedback.topic_sentence.directness)}
                    Topic Sentence ({feedback.topic_sentence.directness})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.topic_sentence.comment}</p>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getQualityIcon(feedback.explanation.logic)}
                    Explanation ({feedback.explanation.depth})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.explanation.comment}</p>
                </div>

                {/* Example */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getQualityIcon(feedback.example.specificity)}
                    Example ({feedback.example.specificity})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.example.comment}</p>
                </div>

                {/* Small Conclusion */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getQualityIcon(feedback.small_conclusion.present)}
                    Small Conclusion
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feedback.small_conclusion.present
                      ? feedback.small_conclusion.reinforces_point
                        ? "Present and reinforces the point well."
                        : "Present but could better reinforce the point."
                      : "Missing - consider adding a small conclusion."}
                  </p>
                </div>

                {/* Logic Flow */}
                {feedback.logic_flow.flow_breaks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-yellow-600">Logic Flow Issues</h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {feedback.logic_flow.flow_breaks.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Language */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Language Sophistication: {feedback.language.sophistication}</h3>
                  {feedback.language.errors.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {feedback.language.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Overall Comment */}
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Overall Feedback</h3>
                  <p className="text-sm">{feedback.overall_comment}</p>
                </div>

                {/* Improved Version */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">Band 9 Model Body Paragraph</h3>
                  <p className="text-sm whitespace-pre-wrap">{feedback.improved_version}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
