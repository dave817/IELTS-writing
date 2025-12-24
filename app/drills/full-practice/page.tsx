"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  SkipForward,
  Send,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  taskType: string;
}

interface TaskFeedback {
  task_response: {
    prompt_addressed: boolean;
    position_clarity: string;
    development_issues: string[];
  };
  coherence_cohesion: {
    paragraph_structure: string;
    cohesive_device_issues: string[];
    logic_flow: {
      coherent: boolean;
      breaks: string[];
    };
  };
  lexical_resource: {
    precision_issues: string[];
    collocation_errors: string[];
  };
  grammar_accuracy: {
    errors: string[];
    range: string;
  };
  overall_comment: string;
  word_count: {
    total: number;
    meets_minimum: boolean;
  };
}

interface FullFeedback {
  task1: TaskFeedback | null;
  task2: TaskFeedback | null;
}

// Constants
const TASK1_TIME = 20 * 60; // 20 minutes
const TASK2_TIME = 40 * 60; // 40 minutes
const TOTAL_TIME = TASK1_TIME + TASK2_TIME;
const TASK1_MIN_WORDS = 150;
const TASK2_MIN_WORDS = 250;

type Phase = "setup" | "task1" | "task2" | "review";

export default function FullTimedPractice() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [timer, setTimer] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [task1Question, setTask1Question] = useState<Question | null>(null);
  const [task2Question, setTask2Question] = useState<Question | null>(null);
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FullFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState("task1");

  const task1WordCount = task1Text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const task2WordCount = task2Text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          // Auto-switch from Task 1 to Task 2 when 40 minutes remain
          if (phase === "task1" && newTime <= TASK2_TIME) {
            toast.info("Task 1 time is up! Moving to Task 2.");
            setPhase("task2");
          }
          // Time is up
          if (newTime <= 0) {
            setIsRunning(false);
            toast.warning("Time is up! Submitting your essays...");
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, phase]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch two random questions (ideally one Task 1 and one Task 2)
      // For now, we'll use Task 2 questions for both but label them appropriately
      const [res1, res2] = await Promise.all([
        fetch("/api/questions/random"),
        fetch("/api/questions/random"),
      ]);

      if (!res1.ok || !res2.ok) throw new Error("Failed to fetch questions");

      const q1 = await res1.json();
      const q2 = await res2.json();

      // Assign as Task 1 and Task 2
      setTask1Question({ ...q1, taskType: "Task 1" });
      setTask2Question({ ...q2, taskType: "Task 2" });
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  const startPractice = async () => {
    await fetchQuestions();
    setTimer(TOTAL_TIME);
    setPhase("task1");
    setIsRunning(true);
    setTask1Text("");
    setTask2Text("");
    setFeedback(null);
    toast.success("Practice started! You have 60 minutes total.");
  };

  const togglePause = () => {
    setIsRunning((prev) => !prev);
    toast.info(isRunning ? "Timer paused" : "Timer resumed");
  };

  const skipToTask2 = () => {
    if (phase === "task1") {
      setPhase("task2");
      toast.info("Moved to Task 2. Remaining time carries over.");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setIsRunning(false);

    try {
      // Get feedback for both tasks
      const [res1, res2] = await Promise.all([
        task1Text.trim()
          ? fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                drillType: "task1_report",
                prompt: task1Question?.questionText,
                userResponse: task1Text,
              }),
            })
          : Promise.resolve(null),
        task2Text.trim()
          ? fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                drillType: "template_fill",
                prompt: task2Question?.questionText,
                userResponse: task2Text,
              }),
            })
          : Promise.resolve(null),
      ]);

      const task1Feedback = res1 && res1.ok ? (await res1.json()).feedback : null;
      const task2Feedback = res2 && res2.ok ? (await res2.json()).feedback : null;

      setFeedback({ task1: task1Feedback, task2: task2Feedback });
      setPhase("review");
      setShowFeedback(true);
    } catch {
      toast.error("Failed to get feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getElapsedProgress = () => {
    return ((TOTAL_TIME - timer) / TOTAL_TIME) * 100;
  };

  const getPhaseProgress = () => {
    if (phase === "task1") {
      const task1Elapsed = TASK1_TIME - (timer - TASK2_TIME);
      return Math.min(100, (task1Elapsed / TASK1_TIME) * 100);
    }
    if (phase === "task2") {
      const task2Elapsed = TASK2_TIME - timer;
      return Math.min(100, (task2Elapsed / TASK2_TIME) * 100);
    }
    return 100;
  };

  const getIcon = (good: boolean | string) => {
    if (good === true || good === "clear" || good === "skillful" || good === "wide") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (good === "adequate" || good === "unclear") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const renderFeedbackSection = (taskFeedback: TaskFeedback | null, taskNum: number) => {
    if (!taskFeedback) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No response submitted for Task {taskNum}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Word Count */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
          <div className="text-xl font-bold">{taskFeedback.word_count?.total || 0}</div>
          <div>
            <p className="font-medium">Words</p>
            <p
              className={`text-sm ${
                taskFeedback.word_count?.meets_minimum ? "text-green-600" : "text-red-500"
              }`}
            >
              {taskFeedback.word_count?.meets_minimum ? "✓ Meets minimum" : "✗ Below minimum"}
            </p>
          </div>
        </div>

        {/* Task Response */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            {getIcon(taskFeedback.task_response?.prompt_addressed)}
            Task Response
          </h4>
          <p className="text-sm">Position: {taskFeedback.task_response?.position_clarity}</p>
          {taskFeedback.task_response?.development_issues?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {taskFeedback.task_response.development_issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Coherence */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            {getIcon(taskFeedback.coherence_cohesion?.paragraph_structure)}
            Coherence & Cohesion
          </h4>
          {taskFeedback.coherence_cohesion?.logic_flow?.breaks?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {taskFeedback.coherence_cohesion.logic_flow.breaks.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Lexical Resource */}
        <div className="space-y-2">
          <h4 className="font-semibold">Lexical Resource</h4>
          {taskFeedback.lexical_resource?.collocation_errors?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-red-600">
              {taskFeedback.lexical_resource.collocation_errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Grammar */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            {getIcon(taskFeedback.grammar_accuracy?.range)}
            Grammar ({taskFeedback.grammar_accuracy?.range} range)
          </h4>
          {taskFeedback.grammar_accuracy?.errors?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-red-600">
              {taskFeedback.grammar_accuracy.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Overall */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-semibold mb-1">Overall</h4>
          <p className="text-sm">{taskFeedback.overall_comment}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Full Timed Practice
            <Badge variant="destructive">Exam Simulation</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete both Task 1 (20 min) and Task 2 (40 min) under exam conditions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`text-3xl font-mono font-bold ${
              timer < 300 ? "text-red-500" : timer < 600 ? "text-yellow-500" : "text-primary"
            }`}
          >
            <Clock className="inline h-6 w-6 mr-2" />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Setup Phase */}
      {phase === "setup" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              IELTS Writing Exam Simulation
            </CardTitle>
            <CardDescription>
              Practice both tasks under real exam time constraints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Task 1 (20 minutes)</h3>
                <p className="text-sm text-muted-foreground">
                  Describe data, a map, or a process. Minimum 150 words.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Task 2 (40 minutes)</h3>
                <p className="text-sm text-muted-foreground">
                  Write an essay on a given topic. Minimum 250 words (aim for 500+).
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Exam Conditions</AlertTitle>
              <AlertDescription>
                Once started, the timer will run continuously. You can pause if needed, but try to
                complete without breaks for realistic practice.
              </AlertDescription>
            </Alert>

            <Button onClick={startPractice} className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" /> Start 60-Minute Practice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Writing Phase (Task 1 or Task 2) */}
      {(phase === "task1" || phase === "task2") && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {phase === "task1" ? "Task 1" : "Task 2"} - {Math.round(getPhaseProgress())}%
              </span>
              <span className="text-muted-foreground">
                Total: {Math.round(getElapsedProgress())}%
              </span>
            </div>
            <Progress value={getElapsedProgress()} className="h-2" />
            <div className="flex gap-2">
              <div
                className={`h-1 flex-1 rounded ${
                  phase === "task1" ? "bg-blue-500" : "bg-green-500"
                }`}
                style={{ width: `${(TASK1_TIME / TOTAL_TIME) * 100}%` }}
              />
              <div
                className={`h-1 flex-1 rounded ${
                  phase === "task2" ? "bg-purple-500" : "bg-muted"
                }`}
                style={{ width: `${(TASK2_TIME / TOTAL_TIME) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={togglePause}>
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
            {phase === "task1" && (
              <Button variant="outline" onClick={skipToTask2}>
                <SkipForward className="mr-2 h-4 w-4" /> Skip to Task 2
              </Button>
            )}
            <div className="flex-1" />
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Both Tasks
                </>
              )}
            </Button>
          </div>

          {/* Task Tabs */}
          <Tabs value={phase} onValueChange={(v) => setPhase(v as Phase)}>
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="task1" className="relative">
                Task 1
                {task1WordCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {task1WordCount}w
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="task2" className="relative">
                Task 2
                {task2WordCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {task2WordCount}w
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="task1" className="mt-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge>Task 1 - Report</Badge>
                    <span
                      className={`text-sm font-medium ${
                        task1WordCount >= TASK1_MIN_WORDS ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      {task1WordCount} / {TASK1_MIN_WORDS} min
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-relaxed mt-2">
                    {task1Question?.questionText || "Loading..."}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={task1Text}
                    onChange={(e) => setTask1Text(e.target.value)}
                    placeholder="Describe the information presented in the visual..."
                    className="min-h-[300px] text-base leading-relaxed"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="task2" className="mt-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">Task 2 - Essay</Badge>
                    <span
                      className={`text-sm font-medium ${
                        task2WordCount >= TASK2_MIN_WORDS ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      {task2WordCount} / {TASK2_MIN_WORDS} min (500+ recommended)
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-relaxed mt-2">
                    {task2Question?.questionText || "Loading..."}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={task2Text}
                    onChange={(e) => setTask2Text(e.target.value)}
                    placeholder="Write your essay here..."
                    className="min-h-[400px] text-base leading-relaxed font-serif"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Review Phase */}
      {phase === "review" && (
        <div className="space-y-6">
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-400">
              Practice Complete!
            </AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-500">
              Review your feedback below, then start another practice session.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={() => setPhase("setup")} variant="outline">
              Start New Practice
            </Button>
            <Button onClick={() => setShowFeedback(true)}>View Detailed Feedback</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task 1 Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{task1WordCount} words</p>
                <p
                  className={`text-sm ${
                    task1WordCount >= TASK1_MIN_WORDS ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {task1WordCount >= TASK1_MIN_WORDS
                    ? "✓ Met minimum"
                    : `✗ ${TASK1_MIN_WORDS - task1WordCount} more needed`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task 2 Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{task2WordCount} words</p>
                <p
                  className={`text-sm ${
                    task2WordCount >= TASK2_MIN_WORDS ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {task2WordCount >= TASK2_MIN_WORDS
                    ? "✓ Met minimum"
                    : `✗ ${TASK2_MIN_WORDS - task2WordCount} more needed`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Full Practice Feedback</DialogTitle>
            <DialogDescription>AI analysis of both tasks</DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="task1">Task 1 Feedback</TabsTrigger>
              <TabsTrigger value="task2">Task 2 Feedback</TabsTrigger>
            </TabsList>
            <ScrollArea className="max-h-[60vh] mt-4">
              <TabsContent value="task1">
                {renderFeedbackSection(feedback?.task1 || null, 1)}
              </TabsContent>
              <TabsContent value="task2">
                {renderFeedbackSection(feedback?.task2 || null, 2)}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

