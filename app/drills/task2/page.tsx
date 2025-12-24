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
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Lightbulb,
  Target,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
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

// Question type structures
const QUESTION_STRUCTURES = {
  "Type A": {
    name: "Discuss Both Views",
    structure: [
      "Introduction: Paraphrase + stance",
      "Body 1: View A with reasons/examples",
      "Body 2: View B with reasons/examples",
      "Body 3 (optional): Your opinion with support",
      "Conclusion: Summarize + restate position",
    ],
  },
  "Type B": {
    name: "To What Extent / Opinion",
    structure: [
      "Introduction: Paraphrase + clear stance",
      "Body 1: First supporting argument",
      "Body 2: Second supporting argument",
      "Body 3: Counter-argument + rebuttal (optional)",
      "Conclusion: Summarize + strengthen position",
    ],
  },
  "Type C": {
    name: "Advantages & Disadvantages",
    structure: [
      "Introduction: Paraphrase topic",
      "Body 1: Advantages (2-3 points)",
      "Body 2: Disadvantages (2-3 points)",
      "Conclusion: Overall assessment",
    ],
  },
  "Type D": {
    name: "Problems/Causes/Solutions",
    structure: [
      "Introduction: Acknowledge the issue",
      "Body 1: Causes/Problems explained",
      "Body 2: Solutions proposed",
      "Conclusion: Summarize + call to action",
    ],
  },
  "Type E": {
    name: "Direct Questions",
    structure: [
      "Introduction: Address the topic",
      "Body 1: Answer question 1",
      "Body 2: Answer question 2",
      "Body 3: Answer question 3 (if applicable)",
      "Conclusion: Tie answers together",
    ],
  },
};

const DRILL_TIME = 40 * 60; // 40 minutes
const MIN_WORDS = 250;
const TARGET_WORDS = 500;

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

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const progress = Math.min(100, (wordCount / TARGET_WORDS) * 100);

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

      if (!res.ok) throw new Error("Failed to get feedback");
      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);
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
    if (good === true || good === "clear" || good === "skillful" || good === "wide") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (good === "adequate" || good === "unclear") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const currentStructure = question?.questionType
    ? QUESTION_STRUCTURES[question.questionType as keyof typeof QUESTION_STRUCTURES]
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
            className={`text-3xl font-mono font-bold ${
              timer < 300 ? "text-red-500" : timer < 600 ? "text-yellow-500" : "text-primary"
            }`}
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
          <DialogHeader>
            <DialogTitle>Full Essay Feedback</DialogTitle>
            <DialogDescription>Comprehensive AI analysis of your essay</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-6">
                {/* Word Count */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{feedback.word_count?.total || wordCount}</div>
                  <div>
                    <p className="font-medium">Total Words</p>
                    <p
                      className={`text-sm ${
                        feedback.word_count?.meets_minimum ? "text-green-600" : "text-red-500"
                      }`}
                    >
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
                    <h3 className="font-semibold">Band 9 Comparison</h3>
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
                        <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                          Band 9 Model Essay
                        </h4>
                        <ScrollArea className="h-[300px]">
                          <p className="text-sm whitespace-pre-wrap">{feedback.band_9_comparison.model}</p>
                        </ScrollArea>
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

