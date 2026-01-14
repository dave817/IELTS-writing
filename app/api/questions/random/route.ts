import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get("taskType"); // "Task 1" | "Task 2"
    const questionType = searchParams.get("questionType"); // "Discussion" | "Opinion" | etc.

    // Build where clause
    const where: { taskType?: string; questionType?: string } = {};
    if (taskType) where.taskType = taskType;
    if (questionType) where.questionType = questionType;
    
    const whereClause = Object.keys(where).length > 0 ? where : undefined;

    // Get count first
    const count = await prisma.question.count({ where: whereClause });

    if (count === 0) {
      // Return helpful error message with filter info
      const filterInfo = whereClause 
        ? `with filters: ${JSON.stringify(whereClause)}` 
        : "";
      return NextResponse.json(
        { 
          error: "No questions found", 
          message: `No questions available ${filterInfo}. Please seed the database first.`,
          hint: "Run: npm run db:seed"
        }, 
        { status: 404 }
      );
    }

    // Use a more reliable random selection method
    // The previous skip method can fail if data changes between count and findFirst
    const skip = Math.floor(Math.random() * count);
    
    const randomQuestion = await prisma.question.findFirst({
      where: whereClause,
      skip,
      select: {
        id: true,
        taskType: true,
        questionType: true,
        questionText: true,
        band9Model: true,
        keyVocabulary: true,
        source: true,
      },
    });

    // Handle edge case where question is null (race condition)
    if (!randomQuestion) {
      // Retry without skip
      const fallbackQuestion = await prisma.question.findFirst({
        where: whereClause,
        select: {
          id: true,
          taskType: true,
          questionType: true,
          questionText: true,
          band9Model: true,
          keyVocabulary: true,
          source: true,
        },
      });
      
      if (!fallbackQuestion) {
        return NextResponse.json(
          { error: "Failed to retrieve question. Please try again." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(fallbackQuestion);
    }

    return NextResponse.json(randomQuestion);
    
  } catch (err) {
    console.error("Random question API error:", err);
    
    // Check for specific Prisma errors
    if (err instanceof Error) {
      if (err.message.includes("Unable to connect")) {
        return NextResponse.json(
          { error: "Database connection failed. Is the database running?" },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to fetch question. Please try again." },
      { status: 500 }
    );
  }
}
