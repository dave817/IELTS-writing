import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locked = searchParams.get("locked"); // "true" | "false" | null

    const where =
      locked === "true" ? { isLocked: true } : locked === "false" ? { isLocked: false } : undefined;

    const templates = await prisma.userTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, templateText, isLocked } = body;

    const template = await prisma.userTemplate.create({
      data: {
        name,
        templateText,
        isLocked: isLocked || false,
      },
    });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

