import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { getErrorMessage, uploadDocument } from '../api/client';
import type { KnowledgeDocument } from '../types';

interface UploadPanelProps {
  knowledgeBaseId: string;
  onUploaded: (document: KnowledgeDocument) => void;
  onError: (message: string) => void;
}

export function UploadPanel({ knowledgeBaseId, onUploaded, onError }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);
    try {
      const document = await uploadDocument(file, knowledgeBaseId);
      onUploaded(document);
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void upload(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void upload(file);
    }
  }

  return (
    <section className="border-b border-line bg-white px-5 py-4">
      <div
        className={`flex min-h-28 items-center justify-between gap-4 rounded border border-dashed px-4 transition ${
          isDragging ? 'border-fern bg-emerald-50' : 'border-slate-300 bg-slate-50'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white text-fern shadow-panel">
            <FileUp size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">文档上传</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">PDF、Word、TXT、Markdown、CSV，单文件上限按服务端配置执行。</p>
          </div>
        </div>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv"
          onChange={handleFileChange}
        />
        <button
          className="flex h-10 shrink-0 items-center gap-2 rounded bg-fern px-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Upload size={17} aria-hidden="true" />}
          {isUploading ? '上传中' : '上传'}
        </button>
      </div>
    </section>
  );
}

