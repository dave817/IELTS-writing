"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Send, ShieldAlert, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
}

interface CounterFeedback {
  acknowledgment: {
    fairness: string;
    opposing_view_strength: string;
    comment: string;
  };
  rebuttal: {
    strategy: string;
    logic: string;
    effectiveness: string;
    comment: string;
  };
  stance_reinforcement: {
    present: boolean;
    strength: string;
  };
  language: {
    sophistication: string;
    errors: string[];
  };
  overall_comment: string;
  improved_version: string;
}

export default function CounterDrill() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<CounterFeedback | null>(null);
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
      setTimer(600);
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
          drillType: "counter",
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

  const getIcon = (value: string | boolean) => {
    if (value === true || value === "fair" || value === "sound" || value === "neutralizes" || value === "strong" || value === "strongest_counter") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (value === "adequate" || value === "partially_addresses" || value === "weak_counter") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Counter-Argument Drill
            <Badge>Task 2</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: Concession → Rebuttal → Reinforce Stance (10 min)
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
        <Card className="border-l-4 border-l-red-500 shadow-md">
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

        <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <AlertTitle>Rebuttal Strategy</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-2 space-y-1">
            <p>1. <strong>Hook:</strong> Fairly acknowledge the opposing view (don&apos;t strawman).</p>
            <p>2. <strong>Counter:</strong> State the specific opposing point.</p>
            <p>3. <strong>Rebuttal:</strong> Destroy it using <em>Alternative Methods</em> or <em>Causal Breakdown</em>.</p>
            <p>4. <strong>Conclusion:</strong> Why your original stance still holds.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start with: &apos;Admittedly, some may argue that...&apos; or &apos;Nevertheless, a voice arises that...&apos;"
              className="min-h-[250px] text-lg leading-relaxed p-4 resize-none focus-visible:ring-1"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Words: {text.trim().split(/\s+/).filter(w => w.length > 0).length} / ~80-90 target
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
            <DialogTitle>AI Feedback - Counter-Argument</DialogTitle>
            <DialogDescription>Analysis by GPT-5.1</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Acknowledgment */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.acknowledgment.fairness)}
                    Acknowledgment ({feedback.acknowledgment.fairness})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.acknowledgment.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    Opposing view strength: {feedback.acknowledgment.opposing_view_strength}
                  </p>
                </div>

                {/* Rebuttal */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.rebuttal.effectiveness)}
                    Rebuttal ({feedback.rebuttal.strategy})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.rebuttal.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    Logic: {feedback.rebuttal.logic} | Effectiveness: {feedback.rebuttal.effectiveness}
                  </p>
                </div>

                {/* Stance Reinforcement */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.stance_reinforcement.present)}
                    Stance Reinforcement
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feedback.stance_reinforcement.present
                      ? `Present with ${feedback.stance_reinforcement.strength} strength.`
                      : "Missing - make sure to reinforce your original stance."}
                  </p>
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
                  <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">Band 9 Model Counter-Argument</h3>
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
