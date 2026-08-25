export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type AiProvider = 'ollama' | 'openai_compatible';

export interface KnowledgeBase {
  id: string;
  name: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  knowledgeBaseId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  status: DocumentStatus;
  pageCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceReference {
  documentId: string;
  filename: string;
  page: number;
  content: string;
  score?: number;
}

export interface ChatResponse {
  answer: string;
  conversationId: string;
  sources: SourceReference[];
}

export interface AiSettings {
  provider: AiProvider;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  hasApiKey: boolean;
  updatedAt: string;
}

export interface AiSettingsRecord extends AiSettings {
  apiKey: string | null;
}

export interface AiSettingsInput {
  provider: AiProvider;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  apiKey?: string;
  clearApiKey?: boolean;
}
