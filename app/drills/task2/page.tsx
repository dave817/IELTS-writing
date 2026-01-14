"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RefreshCw,
  Send,
  Loader2,
  Clock,
  ChevronDown,
  Lightbulb,
  Target,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoSave, formatTimeSince } from "@/lib/hooks/use-auto-save";
import { formatTime, getTimerColorClass, countWords, getQualityIcon, getWordCountProgress } from "@/lib/drill-utils";
import { useDebounceSubmit } from "@/lib/hooks/use-api-request";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullFeedback = Record<string, any>;

// Mnemonics for point generation
const MNEMONICS = {
  PSICC: {
    name: "P$ICC",
    category: "Economic/Career",
    points: [
      { letter: "P", meaning: "Prosperity and stability" },
      { letter: "$", meaning: "Money" },
      { letter: "I", meaning: "Image" },
      { letter: "C", meaning: "Competitive edge" },
      { letter: "C", meaning: "Career prospects" },
    ],
  },
  HESHEIT: {
    name: "HESHEIT",
    category: "Personal/Social",
    points: [
      { letter: "H", meaning: "Physical health" },
      { letter: "E", meaning: "Education" },
      { letter: "S", meaning: "Skills" },
      { letter: "H", meaning: "Mental health / Happiness" },
      { letter: "E", meaning: "Environmental" },
      { letter: "I", meaning: "Interpersonal relationships" },
      { letter: "T", meaning: "Tourism" },
    ],
  },
  GETQC: {
    name: "GETQC",
    category: "Macro/Abstract",
    points: [
      { letter: "G", meaning: "Government / Policy" },
      { letter: "E", meaning: "Ethics / Morality" },
      { letter: "T", meaning: "Technology" },
      { letter: "Q", meaning: "Quality of life" },
      { letter: "C", meaning: "Culture / Tradition" },
    ],
  },
  CFFSUP: {
    name: "CFFSUP",
    category: "Support Development",
    points: [
      { letter: "C", meaning: "Cause" },
      { letter: "F", meaning: "Frequency" },
      { letter: "F", meaning: "Feeling" },
      { letter: "S", meaning: "Solution" },
      { letter: "U", meaning: "Use / Application" },
      { letter: "P", meaning: "Problem if not" },
    ],
  },
};

// Question type structures - keys match seed.js questionType values
const QUESTION_STRUCTURES: Record<string, { name: string; structure: string[] }> = {
  // Discussion = Discuss Both Views + Give Opinion
  "Discussion": {
    name: "Discuss Both Views",
    structure: [
      "Introduction: Paraphrase + stance",
      "Body 1: View A with reasons/examples",
      "Body 2: View B with reasons/examples",
      "Body 3 (optional): Your opinion with support",
      "Conclusion: Summarize + restate position",
    ],
  },
  // Opinion = To What Extent Do You Agree
  "Opinion": {
    name: "To What Extent / Opinion",
    structure: [
      "Introduction: Paraphrase + clear stance",
      "Body 1: First supporting argument",
      "Body 2: Second supporting argument",
      "Body 3: Counter-argument + rebuttal (optional)",
      "Conclusion: Summarize + strengthen position",
    ],
  },
  // Advantage/Disadvantage
  "Advantage/Disadvantage": {
    name: "Advantages & Disadvantages",
    structure: [
      "Introduction: Paraphrase topic",
      "Body 1: Advantages (2-3 points)",
      "Body 2: Disadvantages (2-3 points)",
      "Conclusion: Overall assessment",
    ],
  },
  // Solution = Problems/Causes/Solutions
  "Solution": {
    name: "Problems/Causes/Solutions",
    structure: [
      "Introduction: Acknowledge the issue",
      "Body 1: Causes/Problems explained",
      "Body 2: Solutions proposed",
      "Conclusion: Summarize + call to action",
    ],
  },
  // Direct Questions
  "Direct Questions": {
    name: "Direct Questions",
    structure: [
      "Introduction: Address the topic",
      "Body 1: Answer question 1",
      "Body 2: Answer question 2",
      "Body 3: Answer question 3 (if applicable)",
      "Conclusion: Tie answers together",
    ],
  },
  // Task 1 types
  "Chart": {
    name: "Data Description (Chart/Graph)",
    structure: [
      "Introduction: Paraphrase the chart type and time period",
      "Overview: Key trends and main features (2-3 sentences)",
      "Body 1: First group of data with specific figures",
      "Body 2: Second group with comparisons",
    ],
  },
  "Map": {
    name: "Map Comparison",
    structure: [
      "Introduction: Describe the maps and time period",
      "Overview: Main changes/developments",
      "Body 1: Major changes in one area",
      "Body 2: Changes in other areas",
    ],
  },
  "Process": {
    name: "Process Description",
    structure: [
      "Introduction: Describe what the process shows",
      "Overview: Number of stages, type of process",
      "Body 1: First half of the process",
      "Body 2: Second half of the process",
    ],
  },
  // Fallback for restored sessions
  "Restored": {
    name: "Restored Session",
    structure: [
      "Continue from where you left off",
    ],
  },
};

