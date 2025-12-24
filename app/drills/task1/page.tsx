"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Play,
  RefreshCw,
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Map,
  Workflow,
  Table,
} from "lucide-react";
import { toast } from "sonner";

// Sample Task 1 questions (since we don't have them in the database yet)
const TASK1_QUESTIONS = [
  {
    id: "t1-line-1",
    type: "Line Graph",
    icon: TrendingUp,
    question: `The graph below shows the percentage of the population in four Asian countries living in cities from 1970 to 2020, with predictions for 2030 and 2040.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Data:
- Philippines: 1970 (30%), 1990 (45%), 2010 (55%), 2020 (60%), 2030 (65%), 2040 (70%)
- Malaysia: 1970 (28%), 1990 (50%), 2010 (70%), 2020 (75%), 2030 (80%), 2040 (85%)  
- Thailand: 1970 (20%), 1990 (30%), 2010 (40%), 2020 (50%), 2030 (55%), 2040 (60%)
- Indonesia: 1970 (15%), 1990 (30%), 2010 (45%), 2020 (55%), 2030 (60%), 2040 (65%)`,
  },
  {
    id: "t1-bar-1",
    type: "Bar Chart",
    icon: BarChart3,
    question: `The chart below shows the average daily water consumption per person in five different countries.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Data (liters per person per day):
- USA: 575
- Australia: 493
- Italy: 386
- Brazil: 187
- China: 86`,
  },
  {
    id: "t1-table-1",
    type: "Table",
    icon: Table,
    question: `The table below gives information about the underground railway systems in six major cities.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Data:
| City | Date opened | Kilometers | Passengers/year (millions) |
|------|-------------|------------|---------------------------|
| London | 1863 | 394 | 775 |
| Paris | 1900 | 199 | 1191 |
| Tokyo | 1927 | 155 | 1927 |
| Washington DC | 1976 | 126 | 144 |
| Kyoto | 1981 | 11 | 45 |
| Los Angeles | 2001 | 28 | 50 |`,
  },
  {
    id: "t1-map-1",
    type: "Map",
    icon: Map,
    question: `The two maps below show an island, before and after the construction of some tourist facilities.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Before:
- Small island with trees covering most of the area
- Beach on the western side
- No buildings or facilities

After:
- Reception building near the boat dock (southern area)
- Restaurant in the central area
- Accommodation huts connected by footpaths (western side near beach)
- Swimming area marked on the beach
- Pier for boats (southern area)
- Vehicle track from reception to restaurant
- Some trees remain in the eastern area`,
  },
  {
    id: "t1-process-1",
    type: "Process",
    icon: Workflow,
    question: `The diagram below shows how chocolate is produced.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Process steps:
1. Cacao trees are grown in South America, Africa, and Indonesia
2. Red cacao pods are harvested from the trees
3. White cocoa beans are extracted from the pods
4. Beans are fermented and spread out to dry in the sun
5. Dried beans are packed into sacks and transported by road/ship
6. At the factory, beans are roasted at 350°C
7. Roasted beans are crushed into a paste in a large press
8. Liquid chocolate is pressed from the paste
9. Chocolate is poured into moulds to create the final product`,
  },
];

