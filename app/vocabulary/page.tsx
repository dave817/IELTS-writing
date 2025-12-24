"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Lightbulb,
  Target,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// ==================== TASK 2 STRUCTURE PHRASES ====================
const STRUCTURE_PHRASES = {
  introduction: {
    title: "Introduction",
    icon: FileText,
    phrases: [
      "It is clearly seen from the above that...",
      "After detailed consideration, I believe that...",
      "I am strongly committed to the idea that...",
      "All in all, I am of the opinion that...",
      "In contemporary society, [TOPIC] has become a subject of considerable debate.",
      "It is often argued that..., while others contend that...",
    ],
  },
  firstArgument: {
    title: "First Argument",
    icon: ArrowRight,
    phrases: [
      "There are a number of reasons why [SVO], the first being that...",
      "The arguments for my stance are numerous, with [noun phrase] being the most significant one.",
      "First and foremost, it is evident/apparent/clear that...",
      "To start with, we must bear in mind that...",
      "The primary reason for this is that...",
    ],
  },
  secondArgument: {
    title: "Second Argument",
    icon: ArrowRight,
    phrases: [
      "Closely connected with the above point is that...",
      "What must also be taken into consideration is that...",
      "Another factor often overlooked is that...",
      "Equally important is the argument that...",
      "Furthermore, it should be noted that...",
      "In addition to this, one cannot ignore the fact that...",
    ],
  },
  counterArgument: {
    title: "Counter-Argument",
    icon: MessageSquare,
    subCategories: {
      reporting: ["argue", "assert", "claim", "contend", "insist", "maintain"],
      critique: ["counter", "attack", "criticize", "question", "be skeptical of"],
      weak: ["invalid", "untenable", "unjustifiable", "ill-founded", "groundless", "implausible", "flawed", "specious"],
      strong: ["valid", "tenable", "justifiable", "well-founded", "reasonable", "convincing", "compelling"],
    },
    phrases: [
      "Opponents may counter my stance, claiming that...",
      "Undeniably, ...; however, alternatives are always readily available.",
      "While some argue that..., this view fails to consider...",
      "Admittedly, ...; nevertheless, this does not negate the fact that...",
    ],
  },
  conclusion: {
    title: "Conclusion",
    icon: Target,
    phrases: [
      "Taking all aspects into consideration, we can clearly see that...",
      "All in all / On the whole / By and large / To sum up...",
      "From what has been examined above, the claim that [SVO] is unsubstantiated.",
      "In light of the arguments presented, it is evident that...",
      "To conclude, I firmly believe that...",
    ],
  },
  smallConclusion: {
    title: "Small Conclusions (for paragraphs)",
    icon: Check,
    phrases: [
      "With this in mind, it is clear that...",
      "It is therefore unwise for [Subject] to [Verb]...",
      "This, undoubtedly, explains why...",
      "Consequently, it can be seen that...",
      "This clearly demonstrates that...",
    ],
  },
};

