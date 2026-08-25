import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
  DEFAULT_KNOWLEDGE_BASE_ID,
  deleteDocument,
  getDocuments,
  getErrorMessage,
  getKnowledgeBases,
  reindexDocument
} from '../api/client';
import { AppShell } from '../components/AppShell';
import { ChatPanel } from '../components/ChatPanel';
import { DocumentList } from '../components/DocumentList';
import { SettingsModal } from '../components/SettingsModal';
import { UploadPanel } from '../components/UploadPanel';
import type { KnowledgeBase, KnowledgeDocument } from '../types';

type Notice = {
  type: 'success' | 'error';
  message: string;
};

export function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const knowledgeBase = knowledgeBases[0];
  const knowledgeBaseId = knowledgeBase?.id ?? DEFAULT_KNOWLEDGE_BASE_ID;
  const readyDocumentCount = useMemo(() => documents.filter((document) => document.status === 'ready').length, [documents]);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      setDocuments(await getDocuments(knowledgeBaseId));
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [knowledgeBaseId]);

  useEffect(() => {
    getKnowledgeBases()
      .then(setKnowledgeBases)
      .catch((error) => setNotice({ type: 'error', message: getErrorMessage(error) }));
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const hasActiveDocument = documents.some((document) => document.status === 'pending' || document.status === 'processing');

    if (!hasActiveDocument) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadDocuments();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [documents, loadDocuments]);

  async function handleDelete(documentId: string) {
    try {
      await deleteDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setNotice({ type: 'success', message: '文档已删除' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  async function handleReindex(documentId: string) {
    try {
      const document = await reindexDocument(documentId);
      setDocuments((current) => current.map((item) => (item.id === document.id ? { ...item, status: 'processing' } : item)));
      setNotice({ type: 'success', message: '已开始重建索引' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  return (
    <AppShell knowledgeBase={knowledgeBase} onOpenSettings={() => setSettingsOpen(true)}>
      <div className="flex h-full min-h-0 flex-col md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <UploadPanel
            knowledgeBaseId={knowledgeBaseId}
            onUploaded={(document) => {
              setDocuments((current) => [document, ...current]);
              setNotice({ type: 'success', message: '文件已上传，正在处理' });
            }}
            onError={(message) => setNotice({ type: 'error', message })}
          />
          <DocumentList
            documents={documents}
            isLoading={isLoadingDocuments}
            onRefresh={() => void loadDocuments()}
            onDelete={(documentId) => void handleDelete(documentId)}
            onReindex={(documentId) => void handleReindex(documentId)}
          />
        </div>
        <ChatPanel
          knowledgeBaseId={knowledgeBaseId}
          readyDocumentCount={readyDocumentCount}
          onError={(message) => setNotice({ type: 'error', message })}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setNotice({ type: 'success', message: 'AI 服务设置已保存' })}
        onError={(message) => setNotice({ type: 'error', message })}
      />

      {notice ? (
        <div className="fixed bottom-4 left-4 right-4 z-20 md:left-auto md:w-[380px]">
          <div
            className={`flex items-start gap-3 rounded border bg-white px-4 py-3 shadow-lg ${
              notice.type === 'success' ? 'border-fern/30 text-fern' : 'border-berry/30 text-berry'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
            <p className="min-w-0 flex-1 text-sm leading-5">{notice.message}</p>
            <button
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              type="button"
              title="关闭"
              aria-label="关闭"
              onClick={() => setNotice(null)}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
