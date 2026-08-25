import type { ResolvedAiSettings } from './ai-provider.service.js';
import { resolveAiSettings } from './ai-provider.service.js';
import { requestOpenAIEmbeddings } from './openai-compatible.service.js';

interface OllamaEmbedResponse {
  embeddings?: number[][];
  embedding?: number[];
}

async function requestOllamaEmbedding(
  settings: { baseUrl: string; embeddingModel: string },
  input: string | string[]
): Promise<number[][]> {
  const response = await fetch(`${settings.baseUrl}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama embedding failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as OllamaEmbedResponse;

  if (Array.isArray(data.embeddings)) {
    return data.embeddings;
  }

  if (Array.isArray(data.embedding)) {
    return [data.embedding];
  }

  throw new Error('Ollama embedding response did not contain vectors');
}

export async function embedTexts(
  texts: string[],
  resolvedSettings?: ResolvedAiSettings
): Promise<number[][]> {
  const settings = resolvedSettings ?? (await resolveAiSettings());
  const embeddings: number[][] = [];
  const batchSize = 12;

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const batchEmbeddings =
      settings.provider === 'openai_compatible'
        ? await requestOpenAIEmbeddings(settings, batch)
        : await requestOllamaEmbedding(settings, batch);

    if (batchEmbeddings.length !== batch.length) {
      throw new Error('Ollama returned a different number of embeddings than requested');
    }

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export async function embedText(text: string, resolvedSettings?: ResolvedAiSettings): Promise<number[]> {
  const [embedding] = await embedTexts([text], resolvedSettings);
  return embedding;
}
