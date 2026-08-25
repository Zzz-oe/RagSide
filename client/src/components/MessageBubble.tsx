import { Bot, UserRound } from 'lucide-react';
import type { ChatMessage } from '../types';
import { SourceReference } from './SourceReference';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-fern text-white">
          <Bot size={16} aria-hidden="true" />
        </div>
      ) : null}
      <div className={`max-w-[86%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded px-3 py-2 text-sm leading-6 shadow-panel ${
            isUser ? 'bg-ink text-white' : 'border border-line bg-white text-ink'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {!isUser && message.sources.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {message.sources.map((source, index) => (
              <SourceReference key={`${source.documentId}-${source.page}-${index}`} source={source} />
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-700">
          <UserRound size={16} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