// ==================== TASK 1 VOCABULARY ====================
const TASK1_VOCABULARY = {
  proportions: {
    title: "Proportions",
    items: [
      { phrase: "all of the...", range: "100%" },
      { phrase: "nearly all / the vast majority of the...", range: "~90%" },
      { phrase: "many of / the majority of the...", range: "~75%" },
      { phrase: "well over half / more than half of the...", range: "50-75%" },
      { phrase: "half of the...", range: "50%" },
      { phrase: "nearly/about half of the...", range: "40-50%" },
      { phrase: "a third of the... / only a minority", range: "~30%" },
      { phrase: "a quarter of the...", range: "25%" },
      { phrase: "a fifth of the...", range: "20%" },
      { phrase: "only very few / only a minority", range: "~10%" },
      { phrase: "none of the...", range: "0%" },
    ],
  },
  trends: {
    title: "Trends",
    categories: {
      up: {
        icon: TrendingUp,
        color: "text-green-600",
        moderate: ["rise", "increase", "grow", "climb"],
        dramatic: ["jump", "surge", "soar"],
        extreme: ["skyrocket", "peak at"],
      },
      down: {
        icon: TrendingDown,
        color: "text-red-600",
        moderate: ["dip", "fall", "decline", "drop"],
        dramatic: ["slide", "plunge", "slump"],
        extreme: ["hit bottom", "bottom out"],
      },
      stable: {
        icon: Minus,
        color: "text-blue-600",
        moderate: ["stay constant", "stabilize", "remain steady"],
        dramatic: ["level off"],
        extreme: ["reach a plateau", "flatten out"],
      },
    },
  },
  degree: {
    title: "Degree Adverbs",
    categories: {
      big: {
        label: "Big Change",
        words: ["significantly", "considerably", "dramatically", "substantially", "markedly", "noticeably"],
      },
      small: {
        label: "Small Change",
        words: ["slightly", "moderately", "marginally", "minimally", "fractionally"],
      },
      fast: {
        label: "Fast Change",
        words: ["quickly", "sharply", "rapidly", "steeply", "abruptly", "suddenly"],
      },
      slow: {
        label: "Slow Change",
        words: ["gradually", "slowly", "steadily", "progressively", "incrementally"],
      },
    },
  },
  comparisons: {
    title: "Static Comparisons",
    words: [
      "overtake",
      "outnumber",
      "exceed",
      "surpass",
      "wide gap",
      "narrow gap",
      "double",
      "triple",
      "quadruple",
      "twice as much as",
      "three times higher than",
      "half as many as",
      "equal to",
      "the same as",
    ],
  },
  maps: {
    title: "Maps & Changes",
    categories: {
      construction: ["erect", "construct", "build", "establish", "install"],
      expansion: ["extend", "expand", "enlarge", "widen", "develop"],
      renovation: ["renovate", "modernize", "upgrade", "refurbish", "transform"],
      demolition: ["knock down", "demolish", "remove", "clear", "replace"],
      location: [
        "adjacent to",
        "opposite to",
        "next to",
        "in the eastern/western/northern/southern part of",
        "in the center of",
        "on the outskirts of",
        "surrounded by",
      ],
    },
  },
  processes: {
    title: "Process Language",
    categories: {
      sequence: ["initially", "firstly", "to begin with", "at the outset"],
      continuation: ["the next step is", "subsequently", "following this", "after that", "then"],
      simultaneous: ["simultaneously", "at the same time", "concurrently", "meanwhile"],
      conclusion: ["finally", "lastly", "the final stage involves", "ultimately"],
    },
  },
  tone: {
    title: "Tone Markers",
    categories: {
      positive: ["Surprisingly", "Remarkably", "Notably", "Impressively", "Significantly"],
      negative: ["Lamentably", "Regrettably", "Unfortunately", "Alarmingly", "Disappointingly"],
    },
  },
};

