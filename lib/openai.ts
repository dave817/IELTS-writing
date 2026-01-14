import { AzureOpenAI } from "openai";

// Environment variables - these will be checked at runtime, not build time
// Support multiple common variable names for flexibility
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

// Lazy initialization to avoid build-time errors
let _openai: AzureOpenAI | null = null;

export function getOpenAIClient(): AzureOpenAI {
  if (_openai) {
    return _openai;
  }

  if (!endpoint) {
    throw new Error(
      "Missing AZURE_OPENAI_ENDPOINT environment variable. " +
      "Please set it in your Vercel project settings."
    );
  }

  if (!apiKey) {
    throw new Error(
      "Missing AZURE_OPENAI_API_KEY environment variable. " +
      "Please set it in your Vercel project settings."
    );
  }

  if (!deployment) {
    throw new Error(
      "Missing AZURE_OPENAI_DEPLOYMENT_NAME environment variable. " +
      "Please set it in your Vercel project settings."
    );
  }

  // Note: deployment is NOT passed to constructor - it's passed to each API call as 'model'
  _openai = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
  });

  return _openai;
}

export function getDeploymentName(): string {
  if (!deployment) {
    throw new Error("Missing AZURE_OPENAI_DEPLOYMENT_NAME environment variable.");
  }
  return deployment;
}
