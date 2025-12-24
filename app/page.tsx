import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, PenTool, LayoutTemplate, FileText, Clock, BarChart3, Edit3, Library } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          IELTS Writing Band 9 Trainer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Master the art of high-scoring essays through structural templates, rapid point generation, and focused component drills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LayoutTemplate className="mr-2 h-5 w-5 text-blue-500" />
              Template Builder
            </CardTitle>
            <CardDescription>
              Craft and memorize your personal Band 9 templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/templates">Manage Templates</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-green-500" />
              Point Generation
            </CardTitle>
            <CardDescription>
              Train your brain to find points in 30 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/drills/point-generation">Start Drill</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="mr-2 h-5 w-5 text-purple-500" />
              Component Drills
            </CardTitle>
            <CardDescription>
              Practice Opening, Body, and Counter-Arguments separately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/drills/opening">Opening Paragraph</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/drills/body">Body Paragraph</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/drills/counter">Counter-Argument</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-orange-500" />
              Template Fill Drill
            </CardTitle>
            <CardDescription>
              Practice filling your memorized template to write 500+ words.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/drills/template-fill">Start 40-Min Drill</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit3 className="mr-2 h-5 w-5 text-purple-500" />
              Task 2 Full Essay
            </CardTitle>
            <CardDescription>
              Write complete essays with mnemonics and structure guides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-purple-300">
              <Link href="/drills/task2">Start 40-Min Drill</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
              Task 1 Report Drill
            </CardTitle>
            <CardDescription>
              Describe charts, graphs, maps, and processes in 150+ words.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-blue-300">
              <Link href="/drills/task1">Start 20-Min Drill</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-red-500" />
              Full Timed Practice
            </CardTitle>
            <CardDescription>
              Simulate real exam conditions: Task 1 (20 min) + Task 2 (40 min).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="destructive" className="w-full">
              <Link href="/drills/full-practice">Start 60-Min Exam</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-teal-200 dark:border-teal-900">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Library className="mr-2 h-5 w-5 text-teal-500" />
              Vocabulary Reference
            </CardTitle>
            <CardDescription>
              Structure phrases, Task 1 vocab, mnemonics, and essay structures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-teal-300">
              <Link href="/vocabulary">Browse Vocabulary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Current System Status: Full Practice Mode Ready</p>
      </div>
    </div>
  );
}