// ==================== MNEMONICS ====================
const MNEMONICS = {
  PSICC: {
    name: "P$ICC",
    category: "Economic/Career",
    color: "bg-green-100 dark:bg-green-900/30",
    points: [
      { letter: "P", meaning: "Prosperity and stability", example: "economic growth, financial security" },
      { letter: "$", meaning: "Money", example: "income, savings, investment returns" },
      { letter: "I", meaning: "Image", example: "reputation, brand, public perception" },
      { letter: "C", meaning: "Competitive edge", example: "market advantage, unique skills" },
      { letter: "C", meaning: "Career prospects", example: "job opportunities, promotions" },
    ],
  },
  HESHEIT: {
    name: "HESHEIT",
    category: "Personal/Social",
    color: "bg-blue-100 dark:bg-blue-900/30",
    points: [
      { letter: "H", meaning: "Physical health", example: "fitness, nutrition, disease prevention" },
      { letter: "E", meaning: "Education", example: "learning, knowledge, academic achievement" },
      { letter: "S", meaning: "Skills", example: "abilities, competencies, expertise" },
      { letter: "H", meaning: "Mental health / Happiness", example: "well-being, stress, satisfaction" },
      { letter: "E", meaning: "Environmental", example: "pollution, climate, sustainability" },
      { letter: "I", meaning: "Interpersonal relationships", example: "family, friends, community" },
      { letter: "T", meaning: "Tourism", example: "travel, cultural exchange, hospitality" },
    ],
  },
  GETQC: {
    name: "GETQC",
    category: "Macro/Abstract",
    color: "bg-purple-100 dark:bg-purple-900/30",
    points: [
      { letter: "G", meaning: "Government / Policy", example: "regulations, legislation, public services" },
      { letter: "E", meaning: "Ethics / Morality", example: "right vs wrong, values, principles" },
      { letter: "T", meaning: "Technology", example: "innovation, automation, digital transformation" },
      { letter: "Q", meaning: "Quality of life", example: "living standards, convenience, comfort" },
      { letter: "C", meaning: "Culture / Tradition", example: "heritage, customs, identity" },
    ],
  },
  CFFSUP: {
    name: "CFFSUP",
    category: "Support Development",
    color: "bg-orange-100 dark:bg-orange-900/30",
    points: [
      { letter: "C", meaning: "Cause", example: "Why does this happen?" },
      { letter: "F", meaning: "Frequency", example: "How often? How widespread?" },
      { letter: "F", meaning: "Feeling", example: "How do people feel about this?" },
      { letter: "S", meaning: "Solution", example: "What can be done?" },
      { letter: "U", meaning: "Use / Application", example: "How is it applied in practice?" },
      { letter: "P", meaning: "Problem if not", example: "What happens if we don't address this?" },
    ],
  },
};

// ==================== QUESTION STRUCTURES ====================
const QUESTION_STRUCTURES = {
  TypeA: {
    name: "Type A: Discuss Both Views",
    percentage: "19.2%",
    structure: [
      { part: "Introduction", content: "Paraphrase + mention both views + your stance" },
      { part: "Body 1", content: "View A with reasons and examples" },
      { part: "Body 2", content: "View B with reasons and examples" },
      { part: "Body 3 (optional)", content: "Your opinion with support" },
      { part: "Conclusion", content: "Summarize + restate position" },
    ],
  },
  TypeB: {
    name: "Type B: To What Extent / Opinion",
    percentage: "35.4%",
    structure: [
      { part: "Introduction", content: "Paraphrase + clear stance" },
      { part: "Body 1", content: "First supporting argument with example" },
      { part: "Body 2", content: "Second supporting argument with example" },
      { part: "Body 3 (optional)", content: "Counter-argument + rebuttal" },
      { part: "Conclusion", content: "Summarize + strengthen position" },
    ],
  },
  TypeC: {
    name: "Type C: Advantages & Disadvantages",
    percentage: "16.8%",
    structure: [
      { part: "Introduction", content: "Paraphrase topic + indicate discussion" },
      { part: "Body 1", content: "Advantages (2-3 points with examples)" },
      { part: "Body 2", content: "Disadvantages (2-3 points with examples)" },
      { part: "Conclusion", content: "Overall assessment / balanced view" },
    ],
  },
  TypeD: {
    name: "Type D: Problems/Causes/Solutions",
    percentage: "17.9%",
    structure: [
      { part: "Introduction", content: "Acknowledge the issue" },
      { part: "Body 1", content: "Causes/Problems explained with examples" },
      { part: "Body 2", content: "Solutions proposed with explanations" },
      { part: "Conclusion", content: "Summarize + call to action" },
    ],
  },
  TypeE: {
    name: "Type E: Direct Questions",
    percentage: "10.7%",
    structure: [
      { part: "Introduction", content: "Address the topic briefly" },
      { part: "Body 1", content: "Answer question 1 fully" },
      { part: "Body 2", content: "Answer question 2 fully" },
      { part: "Body 3", content: "Answer question 3 (if applicable)" },
      { part: "Conclusion", content: "Tie all answers together" },
    ],
  },
};

