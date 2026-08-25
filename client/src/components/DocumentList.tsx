import { FileText, RefreshCw, RotateCw, Trash2 } from 'lucide-react';
import type { KnowledgeDocument } from '../types';
import { StatusBadge } from './StatusBadge';

interface DocumentListProps {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (documentId: string) => void;
  onReindex: (documentId: string) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getTypeLabel(mimeType: string, name: string): string {
  if (mimeType.includes('pdf') || name.toLowerCase().endsWith('.pdf')) {
    return 'PDF';
  }
  if (mimeType.includes('word') || name.toLowerCase().endsWith('.docx')) {
    return 'Word';
  }
  if (name.toLowerCase().endsWith('.csv')) {
    return 'CSV';
  }
  if (name.toLowerCase().endsWith('.md')) {
    return 'MD';
  }
  return 'TXT';
}

export function DocumentList({ documents, isLoading, onRefresh, onDelete, onReindex }: DocumentListProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-paper">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">文件列表</h2>
          <p className="mt-0.5 text-xs text-slate-500">{documents.length} 个文件</p>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          type="button"
          onClick={onRefresh}
          title="刷新"
          aria-label="刷新"
        >
          <RefreshCw className={isLoading ? 'animate-spin' : undefined} size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-auto p-4">
        {documents.length === 0 ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded border border-line bg-white px-6 text-center shadow-panel">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-slate-500">
                <FileText size={24} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">暂无文件</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((document) => (
              <article key={document.id} className="rounded border border-line bg-white p-4 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                      <FileText size={19} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink" title={document.originalName}>
                        {document.originalName}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{getTypeLabel(document.mimeType, document.originalName)}</span>
                        <span>{document.pageCount || '-'} 页</span>
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={document.status} />
                </div>

                {document.errorMessage ? (
                  <p className="mt-3 rounded border border-berry/20 bg-rose-50 px-3 py-2 text-xs leading-5 text-berry">
                    {document.errorMessage}
                  </p>
                ) : null}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    title="重建索引"
                    aria-label="重建索引"
                    disabled={document.status === 'processing'}
                    onClick={() => onReindex(document.id)}
                  >
                    <RotateCw size={15} aria-hidden="true" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:border-berry hover:text-berry"
                    type="button"
                    title="删除"
                    aria-label="删除"
                    onClick={() => onDelete(document.id)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

