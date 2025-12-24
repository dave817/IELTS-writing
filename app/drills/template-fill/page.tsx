"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Send, FileText, Loader2, CheckCircle, XCircle, AlertTriangle, Clock, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
}

interface Template {
  id: string;
  name: string;
  templateText: string;
  isLocked: boolean;
}

interface FullFeedback {
  task_response: {
    prompt_addressed: boolean;
    position_clarity: string;
    development_issues: string[];
    relevance_flags: string[];
  };
  coherence_cohesion: {
    paragraph_structure: string;
    cohesive_device_issues: string[];
    logic_flow: {
      coherent: boolean;
      adequate: boolean;
      consistent: boolean;
      breaks: string[];
    };
  };
  lexical_resource: {
    precision_issues: string[];
    collocation_errors: string[];
    register_issues: string[];
  };
  grammar_accuracy: {
    errors: string[];
    range: string;
  };
  band_9_comparison: {
    model: string;
    key_differences: string[];
    upgrade_suggestions: string[];
  };
  word_count: {
    total: number;
    meets_minimum: boolean;
  };
  overall_comment: string;
}

const MIN_WORDS = 500;
const DRILL_TIME = 40 * 60; // 40 minutes in seconds

export default function TemplateFillDrill() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(DRILL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<FullFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLowWordWarning, setShowLowWordWarning] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  // Fetch locked templates
  useEffect(() => {
    fetchLockedTemplates();
  }, []);

  const fetchLockedTemplates = async () => {
    try {
      const res = await fetch("/api/templates?locked=true");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTemplates(data.filter((t: Template) => t.isLocked));
    } catch {
      toast.error("Failed to load templates");
    }
  };

  const fetchRandomQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions/random");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setQuestion(data);
    } catch {
      toast.error("Failed to load question");
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      toast.warning("Time's up! Consider submitting your essay.");
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const startDrill = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    fetchRandomQuestion();
    setTimer(DRILL_TIME);
    setIsRunning(true);
    setText("");
    setFeedback(null);
  };

  const handleSubmit = () => {
    if (wordCount < MIN_WORDS) {
      setShowLowWordWarning(true);
      return;
    }
    submitForFeedback();
  };

  const submitForFeedback = async () => {
    if (!text.trim()) {
      toast.error("Please write something first");
      return;
    }
    setShowLowWordWarning(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: "template_fill",
          prompt: question?.questionText,
          userResponse: text,
          userTemplate: selectedTemplate?.templateText,
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

  const timerProgress = ((DRILL_TIME - timer) / DRILL_TIME) * 100;

  const getIcon = (good: boolean | string) => {
    if (good === true || good === "clear" || good === "skillful" || good === "wide") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (good === "adequate" || good === "unclear") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Template Fill Drill
            <Badge>Task 2</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: Fill your memorized template to produce 500+ words in 40 minutes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-mono font-bold ${timer < 300 ? "text-red-500" : "text-primary"}`}>
            <Clock className="inline h-6 w-6 mr-2" />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Setup Phase */}
      {!isRunning && !question && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Setup Your Practice Session</CardTitle>
            <CardDescription>Select a locked template to begin the drill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Locked Template</label>
              <Select
                value={selectedTemplate?.id || ""}
                onValueChange={(val) => {
                  const t = templates.find((t) => t.id === val);
                  setSelectedTemplate(t || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No locked templates available.
                    </SelectItem>
                  ) : (
                    templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Template Preview
                </h4>
                <ScrollArea className="h-[200px]">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedTemplate.templateText}
                  </p>
                </ScrollArea>
              </div>
            )}

            {templates.length === 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                <Lock className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-700 dark:text-yellow-400">No Locked Templates</AlertTitle>
                <AlertDescription className="text-yellow-600 dark:text-yellow-500">
                  You need to create and <strong>lock</strong> a template in the{" "}
                  <Link href="/templates" className="underline font-medium">
                    Template Builder
                  </Link>{" "}
                  before you can use this drill.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={startDrill} className="w-full" disabled={!selectedTemplate || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Start 40-Minute Drill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Writing Phase */}
      {(isRunning || question) && (
        <div className="grid gap-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Time Elapsed</span>
              <span>{Math.round(timerProgress)}%</span>
            </div>
            <Progress value={timerProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Template Reference */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Your Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">
                    {selectedTemplate?.templateText}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: Question + Writing Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{question?.questionType}</Badge>
                    <Button variant="ghost" size="icon" onClick={fetchRandomQuestion} disabled={loading}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg leading-relaxed">
                    {question?.questionText || "Loading..."}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Start writing your essay by filling in your template..."
                    className="min-h-[350px] text-base leading-relaxed p-4 resize-none focus-visible:ring-1 font-serif"
                  />
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${wordCount < MIN_WORDS ? "text-red-500" : "text-green-600"}`}>
                        Words: {wordCount} / {MIN_WORDS} minimum
                      </span>
                      {wordCount < MIN_WORDS && (
                        <Badge variant="destructive" className="text-xs">
                          {MIN_WORDS - wordCount} more needed
                        </Badge>
                      )}
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
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
          </div>
        </div>
      )}

      {/* Low Word Count Warning Dialog */}
      <Dialog open={showLowWordWarning} onOpenChange={setShowLowWordWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" /> Word Count Warning
            </DialogTitle>
            <DialogDescription>
              Your essay has only <strong>{wordCount}</strong> words. The minimum target is <strong>{MIN_WORDS}</strong> words.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low word count affects your score</AlertTitle>
            <AlertDescription>
              In the real IELTS exam, essays under 250 words receive a penalty. Band 9 essays typically have 500+ words.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowLowWordWarning(false)} className="flex-1">
              Continue Writing
            </Button>
            <Button variant="destructive" onClick={submitForFeedback} className="flex-1">
              Submit Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Feedback - Full Essay Analysis</DialogTitle>
            <DialogDescription>Comprehensive analysis by GPT-5.1</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Word Count */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{feedback.word_count?.total || wordCount}</div>
                  <div>
                    <p className="font-medium">Total Words</p>
                    <p className={`text-sm ${feedback.word_count?.meets_minimum ? "text-green-600" : "text-red-500"}`}>
                      {feedback.word_count?.meets_minimum ? "✓ Meets minimum" : "✗ Below minimum"}
                    </p>
                  </div>
                </div>

                {/* Task Response */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.task_response?.prompt_addressed)}
                    Task Response
                  </h3>
                  <p className="text-sm">Position Clarity: {feedback.task_response?.position_clarity}</p>
                  {feedback.task_response?.development_issues?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {feedback.task_response.development_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Coherence & Cohesion */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.coherence_cohesion?.paragraph_structure)}
                    Coherence & Cohesion ({feedback.coherence_cohesion?.paragraph_structure})
                  </h3>
                  {feedback.coherence_cohesion?.logic_flow?.breaks?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {feedback.coherence_cohesion.logic_flow.breaks.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {feedback.coherence_cohesion?.cohesive_device_issues?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {feedback.coherence_cohesion.cohesive_device_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Lexical Resource */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Lexical Resource</h3>
                  {feedback.lexical_resource?.collocation_errors?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Collocation Errors:</p>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {feedback.lexical_resource.collocation_errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.lexical_resource?.precision_issues?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Precision Issues:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {feedback.lexical_resource.precision_issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Grammar */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.grammar_accuracy?.range)}
                    Grammar Accuracy ({feedback.grammar_accuracy?.range} range)
                  </h3>
                  {feedback.grammar_accuracy?.errors?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {feedback.grammar_accuracy.errors.map((err, i) => (
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

                {/* Band 9 Comparison */}
                {feedback.band_9_comparison && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Comparison with Band 9</h3>
                    {feedback.band_9_comparison.key_differences?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Key Differences:</p>
                        <ul className="list-disc list-inside text-sm">
                          {feedback.band_9_comparison.key_differences.map((diff, i) => (
                            <li key={i}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.band_9_comparison.upgrade_suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Upgrade Suggestions:</p>
                        <ul className="list-disc list-inside text-sm text-blue-600">
                          {feedback.band_9_comparison.upgrade_suggestions.map((sug, i) => (
                            <li key={i}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.band_9_comparison.model && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Band 9 Model Essay</h4>
                        <p className="text-sm whitespace-pre-wrap">{feedback.band_9_comparison.model}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