export default function VocabularyReference() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Vocabulary Reference
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive vocabulary and structure phrases for IELTS Writing Band 9
        </p>
      </div>

      <Tabs defaultValue="task2" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6">
          <TabsTrigger value="task2">Task 2 Phrases</TabsTrigger>
          <TabsTrigger value="task1">Task 1 Vocab</TabsTrigger>
          <TabsTrigger value="mnemonics">Mnemonics</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
        </TabsList>

        {/* ==================== TASK 2 STRUCTURE PHRASES ==================== */}
        <TabsContent value="task2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(STRUCTURE_PHRASES).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {"subCategories" in section && section.subCategories ? (
                      <div className="space-y-3">
                        {Object.entries(section.subCategories).map(([cat, words]) => (
                          <div key={cat}>
                            <p className="text-xs font-semibold text-muted-foreground capitalize mb-1">
                              {cat}:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(words as string[]).map((word, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => copyToClipboard(word, `${key}-${cat}-${i}`)}
                                >
                                  {word}
                                  {copied === `${key}-${cat}-${i}` && <Check className="ml-1 h-3 w-3" />}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Separator className="my-2" />
                      </div>
                    ) : null}
                    <ul className="space-y-2">
                      {section.phrases.map((phrase, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2 group cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => copyToClipboard(phrase, `${key}-phrase-${i}`)}
                        >
                          <span className="text-primary">•</span>
                          <span className="flex-1">{phrase}</span>
                          {copied === `${key}-phrase-${i}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ==================== TASK 1 VOCABULARY ==================== */}
        <TabsContent value="task1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Proportions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.proportions.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {TASK1_VOCABULARY.proportions.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                      onClick={() => copyToClipboard(item.phrase, `prop-${i}`)}
                    >
                      <span className="text-muted-foreground">{item.phrase}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.range}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.trends.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(TASK1_VOCABULARY.trends.categories).map(([direction, data]) => {
                    const Icon = data.icon;
                    return (
                      <div key={direction}>
                        <div className={`flex items-center gap-2 mb-2 ${data.color}`}>
                          <Icon className="h-4 w-4" />
                          <span className="font-semibold capitalize text-sm">{direction}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Moderate: </span>
                            {data.moderate.join(", ")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dramatic: </span>
                            {data.dramatic.join(", ")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Extreme: </span>
                            {data.extreme.join(", ")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Degree */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.degree.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(TASK1_VOCABULARY.degree.categories).map(([key, data]) => (
                    <div key={key}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{data.label}:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.words.map((word, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => copyToClipboard(word, `degree-${key}-${i}`)}
                          >
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comparisons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.comparisons.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TASK1_VOCABULARY.comparisons.words.map((word, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => copyToClipboard(word, `comp-${i}`)}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.maps.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(TASK1_VOCABULARY.maps.categories).map(([cat, words]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-muted-foreground capitalize mb-1">{cat}:</p>
                      <p className="text-xs text-muted-foreground">{words.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Processes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{TASK1_VOCABULARY.processes.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(TASK1_VOCABULARY.processes.categories).map(([cat, words]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-muted-foreground capitalize mb-1">{cat}:</p>
                      <p className="text-xs text-muted-foreground">{words.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== MNEMONICS ==================== */}
        <TabsContent value="mnemonics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(MNEMONICS).map(([key, mnemonic]) => (
              <Card key={key} className={mnemonic.color}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      {mnemonic.name}
                    </span>
                    <Badge variant="secondary">{mnemonic.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mnemonic.points.map((point, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {point.letter}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{point.meaning}</p>
                          <p className="text-xs text-muted-foreground">{point.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==================== QUESTION STRUCTURES ==================== */}
        <TabsContent value="structures">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(QUESTION_STRUCTURES).map(([key, structure]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {structure.name}
                    </span>
                    <Badge>{structure.percentage}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {structure.structure.map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {item.part}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

