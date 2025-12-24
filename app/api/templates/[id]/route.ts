import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, templateText, isLocked } = body;

    const template = await prisma.userTemplate.update({
      where: { id },
      data: {
        name,
        templateText,
        isLocked,
        version: { increment: 1 },
      },
    });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.userTemplate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

