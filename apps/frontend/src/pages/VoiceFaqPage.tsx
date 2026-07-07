import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Faq } from '../utils/types';


interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceFaqPage() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [matches, setMatches] = useState<Faq[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('Microphone ready…');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus('Voice input not supported in this browser — type your question below instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as ArrayLike<any>)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(text);
    };
    recognition.onerror = () => {
      setStatus('Could not hear that — try again or type your question.');
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setStatus('Microphone ready…');
    };

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript('');
      setStatus('Listening…');
      setListening(true);
      recognitionRef.current.start();
    }
  }

  async function runSearch(q: string) {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    try {
      const { data } = await api.get('/search', { params: { q: query } });
      setMatches(data.results || []);
    } finally {
      setSearching(false);
    }
  }

  
  useEffect(() => {
    if (!listening && transcript.trim()) {
      runSearch(transcript);
    }
    
  }, [listening]);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-gradient-to-b from-[#160b2e] to-[#0c0817] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-bold text-white">FAQ Voice Bot</h1>
        <p className="mt-1 text-sm text-indigo-300">Samagama · Vicharanashala Internship</p>

        {/* <div className="mt-4 flex justify-center gap-5 text-sm text-indigo-200">
          <Link to="/" className="hover:text-white">Overview</Link>
          <Link to="/faq" className="hover:text-white">FAQ</Link>
          <span className="border-b border-white font-medium text-white">Voice</span>
          <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            samagama.in
          </a>
        </div> */}

        <p className="mt-6 text-sm text-indigo-200">
          Click the microphone, speak your question, then tap the matching FAQ.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8">
          <button
            onClick={toggleListening}
            disabled={!supported}
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition disabled:opacity-40 ${
              listening ? 'animate-pulse bg-purple-500' : 'bg-gradient-to-br from-purple-500 to-fuchsia-500'
            }`}
            aria-label="Toggle microphone"
          >
            <MicIcon />
          </button>
          <p className="mt-4 text-sm text-indigo-200">{status}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">Your spoken script</p>
          <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-indigo-100">
            {transcript || <span className="text-indigo-400/60">Your question will appear here.</span>}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(typedQuery)}
              placeholder="Or type your question…"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-indigo-100 placeholder:text-indigo-400/60 focus:border-purple-400 focus:outline-none"
            />
            <button
              onClick={() => runSearch(typedQuery)}
              className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#160b2e] hover:bg-indigo-100"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">Best FAQ matches</p>
          {searching && <p className="text-sm text-indigo-300">Searching…</p>}
          {!searching && matches.length === 0 && (
            <p className="text-sm italic text-indigo-400/70">Start speaking or typing to see matches.</p>
          )}
          <div className="space-y-2">
            {matches.map((faq) => (
              <Link
                key={faq._id}
                to={`/faq?q=${encodeURIComponent(faq.question)}`}
                className="block rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-indigo-100 hover:border-purple-400"
              >
                {faq.question}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-indigo-400">
          For personal cases, log in at{' '}
          <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer" className="underline">
            samagama.in
          </a>{' '}
          and ask Yaksha.
        </p>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
