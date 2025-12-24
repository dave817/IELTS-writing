"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Send, Info, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  source?: string;
}

interface OpeningFeedback {
  hook: {
    type: string;
    effectiveness: string;
    comment: string;
  };
  transition: {
    clarity: string;
    comment: string;
  };
  stance: {
    clarity: string;
    points_previewed: number;
    comment: string;
  };
  language: {
    sophistication: string;
    errors: string[];
  };
  overall_comment: string;
  improved_version: string;
}

export default function OpeningDrill() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(480);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<OpeningFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

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
      setTimer(480);
      setIsRunning(true);
      setText("");
      setFeedback(null);
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: "opening",
          prompt: question?.questionText,
          userResponse: text,
        }),
      });
      if (!res.ok) throw new Error("Failed to get feedback");
      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);
      setIsRunning(false);
    } catch {
      toast.error("Failed to get AI feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEffectivenessIcon = (level: string) => {
    if (level === "strong" || level === "clear" || level === "unmistakable") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (level === "adequate" || level === "vague") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Opening Paragraph Drill
            <Badge>Task 2</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: Hook → Transition → Stance (3-4 sentences, ~60 words)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-mono font-bold ${timer < 60 ? "text-red-500" : "text-primary"}`}>
            {formatTime(timer)}
          </div>
          <Button variant="outline" size="icon" onClick={fetchRandomQuestion} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-md">
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

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle>Strategy Reminder</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Don&apos;t just paraphrase!
            1. <strong>Hook:</strong> Engage with controversy/example.
            2. <strong>Transition:</strong> Bridge logic.
            3. <strong>Stance:</strong> Clearly state your position (MP1, MP2, MP3 preview).
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing your opening here..."
              className="min-h-[200px] text-lg leading-relaxed p-4 resize-none focus-visible:ring-1"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Words: {text.trim().split(/\s+/).filter(w => w.length > 0).length} / ~60 target
              </span>
              <Button onClick={submitForFeedback} disabled={submitting || !text.trim()}>
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

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Feedback - Opening Paragraph</DialogTitle>
            <DialogDescription>Analysis by GPT-5.1</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Hook Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getEffectivenessIcon(feedback.hook.effectiveness)}
                    Hook ({feedback.hook.type})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.hook.comment}</p>
                </div>

                {/* Transition Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getEffectivenessIcon(feedback.transition.clarity)}
                    Transition
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.transition.comment}</p>
                </div>

                {/* Stance Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getEffectivenessIcon(feedback.stance.clarity)}
                    Stance (Points previewed: {feedback.stance.points_previewed}/3)
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.stance.comment}</p>
                </div>

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
                  <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">Band 9 Model Opening</h3>
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
