import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, SendHorizontal, SquarePen } from 'lucide-react';
import { askQuestion, getErrorMessage } from '../api/client';
import type { ChatMessage, SourceReference } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  knowledgeBaseId: string;
  readyDocumentCount: number;
  onError: (message: string) => void;
}

function makeLocalMessage(role: ChatMessage['role'], content: string, sources: SourceReference[] = []): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    sources,
    createdAt: new Date().toISOString()
  };
}

export function ChatPanel({ knowledgeBaseId, readyDocumentCount, onError }: ChatPanelProps) {
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isAnswering]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isAnswering) {
      return;
    }

    setQuestion('');
    setMessages((current) => [...current, makeLocalMessage('user', trimmedQuestion)]);
    setIsAnswering(true);

    try {
      const result = await askQuestion({
        knowledgeBaseId,
        conversationId,
        question: trimmedQuestion
      });
      setConversationId(result.conversationId);
      setMessages((current) => [...current, makeLocalMessage('assistant', result.answer, result.sources)]);
    } catch (error) {
      const message = getErrorMessage(error);
      onError(message);
      setMessages((current) => [...current, makeLocalMessage('assistant', message)]);
    } finally {
      setIsAnswering(false);
    }
  }

  return (
    <aside className="flex min-h-0 w-full flex-col border-l border-line bg-slate-50 md:w-[390px] xl:w-[420px]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-fern text-white">
            <Bot size={17} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">AI 问答</h2>
            <p className="mt-0.5 text-xs text-slate-500">{readyDocumentCount} 个可检索文件</p>
          </div>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          type="button"
          title="新对话"
          aria-label="新对话"
          onClick={() => {
            setConversationId(undefined);
            setMessages([]);
          }}
        >
          <SquarePen size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-72 items-center justify-center text-center">
            <div className="max-w-64">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-white text-fern shadow-panel">
                <Bot size={24} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">等待提问</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isAnswering ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                正在检索和生成
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form className="shrink-0 border-t border-line bg-white p-3" onSubmit={handleSubmit}>
        <div className="flex items-end gap-2">
          <textarea
            className="thin-scrollbar min-h-11 max-h-32 flex-1 resize-none rounded border border-line bg-white px-3 py-2 text-sm leading-6 text-ink transition placeholder:text-slate-400 focus:border-fern"
            placeholder="输入问题"
            rows={1}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-fern text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            disabled={isAnswering || question.trim().length === 0}
            title="发送"
            aria-label="发送"
          >
            {isAnswering ? <Loader2 className="animate-spin" size={19} aria-hidden="true" /> : <SendHorizontal size={19} aria-hidden="true" />}
          </button>
        </div>
      </form>
    </aside>
  );
}

