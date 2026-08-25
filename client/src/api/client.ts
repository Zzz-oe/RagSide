import axios from 'axios';
import type { AiSettings, AiSettingsInput, ChatMessage, ChatResponse, KnowledgeBase, KnowledgeDocument } from '../types';

export const DEFAULT_KNOWLEDGE_BASE_ID = '00000000-0000-4000-8000-000000000001';

const http = axios.create({
  baseURL: '/api',
  timeout: 120000
});

export async function getKnowledgeBases(): Promise<KnowledgeBase[]> {
  const { data } = await http.get<KnowledgeBase[]>('/knowledge-bases');
  return data;
}

export async function getDocuments(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
  const { data } = await http.get<KnowledgeDocument[]>('/documents', {
    params: { knowledgeBaseId }
  });
  return data;
}

export async function uploadDocument(file: File, knowledgeBaseId: string): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('knowledgeBaseId', knowledgeBaseId);

  const { data } = await http.post<KnowledgeDocument>('/documents', formData);
  return data;
}

export async function getAiSettings(): Promise<AiSettings> {
  const { data } = await http.get<AiSettings>('/ai-settings');
  return data;
}

export async function updateAiSettings(input: AiSettingsInput): Promise<AiSettings> {
  const { data } = await http.put<AiSettings>('/ai-settings', input);
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await http.delete(`/documents/${documentId}`);
}

export async function reindexDocument(documentId: string): Promise<KnowledgeDocument> {
  const { data } = await http.post<KnowledgeDocument>(`/documents/${documentId}/reindex`);
  return data;
}

export async function askQuestion(params: {
  knowledgeBaseId: string;
  conversationId?: string;
  question: string;
}): Promise<ChatResponse> {
  const { data } = await http.post<ChatResponse>('/chat', params);
  return data;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await http.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  return data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请确认 AI 服务正在运行';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败';
}
