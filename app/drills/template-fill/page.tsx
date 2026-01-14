"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { RefreshCw, Send, FileText, Loader2, Clock, AlertCircle, AlertTriangle, Lock, RotateCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAutoSave, formatTimeSince } from "@/lib/hooks/use-auto-save";
import { formatTime, getTimerColorClass, countWords } from "@/lib/drill-utils";
import { useDebounceSubmit } from "@/lib/hooks/use-api-request";

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

interface SavedSession {
  text: string;
  timer: number;
  questionId?: string;
  questionText?: string;
  savedAt?: number;
}

const MIN_WORDS = 500;
const DRILL_TIME = 40 * 60; // 40 minutes in seconds

export default function TemplateFillDrill() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(DRILL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [showLowWordWarning, setShowLowWordWarning] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  // Auto-save hook
  const { save, load, clear } = useAutoSave<SavedSession>({ key: "template-fill-drill" });
  
  // Prevent double-submit
  const { withDebounce, isDebouncing } = useDebounceSubmit(1000);

  const wordCount = countWords(text);

  // Fetch locked templates
  useEffect(() => {
    fetchLockedTemplates();
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const saved = load();
    if (saved && saved.text && saved.text.trim().length > 0) {
      setSavedSession(saved);
      setShowRestoreDialog(true);
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
  }, [clear]);

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
    clear();
    fetchRandomQuestion();
    setTimer(DRILL_TIME);
    setIsRunning(true);
    setText("");
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
    
    await withDebounce(async () => {
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
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get feedback");
        }
        const data = await res.json();
        
        console.log("API Response:", data); // Debug log
        
        // Store feedback in sessionStorage
        const feedbackData = data.feedback || data;
        sessionStorage.setItem("ielts-feedback", JSON.stringify(feedbackData));
        sessionStorage.setItem("ielts-word-count", String(wordCount));
        
        setIsRunning(false);
        clear();
        setSubmitting(false);
        
        // Navigate using window.location for more reliable navigation
        window.location.href = "/drills/feedback";
      } catch (err) {
        console.error("Feedback error:", err); // Debug log
        const message = err instanceof Error ? err.message : "Failed to get AI feedback";
        toast.error(message);
        setSubmitting(false);
      }
    });
  };

  const timerProgress = ((DRILL_TIME - timer) / DRILL_TIME) * 100;

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
          <div className={`text-3xl font-mono font-bold ${getTimerColorClass(timer)}`}>
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
                    <Button onClick={handleSubmit} disabled={submitting || isDebouncing || !text.trim()}>
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

      {/* Restore Session Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RotateCcw className="h-5 w-5" /> 發現未完成的作文
            </DialogTitle>
            <DialogDescription>
              你有一篇 {savedSession?.savedAt ? formatTimeSince(savedSession.savedAt) : ""} 保存的作文，
              共 {savedSession?.text?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} 字。
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-hidden">
            <p className="line-clamp-4 text-muted-foreground">
              {savedSession?.text?.slice(0, 300)}...
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={startFresh} className="flex-1">
              重新開始
            </Button>
            <Button onClick={restoreSession} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              恢復作文
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

    </div>
  );
}
