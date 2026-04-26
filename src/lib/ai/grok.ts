import { z } from "zod";

const grokResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().optional().nullable(),
        }),
      })
    )
    .min(1),
});

export function isGrokConfigured() {
  return Boolean(process.env.GROK_API_KEY);
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
  if (!process.env.GROK_API_KEY) {
    return null;
  }

  const baseUrl = process.env.GROK_BASE_URL ?? "https://api.x.ai/v1";
  const model = input.model ?? process.env.GROK_MODEL ?? "grok-2-latest";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = grokResponseSchema.safeParse(await response.json());

  if (!payload.success) {
    return null;
  }

  return payload.data.choices[0]?.message.content ?? null;
}
