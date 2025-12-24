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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          drillType: "body",
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

  const getIcon = (good: boolean | string) => {
    if (good === true || good === "direct" || good === "clear" || good === "sound" || good === "fully_developed" || good === "concrete" || good === "supports_point") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (good === "adequate" || good === "indirect" || good === "weak" || good === "vague" || good === "tangential") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
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
          <div className={`text-3xl font-mono font-bold ${timer < 60 ? "text-red-500" : "text-primary"}`}>
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
                Words: {text.trim().split(/\s+/).filter(w => w.length > 0).length} / ~90-100 target
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
            <DialogTitle>AI Feedback - Body Paragraph</DialogTitle>
            <DialogDescription>Analysis by GPT-5.1</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Topic Sentence */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.topic_sentence.directness)}
                    Topic Sentence ({feedback.topic_sentence.directness})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.topic_sentence.comment}</p>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.explanation.logic)}
                    Explanation ({feedback.explanation.depth})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.explanation.comment}</p>
                </div>

                {/* Example */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.example.specificity)}
                    Example ({feedback.example.specificity})
                  </h3>
                  <p className="text-sm text-muted-foreground">{feedback.example.comment}</p>
                </div>

                {/* Small Conclusion */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.small_conclusion.present)}
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
