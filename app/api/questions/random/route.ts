import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Optional filter by type

    const count = await prisma.question.count({
      where: type ? { questionType: type } : undefined,
    });

    if (count === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    const randomQuestion = await prisma.question.findFirst({
      where: type ? { questionType: type } : undefined,
      skip,
    });

    return NextResponse.json(randomQuestion);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch random question" }, { status: 500 });
  }
}