// Vocabulary reference for Task 1
const VOCABULARY = {
  proportions: [
    { term: "all of the...", range: "100%" },
    { term: "nearly all / the vast majority of the...", range: "~90%" },
    { term: "many of / the majority of the...", range: "~75%" },
    { term: "well over half / more than half of the...", range: "50-75%" },
    { term: "half of the...", range: "50%" },
    { term: "nearly/about half of the...", range: "40-50%" },
    { term: "a third of the...", range: "~30%" },
    { term: "a quarter of the...", range: "25%" },
    { term: "only very few / only a minority", range: "~10%" },
    { term: "none of the...", range: "0%" },
  ],
  trends: {
    up: {
      moderate: ["rise", "increase", "grow", "climb"],
      dramatic: ["jump", "surge", "soar"],
      extreme: ["skyrocket", "peak at"],
    },
    down: {
      moderate: ["dip", "fall", "decline", "drop"],
      dramatic: ["slide", "plunge", "slump"],
      extreme: ["hit bottom", "bottom out"],
    },
    stable: {
      moderate: ["stay constant", "stabilize"],
      dramatic: ["level off"],
      extreme: ["reach a plateau"],
    },
  },
  degree: {
    big: ["significantly", "considerably", "dramatically", "substantially"],
    small: ["slightly", "moderately", "marginally"],
    fast: ["quickly", "sharply", "rapidly", "steeply"],
    slow: ["gradually", "slowly", "steadily"],
  },
  comparisons: [
    "overtake",
    "outnumber",
    "wide gap",
    "narrow gap",
    "double",
    "triple",
    "quadruple",
    "twice as much as",
    "three times higher than",
  ],
  maps: [
    "erect",
    "construct",
    "extend",
    "expand",
    "renovate",
    "modernize",
    "knock down",
    "demolish",
    "adjacent to",
    "opposite to",
    "in the eastern/western/northern/southern part of",
  ],
  processes: [
    "initially",
    "the first step is",
    "the next step is",
    "subsequently",
    "following this",
    "simultaneously",
    "at the same time",
    "finally",
    "the final stage involves",
  ],
};

interface Task1Feedback {
  task_response: {
    prompt_addressed: boolean;
    position_clarity: string;
    development_issues: string[];
    key_features_covered: boolean;
    overview_present: boolean;
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
    data_language_accuracy: string;
  };
  grammar_accuracy: {
    errors: string[];
    range: string;
  };
  word_count: {
    total: number;
    meets_minimum: boolean;
  };
  overall_comment: string;
}

const DRILL_TIME = 20 * 60; // 20 minutes
const MIN_WORDS = 150;

