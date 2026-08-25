import type { ResolvedAiSettings } from './ai-provider.service.js';

interface OpenAIEmbeddingResponse {
  data?: Array<{ embedding: number[] }>;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function buildHeaders(settings: ResolvedAiSettings): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  return headers;
}

export async function requestOpenAIEmbeddings(settings: ResolvedAiSettings, input: string[]): Promise<number[][]> {
  const response = await fetch(`${settings.baseUrl}/embeddings`, {
    method: 'POST',
    headers: buildHeaders(settings),
    body: JSON.stringify({
      model: settings.embeddingModel,
      input
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding API failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;
  const embeddings = data.data?.map((item) => item.embedding).filter((embedding): embedding is number[] => Array.isArray(embedding)) ?? [];

  if (embeddings.length !== input.length) {
    throw new Error('Embedding API returned an unexpected number of vectors');
  }

  return embeddings;
}

export async function requestOpenAIChat(settings: ResolvedAiSettings, prompt: string): Promise<string> {
  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(settings),
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chat API failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  return (data.choices?.[0]?.message?.content ?? '').trim();
}
