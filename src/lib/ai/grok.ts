import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

export function isGrokConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

function stripCodeFences(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }

  return trimmed;
}

export function parseJsonFromModelOutput<T>(raw: string): T | null {
  const cleaned = stripCodeFences(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonChunk = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonChunk) as T;
  } catch {
    return null;
  }
}

export async function generateGrokJsonOutput(input: {
  system: string;
  user: string;
  model?: string;
}) {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const model = input.model ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  try {
    const { text } = await generateText({
      model: groq(model),
      temperature: 0.2,
      system: input.system,
      prompt: input.user,
    });

    return text ?? null;
  } catch {
    return null;
  }
}
