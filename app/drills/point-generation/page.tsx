"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, Search } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  taskType: string;
  source?: string | null;
}

const MNEMONICS = [
  {
    id: "picc",
    label: "P$ICC (Econ/Career)",
    items: [
      { letter: "P", meaning: "Prosperity & Stability" },
      { letter: "$", meaning: "Money / Cost" },
      { letter: "I", meaning: "Image / Reputation" },
      { letter: "C", meaning: "Competitive Edge" },
      { letter: "C", meaning: "Career Prospects" },
    ],
  },
  {
    id: "hesheit",
    label: "HESHEIT (Personal/Social)",
    items: [
      { letter: "H", meaning: "Health (Physical)" },
      { letter: "E", meaning: "Education" },
      { letter: "S", meaning: "Skills" },
      { letter: "H", meaning: "Happiness / Mental Health" },
      { letter: "E", meaning: "Environment" },
      { letter: "I", meaning: "Interpersonal Relationships" },
      { letter: "T", meaning: "Tourism / Transport" },
    ],
  },
  {
    id: "getqc",
    label: "GETQC (Macro/Abstract)",
    items: [
      { letter: "G", meaning: "Globalization" },
      { letter: "E", meaning: "Ethics / Equality" },
      { letter: "T", meaning: "Technology" },
      { letter: "Q", meaning: "Quality of Life" },
      { letter: "C", meaning: "Culture" },
    ],
  },
  {
    id: "cffsup",
    label: "CFFSUP (Values)",
    items: [
      { letter: "C", meaning: "Creativity" },
      { letter: "F", meaning: "Fairness" },
      { letter: "F", meaning: "Feasibility" },
      { letter: "S", meaning: "Sympathy" },
      { letter: "U", meaning: "Understanding" },
      { letter: "P", meaning: "Principles" },
    ],
  },
];

// Mock Topic Bank Data (In real app, this would be searchable via API or larger JSON)
const TOPIC_BANK = [
  { category: "Education", points: ["Academic development", "Social communication", "Moral values"] },
  { category: "Technology", points: ["Fragmented attention", "Global connectivity", "Digital detox"] },
  { category: "Environment", points: ["Global warming", "Resource scarcity", "Sustainable energy"] },
  { category: "Urbanization", points: ["Traffic congestion", "Healthcare access", "Cost of living"] },
  { category: "Employment", points: ["Job satisfaction", "Work-life balance", "Career progression"] },
];

export default function PointGenerationDrill() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(180); // 3 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [points, setPoints] = useState(["", "", ""]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRandomQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestion(data);
      resetDrill();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const resetDrill = () => {
    setTimer(180);
    setIsRunning(false);
    setPoints(["", "", ""]);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  const filteredTopics = TOPIC_BANK.filter((topic) =>
    topic.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.points.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Point Generation Drill
            <Badge variant="secondary" className="ml-3">
              Task 2
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm">Target: 3 strong points in 3 minutes</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`text-2xl font-mono font-bold ${timer < 30 ? "text-red-500" : ""}`}>
            {formatTime(timer)}
          </div>
          <Button onClick={toggleTimer} variant={isRunning ? "destructive" : "default"}>
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchRandomQuestion} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel: Mnemonics (3 cols) */}
        <div className="col-span-3 border rounded-lg p-4 bg-muted/10 h-fit">
          <h3 className="font-semibold mb-4">Mnemonics Bank</h3>
          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {MNEMONICS.map((m) => (
                <AccordionItem key={m.id} value={m.id}>
                  <AccordionTrigger className="text-sm font-bold">{m.label}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {m.items.map((item, idx) => (
                        <li key={idx} className="text-xs flex justify-between">
                          <span className="font-bold w-4">{item.letter}</span>
                          <span className="text-muted-foreground">{item.meaning}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>

        {/* Center Panel: Question & Input (6 cols) */}
        <div className="col-span-6 space-y-6">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline">{question?.questionType || "Loading..."}</Badge>
                {question?.source && <span className="text-xs text-muted-foreground">{question.source}</span>}
              </div>
              <CardTitle className="text-lg leading-relaxed mt-2">
                {question?.questionText || "Loading question..."}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Best 3 Points</CardTitle>
              <CardDescription>Be specific. Avoid vague words like &quot;good&quot; or &quot;bad&quot;.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {points.map((point, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Point {idx + 1}</label>
                  <Input
                    value={point}
                    onChange={(e) => handlePointChange(idx, e.target.value)}
                    placeholder={`Enter strong point #${idx + 1}...`}
                    disabled={!isRunning && timer > 0 && timer < 180} // Disabled if paused
                  />
                </div>
              ))}
              <Button className="w-full mt-4" disabled={!isRunning}>
                <CheckCircle className="mr-2 h-4 w-4" /> Submit Points
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Topic Bank (3 cols) */}
        <div className="col-span-3 border rounded-lg p-4 bg-muted/10 h-fit">
          <h3 className="font-semibold mb-4">Topic Idea Bank</h3>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[550px]">
            <div className="space-y-4">
              {filteredTopics.map((topic, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-bold text-primary mb-2">{topic.category}</h4>
                  <ul className="space-y-1">
                    {topic.points.map((p, pIdx) => (
                      <li key={pIdx} className="text-xs text-muted-foreground bg-background p-2 rounded border">
                        {p}
                      </li>
                    ))}
                  </ul>
                  {idx < filteredTopics.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
              {filteredTopics.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No topics found.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

