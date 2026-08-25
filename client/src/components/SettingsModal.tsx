import { FormEvent, useEffect, useState } from 'react';
import { Cpu, KeyRound, Loader2, Server, X } from 'lucide-react';
import { getAiSettings, getErrorMessage, updateAiSettings } from '../api/client';
import type { AiProvider, AiSettings, AiSettingsInput } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: AiSettings) => void;
  onError: (message: string) => void;
}

const providerDefaults: Record<AiProvider, Pick<AiSettingsInput, 'baseUrl' | 'chatModel' | 'embeddingModel'>> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    chatModel: 'qwen3:4b',
    embeddingModel: 'nomic-embed-text'
  },
  openai_compatible: {
    baseUrl: 'https://api.xinnanz.cn/v1',
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small'
  }
};

export function SettingsModal({ open, onClose, onSaved, onError }: SettingsModalProps) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [provider, setProvider] = useState<AiProvider>('ollama');
  const [baseUrl, setBaseUrl] = useState(providerDefaults.ollama.baseUrl);
  const [chatModel, setChatModel] = useState(providerDefaults.ollama.chatModel);
  const [embeddingModel, setEmbeddingModel] = useState(providerDefaults.ollama.embeddingModel);
  const [apiKey, setApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsLoading(true);
    getAiSettings()
      .then((value) => {
        setSettings(value);
        setProvider(value.provider);
        setBaseUrl(value.baseUrl);
        setChatModel(value.chatModel);
        setEmbeddingModel(value.embeddingModel);
        setApiKey('');
        setClearApiKey(false);
      })
      .catch((error) => onError(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [open, onError]);

  function switchProvider(nextProvider: AiProvider) {
    setProvider(nextProvider);
    const defaults = providerDefaults[nextProvider];
    setBaseUrl(defaults.baseUrl);
    setChatModel(defaults.chatModel);
    setEmbeddingModel(defaults.embeddingModel);
    setApiKey('');
    setClearApiKey(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const saved = await updateAiSettings({
        provider,
        baseUrl: baseUrl.trim(),
        chatModel: chatModel.trim(),
        embeddingModel: embeddingModel.trim(),
        apiKey: apiKey.trim() || undefined,
        clearApiKey
      });
      setSettings(saved);
      onSaved(saved);
      onClose();
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded border border-line bg-white shadow-xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-fern text-white">
              <Server size={17} aria-hidden="true" />
            </div>
            <h2 className="truncate text-sm font-semibold text-ink">AI 服务设置</h2>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:bg-slate-50"
            type="button"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={17} aria-hidden="true" />
            加载设置
          </div>
        ) : (
          <form className="thin-scrollbar min-h-0 overflow-auto p-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded border border-line bg-slate-50 p-1">
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded text-sm font-medium transition ${
                  provider === 'ollama' ? 'bg-white text-fern shadow-panel' : 'text-slate-600 hover:bg-white'
                }`}
                type="button"
                onClick={() => switchProvider('ollama')}
              >
                <Cpu size={16} aria-hidden="true" />
                本地 Ollama
              </button>
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded text-sm font-medium transition ${
                  provider === 'openai_compatible' ? 'bg-white text-fern shadow-panel' : 'text-slate-600 hover:bg-white'
                }`}
                type="button"
                onClick={() => switchProvider('openai_compatible')}
              >
                <KeyRound size={16} aria-hidden="true" />
                API Key
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Base URL
                <input
                  className="h-10 rounded border border-line px-3 text-sm text-ink transition focus:border-fern"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://api.xinnanz.cn/v1"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  聊天模型
                  <input
                    className="h-10 rounded border border-line px-3 text-sm text-ink transition focus:border-fern"
                    value={chatModel}
                    onChange={(event) => setChatModel(event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Embedding 模型
                  <input
                    className="h-10 rounded border border-line px-3 text-sm text-ink transition focus:border-fern"
                    value={embeddingModel}
                    onChange={(event) => setEmbeddingModel(event.target.value)}
                    required
                  />
                </label>
              </div>

              {provider === 'openai_compatible' ? (
                <div className="grid gap-3 rounded border border-line bg-slate-50 p-3">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                    API Key
                    <input
                      className="h-10 rounded border border-line bg-white px-3 text-sm text-ink transition focus:border-fern"
                      type="password"
                      value={apiKey}
                      onChange={(event) => {
                        setApiKey(event.target.value);
                        setClearApiKey(false);
                      }}
                      placeholder={settings?.hasApiKey ? '已保存，留空则不修改' : '输入 API Key'}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      className="h-4 w-4 rounded border-line text-fern focus:ring-fern"
                      type="checkbox"
                      checked={clearApiKey}
                      onChange={(event) => {
                        setClearApiKey(event.target.checked);
                        if (event.target.checked) {
                          setApiKey('');
                        }
                      }}
                    />
                    清除已保存的 API Key
                  </label>
                </div>
              ) : null}

              <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-saffron">
                切换 Embedding provider 或模型后，已有文档需要重建索引才能被新的配置检索到。
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
              <button
                className="h-10 rounded border border-line bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={onClose}
              >
                取消
              </button>
              <button
                className="flex h-10 items-center gap-2 rounded bg-fern px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
                保存
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
