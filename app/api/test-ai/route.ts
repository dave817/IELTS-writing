import { NextResponse } from "next/server";
import { openai, deployment } from "@/lib/openai";

export async function GET() {
  try {
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Azure OpenAI connection successful!' and nothing else." },
      ],
      max_completion_tokens: 50,
    });

    const message = response.choices[0]?.message?.content;
    return NextResponse.json({
      success: true,
      message,
      model: deployment,
    });
  } catch (err) {
    console.error("Azure OpenAI Test Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