export default function Task1Drill() {
  const [currentQuestion, setCurrentQuestion] = useState(TASK1_QUESTIONS[0]);
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(DRILL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Task1Feedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.warning("Time is up! Consider submitting your report.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const startDrill = () => {
    setTimer(DRILL_TIME);
    setIsRunning(true);
    setText("");
    setFeedback(null);
    toast.success("Drill started! You have 20 minutes.");
  };

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * TASK1_QUESTIONS.length);
    setCurrentQuestion(TASK1_QUESTIONS[randomIndex]);
    setText("");
    setFeedback(null);
    if (!isRunning) {
      setTimer(DRILL_TIME);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please write something first");
      return;
    }

    setSubmitting(true);
    setIsRunning(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: "task1_report",
          prompt: currentQuestion.question,
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
    if (good === true || good === "clear" || good === "skillful" || good === "wide" || good === "accurate") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (good === "adequate" || good === "unclear" || good === "mostly_accurate") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const QuestionIcon = currentQuestion.icon;

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Task 1 Report Drill
            <Badge variant="secondary">{currentQuestion.type}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Goal: Describe the data accurately in 150+ words within 20 minutes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`text-3xl font-mono font-bold ${
              timer < 120 ? "text-red-500" : timer < 300 ? "text-yellow-500" : "text-primary"
            }`}
          >
            <Clock className="inline h-6 w-6 mr-2" />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        {!isRunning ? (
          <Button onClick={startDrill}>
            <Play className="mr-2 h-4 w-4" /> Start Drill
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setIsRunning(false)}>
            Pause
          </Button>
        )}
        <Button variant="outline" onClick={getRandomQuestion}>
          <RefreshCw className="mr-2 h-4 w-4" /> New Question
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Question + Vocabulary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Question Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QuestionIcon className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">{currentQuestion.type}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {currentQuestion.question}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Vocabulary Reference */}
          <Collapsible open={vocabOpen} onOpenChange={setVocabOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-base flex items-center justify-between">
                    Task 1 Vocabulary Reference
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${vocabOpen ? "rotate-180" : ""}`}
                    />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Tabs defaultValue="trends" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="trends" className="text-xs">
                        Trends
                      </TabsTrigger>
                      <TabsTrigger value="proportions" className="text-xs">
                        Proportions
                      </TabsTrigger>
                      <TabsTrigger value="other" className="text-xs">
                        Other
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trends" className="mt-3">
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="font-semibold text-green-600 mb-1">↑ Increase</p>
                          <p className="text-muted-foreground">
                            Moderate: {VOCABULARY.trends.up.moderate.join(", ")}
                          </p>
                          <p className="text-muted-foreground">
                            Dramatic: {VOCABULARY.trends.up.dramatic.join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-600 mb-1">↓ Decrease</p>
                          <p className="text-muted-foreground">
                            Moderate: {VOCABULARY.trends.down.moderate.join(", ")}
                          </p>
                          <p className="text-muted-foreground">
                            Dramatic: {VOCABULARY.trends.down.dramatic.join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600 mb-1">→ Stable</p>
                          <p className="text-muted-foreground">
                            {VOCABULARY.trends.stable.moderate.join(", ")},{" "}
                            {VOCABULARY.trends.stable.dramatic.join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Degree</p>
                          <p className="text-muted-foreground">
                            Big: {VOCABULARY.degree.big.join(", ")}
                          </p>
                          <p className="text-muted-foreground">
                            Fast: {VOCABULARY.degree.fast.join(", ")}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="proportions" className="mt-3">
                      <div className="space-y-1 text-xs">
                        {VOCABULARY.proportions.map((p, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-muted-foreground">{p.term}</span>
                            <Badge variant="outline" className="text-xs">
                              {p.range}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="other" className="mt-3">
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="font-semibold mb-1">Comparisons</p>
                          <p className="text-muted-foreground">
                            {VOCABULARY.comparisons.slice(0, 5).join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Maps</p>
                          <p className="text-muted-foreground">
                            {VOCABULARY.maps.slice(0, 6).join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Processes</p>
                          <p className="text-muted-foreground">
                            {VOCABULARY.processes.slice(0, 5).join(", ")}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Writing Tips */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Task 1 Tips</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>• Start with an overview of the main trends/features</p>
              <p>• Select and group key data points logically</p>
              <p>• Use varied vocabulary for trends and comparisons</p>
              <p>• Include specific data to support your description</p>
            </AlertDescription>
          </Alert>
        </div>

        {/* Right: Writing Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Your Report</CardTitle>
                <span
                  className={`text-sm font-medium ${
                    wordCount >= MIN_WORDS ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {wordCount} / {MIN_WORDS} words
                  {wordCount >= MIN_WORDS && " ✓"}
                </span>
              </div>
              <CardDescription>
                Describe the information presented. Include an overview and key features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="The chart/graph/diagram shows...

Overall, it is clear that...

Looking at the details..."
                className="min-h-[400px] text-base leading-relaxed font-serif resize-none"
              />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {wordCount < MIN_WORDS && (
                    <Badge variant="outline" className="text-yellow-600">
                      {MIN_WORDS - wordCount} more words needed
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

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Task 1 Report Feedback</DialogTitle>
            <DialogDescription>AI analysis of your data description</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {feedback && (
              <div className="space-y-4">
                {/* Word Count */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{feedback.word_count?.total || wordCount}</div>
                  <div>
                    <p className="font-medium">Total Words</p>
                    <p
                      className={`text-sm ${
                        feedback.word_count?.meets_minimum ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {feedback.word_count?.meets_minimum ? "✓ Meets minimum (150)" : "✗ Below 150 words"}
                    </p>
                  </div>
                </div>

                {/* Task Achievement */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.task_response?.prompt_addressed)}
                    Task Achievement
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getIcon(feedback.task_response?.overview_present)}
                      <span>Overview: {feedback.task_response?.overview_present ? "Present" : "Missing"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getIcon(feedback.task_response?.key_features_covered)}
                      <span>
                        Key Features: {feedback.task_response?.key_features_covered ? "Covered" : "Missing"}
                      </span>
                    </div>
                  </div>
                  {feedback.task_response?.development_issues?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                      {feedback.task_response.development_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Coherence */}
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
                  <h3 className="font-semibold flex items-center gap-2">
                    {getIcon(feedback.lexical_resource?.data_language_accuracy)}
                    Lexical Resource (Data Language: {feedback.lexical_resource?.data_language_accuracy})
                  </h3>
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
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

