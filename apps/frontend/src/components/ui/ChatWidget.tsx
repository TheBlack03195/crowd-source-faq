import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import type { ChatMessage } from '../../utils/types';


export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextHistory = [...messages, { role: 'user', content: text } as ChatMessage];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/chat', {
        message: text,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([
        ...nextHistory,
        { role: 'assistant', content: data.reply, matchedFaqs: data.matchedFaqs },
      ]);
    } catch {
      setMessages([
        ...nextHistory,
        { role: 'assistant', content: "Sorry, I couldn't reach the assistant just now. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Yaksha-mini chat"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800"
      >
        <ChatBubbleIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <ChatBubbleIcon className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold leading-tight">Yaksha-mini</p>
            <p className="text-[11px] leading-tight text-slate-300">Answers from this site</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-slate-300 hover:text-white">
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Ask anything from the FAQ — e.g. "What is VINS?" or "How do I submit the NOC?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-800 shadow'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.matchedFaqs && m.matchedFaqs.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs">
                  {m.matchedFaqs.map((f) => (
                    <Link key={f._id} to={`/faq?q=${encodeURIComponent(f.question)}`} className="block text-emerald-700 hover:underline">
                      {f.question}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-slate-400">Yaksha-mini is typing…</p>}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question..."
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white disabled:opacity-40"
        >
          ➤
        </button>
      </form>
      <p className="border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-400">
        For your specific case, log in at{' '}
        <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer" className="underline">
          samagama.in
        </a>{' '}
        and ask Yaksha.
      </p>
    </div>
  );
}

function ChatBubbleIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4.3 3.6a.5.5 0 0 1-.8-.4V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
