import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;

export const openai = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  deployment,
});

export { deployment };