const DRILL_TIME = 40 * 60; // 40 minutes
const MIN_WORDS = 250;
const TARGET_WORDS = 500;

interface SavedSession {
  text: string;
  timer: number;
  questionId?: string;
  questionText?: string;
  savedAt?: number;
}

export default function Task2Drill() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(DRILL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FullFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mnemonicsOpen, setMnemonicsOpen] = useState(true);
  const [structureOpen, setStructureOpen] = useState(false);
  const [showLowWordWarning, setShowLowWordWarning] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  // Auto-save hook
  const { save, load, clear } = useAutoSave<SavedSession>({ key: "task2-drill" });
  
  // Prevent double-submit
  const { withDebounce, isDebouncing } = useDebounceSubmit(1000);

  const wordCount = countWords(text);
  const progress = getWordCountProgress(wordCount, TARGET_WORDS);

  // Check for saved session on mount
  useEffect(() => {
    const saved = load();
    if (saved && saved.text && saved.text.trim().length > 0) {
      setSavedSession(saved);
      setShowRestoreDialog(true);
    }
  }, [load]);

  // Auto-save when text or timer changes (only when drill is active)
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
      toast.success("Session restored! Continue where you left off.");
    }
  }, [savedSession]);

  // Start fresh (discard saved session)
  const startFresh = useCallback(() => {
    clear();
    setSavedSession(null);
    setShowRestoreDialog(false);
  }, [clear]);

  // Fetch random question
  const fetchQuestion = useCallback(async () => {
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
        setTimer((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.warning("Time is up! Consider submitting your essay.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const startDrill = async () => {
    clear(); // Clear any previous saved session
    await fetchQuestion();
    setTimer(DRILL_TIME);
    setIsRunning(true);
    setText("");
    setFeedback(null);
    toast.success("Drill started! You have 40 minutes to write 500+ words.");
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

    // Prevent double-submit
    await withDebounce(async () => {
      setShowLowWordWarning(false);
      setSubmitting(true);
      setIsRunning(false);

      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drillType: "template_fill",
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
        clear(); // Clear saved session on successful submission
        
        // Show warning if there was a parse issue
        if (data.parseWarning) {
          toast.warning(data.parseWarning);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get AI feedback";
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  // formatTime and getQualityIcon are now imported from @/lib/drill-utils

  const currentStructure = question?.questionType
    ? QUESTION_STRUCTURES[question.questionType]
    : null;

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Task 2 Full Essay Drill
            {question && <Badge variant="secondary">{question.questionType}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: Write a complete essay of 500+ words in 40 minutes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`text-3xl font-mono font-bold ${getTimerColorClass(timer)}`}
          >
            <Clock className="inline h-6 w-6 mr-2" />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        {!isRunning && !question ? (
          <Button onClick={startDrill} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start Drill
              </>
            )}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Resume
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchQuestion} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> New Question
            </Button>
          </>
        )}
      </div>

      {question && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Question + Resources */}
          <div className="lg:col-span-1 space-y-4">
            {/* Question Card */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{question.questionType}</Badge>
                  {currentStructure && (
                    <Badge variant="secondary" className="text-xs">
                      {currentStructure.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">Essay Question</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <p className="text-sm leading-relaxed">{question.questionText}</p>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Essay Structure */}
            {currentStructure && (
              <Collapsible open={structureOpen} onOpenChange={setStructureOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          Essay Structure
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${structureOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <ol className="text-xs space-y-1 list-decimal list-inside">
                        {currentStructure.structure.map((step, i) => (
                          <li key={i} className="text-muted-foreground">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Mnemonics Panel */}
            <Collapsible open={mnemonicsOpen} onOpenChange={setMnemonicsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Point Generation Mnemonics
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${mnemonicsOpen ? "rotate-180" : ""}`}
                      />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="PSICC" className="w-full">
                      <TabsList className="grid grid-cols-4 w-full h-auto">
                        {Object.entries(MNEMONICS).map(([key, data]) => (
                          <TabsTrigger key={key} value={key} className="text-xs px-1 py-1">
                            {data.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {Object.entries(MNEMONICS).map(([key, data]) => (
                        <TabsContent key={key} value={key} className="mt-2">
                          <p className="text-xs text-muted-foreground mb-2">{data.category}</p>
                          <div className="space-y-1">
                            {data.points.map((point, i) => (
                              <div key={i} className="flex gap-2 text-xs">
                                <span className="font-bold text-primary w-4">{point.letter}</span>
                                <span className="text-muted-foreground">{point.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Writing Tips */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Band 9 Tips</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>• Use sophisticated language (conditionals, inversions)</p>
                <p>• Include specific examples to support each point</p>
                <p>• Ensure clear paragraph structure</p>
                <p>• Write at least 500 words for Band 9</p>
              </AlertDescription>
            </Alert>
          </div>

          {/* Right: Writing Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Your Essay</CardTitle>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        wordCount >= TARGET_WORDS
                          ? "text-green-600"
                          : wordCount >= MIN_WORDS
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {wordCount} words
                    </span>
                  </div>
                </div>
                <CardDescription>Write a well-structured essay addressing the question</CardDescription>
                {/* Progress bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress to 500 words</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="In recent years, [TOPIC] has become a subject of considerable debate. While some argue that [VIEW A], others contend that [VIEW B]. This essay will discuss both perspectives before presenting my own viewpoint.

On the one hand, proponents of [VIEW A] argue that...

On the other hand, supporters of [VIEW B] believe that...

In my opinion, I firmly believe that...

In conclusion, while both sides present valid arguments..."
                  className="min-h-[450px] text-base leading-relaxed font-serif resize-none"
                />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {wordCount < MIN_WORDS && (
                      <Badge variant="outline" className="text-red-600">
                        {MIN_WORDS - wordCount} more words to minimum
                      </Badge>
                    )}
                    {wordCount >= MIN_WORDS && wordCount < TARGET_WORDS && (
                      <Badge variant="outline" className="text-yellow-600">
                        {TARGET_WORDS - wordCount} more for Band 9 target
                      </Badge>
                    )}
                    {wordCount >= TARGET_WORDS && (
                      <Badge className="bg-green-600">✓ Band 9 word count achieved</Badge>
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
      )}

      {/* Start Screen */}
      {!question && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Task 2 Full Essay Practice</CardTitle>
            <CardDescription>
              Practice writing complete IELTS Task 2 essays with AI feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 border rounded-lg">
                <p className="font-semibold">Time</p>
                <p className="text-muted-foreground">40 minutes</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-semibold">Target Words</p>
                <p className="text-muted-foreground">500+ (minimum 250)</p>
              </div>
            </div>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>What you will get</AlertTitle>
              <AlertDescription className="text-sm">
                A random Task 2 question, point generation mnemonics, essay structure guide, and
                comprehensive AI feedback including a Band 9 model answer comparison.
              </AlertDescription>
            </Alert>
            <Button onClick={startDrill} className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Start 40-Minute Essay Drill
            </Button>
          </CardContent>
        </Card>
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
              共 {savedSession?.text?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} 字，
              剩餘時間 {savedSession ? Math.floor(savedSession.timer / 60) : 0} 分鐘。
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

      {/* Low Word Count Warning */}
      <Dialog open={showLowWordWarning} onOpenChange={setShowLowWordWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" /> Word Count Warning
            </DialogTitle>
            <DialogDescription>
              Your essay has only <strong>{wordCount}</strong> words. The minimum is{" "}
              <strong>{MIN_WORDS}</strong> words, but Band 9 essays typically have{" "}
              <strong>{TARGET_WORDS}+</strong> words.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low word count affects your score</AlertTitle>
            <AlertDescription>
              Essays under 250 words receive penalties in the real IELTS exam.
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
          <DialogHeader className="pb-2">
            <DialogTitle>Essay Feedback</DialogTitle>
            <DialogDescription>Comprehensive AI analysis of your IELTS Writing Task 2</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-4">
                {/* Summary Header */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Word Count */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <div className="text-3xl font-bold tabular-nums">{feedback.word_count?.total || wordCount}</div>
                    <div>
                      <p className="text-sm font-medium">Words</p>
                      <p className={`text-xs ${feedback.word_count?.meets_minimum ? "text-green-600" : "text-red-500"}`}>
                        {feedback.word_count?.meets_minimum ? "✓ Meets minimum" : "✗ Below 250"}
                      </p>
                    </div>
                  </div>
                  {/* Band Score */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800">
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                      {/* Extract just the band number */}
                      {feedback.estimated_band?.match(/\d+\.?\d*[-–]?\d*\.?\d*/)?.[0] || feedback.estimated_band?.slice(0, 10) || "N/A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Est. Band</p>
                      {feedback.estimated_band && feedback.estimated_band.includes("(") && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {feedback.estimated_band.match(/\(([^)]+)\)/)?.[1] || ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4 Criteria Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Task Response */}
                  <div className={`space-y-2 p-4 rounded-lg border-l-4 ${
                    feedback.task_response_score === "good" ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/20" :
                    feedback.task_response_score === "adequate" ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20" :
                    "border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {getQualityIcon(feedback.task_response_score)}
                        Task Response
                      </h3>
                      {feedback.task_response_score && (
                        <Badge variant="outline" className="text-xs capitalize">{feedback.task_response_score}</Badge>
                      )}
                    </div>
                    {feedback.task_response_comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{feedback.task_response_comment}</p>
                    )}
                    {feedback.task_response_issues?.length > 0 && (
                      <ul className="text-xs space-y-1 mt-2">
                        {feedback.task_response_issues.slice(0, 3).map((issue: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                            <span className="mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Coherence & Cohesion */}
                  <div className={`space-y-2 p-4 rounded-lg border-l-4 ${
                    feedback.coherence_score === "good" ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/20" :
                    feedback.coherence_score === "adequate" ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20" :
                    "border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {getQualityIcon(feedback.coherence_score)}
                        Coherence & Cohesion
                      </h3>
                      {feedback.coherence_score && (
                        <Badge variant="outline" className="text-xs capitalize">{feedback.coherence_score}</Badge>
                      )}
                    </div>
                    {feedback.coherence_comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{feedback.coherence_comment}</p>
                    )}
                    {feedback.coherence_issues?.length > 0 && (
                      <ul className="text-xs space-y-1 mt-2">
                        {feedback.coherence_issues.slice(0, 3).map((issue: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                            <span className="mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Lexical Resource */}
                  <div className={`space-y-2 p-4 rounded-lg border-l-4 ${
                    feedback.lexical_score === "good" ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/20" :
                    feedback.lexical_score === "adequate" ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20" :
                    "border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {getQualityIcon(feedback.lexical_score)}
                        Lexical Resource
                      </h3>
                      {feedback.lexical_score && (
                        <Badge variant="outline" className="text-xs capitalize">{feedback.lexical_score}</Badge>
                      )}
                    </div>
                    {feedback.lexical_comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{feedback.lexical_comment}</p>
                    )}
                    {feedback.lexical_good?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {feedback.lexical_good.slice(0, 4).map((item: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {feedback.lexical_errors?.length > 0 && (
                      <ul className="text-xs space-y-1 mt-2">
                        {feedback.lexical_errors.slice(0, 2).map((err: string, i: number) => (
                          <li key={i} className="text-red-600 dark:text-red-400">• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Grammar Accuracy */}
                  <div className={`space-y-2 p-4 rounded-lg border-l-4 ${
                    feedback.grammar_score === "good" ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/20" :
                    feedback.grammar_score === "adequate" ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20" :
                    "border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {getQualityIcon(feedback.grammar_score)}
                        Grammar Accuracy
                      </h3>
                      {feedback.grammar_score && (
                        <Badge variant="outline" className="text-xs capitalize">{feedback.grammar_score}</Badge>
                      )}
                    </div>
                    {feedback.grammar_comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{feedback.grammar_comment}</p>
                    )}
                    {feedback.grammar_good?.length > 0 && (
                      <div className="text-xs mt-2 p-2 bg-green-100/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <p className="text-green-700 dark:text-green-400 italic">"{feedback.grammar_good[0]}"</p>
                      </div>
                    )}
                    {feedback.grammar_errors?.length > 0 && (
                      <ul className="text-xs space-y-1 mt-2">
                        {feedback.grammar_errors.slice(0, 2).map((err: string, i: number) => (
                          <li key={i} className="text-red-600 dark:text-red-400">• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.strengths?.length > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                          ✨ Strengths
                        </h4>
                        <ul className="text-sm space-y-1">
                          {feedback.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.improvements?.length > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                          🎯 Priority Improvements
                        </h4>
                        <ol className="text-sm space-y-1">
                          {feedback.improvements.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">{i + 1}.</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Overall Comment */}
                {feedback.overall_comment && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      📝 Overall Assessment
                    </h3>
                    <p className="text-sm leading-relaxed">{feedback.overall_comment}</p>
                  </div>
                )}

                {/* Debug: Raw Response */}
                <details className="text-xs border-t pt-4 mt-4">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View Raw AI Response (debug)
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-48 text-[10px]">
                    {JSON.stringify(feedback, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

