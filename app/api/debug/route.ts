import { NextResponse } from "next/server";

/**
 * Debug endpoint to check environment variables (masked) and configuration
 * Access at: /api/debug
 */
export async function GET() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? "yes" : "no",
    config: {
      endpoint: endpoint ? `${endpoint.slice(0, 30)}...` : "NOT SET",
      apiKey: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "NOT SET",
      deployment: deployment || "NOT SET",
      apiVersion: apiVersion || "NOT SET (using default: 2024-12-01-preview)",
    },
    timestamp: new Date().toISOString(),
  });
}

