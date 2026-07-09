import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface MatchedFaq {
  _id: string;
  question: string;
  answer?: string; 
}

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
  const [matches, setMatches] = useState<MatchedFaq[]>([]);
  const [aiReply, setAiReply] = useState('');
  const [searching, setSearching] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [status, setStatus] = useState('Microphone ready…');
  
  // Accordion state
  const [openId, setOpenId] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus('Voice input not supported in this browser — type your question below instead.');
      return;
    }

    const recognition = new SpeechRecognition();
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
      recognitionRef.current.lang = languageRef.current === 'hi' ? 'hi-IN' : 'en-IN';
      setTranscript('');
      setStatus(language === 'hi' ? 'Sun raha hoon…' : 'Listening…');
      setListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setStatus('Microphone permission denied.');
        setListening(false);
      }
    }
  }

  async function runSearch(q: string) {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    setAiReply('');
    setOpenId(null); 
    
    try {
      if (language === 'hi') {
        const { data } = await api.post('/chat', { message: query, language: 'hi' });
        setAiReply(data.reply);
        setMatches(data.matchedFaqs || []);
      } else {
        const { data } = await api.get('/search', { params: { q: query } });
        setMatches(data.results || []);
      }
    } catch (err) {
      console.error('Search failed', err);
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
    <div className="min-h-[calc(100vh-57px)] bg-slate-950 px-4 py-10 text-slate-200">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-bold text-white">FAQ Voice Bot</h1>
        <p className="mt-2 text-sm text-emerald-400">Samagama · Vicharanashala Internship</p>

        {/* Top Navigation Links */}
        {/* <div className="mt-6 flex justify-center gap-6 text-sm font-medium text-slate-400">
          <Link to="/" className="transition-colors hover:text-white">Overview</Link>
          <Link to="/faq" className="transition-colors hover:text-white">FAQ</Link>
          <span className="border-b-2 border-emerald-500 text-white pb-1">Voice</span>
          <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            samagama.in
          </a>
        </div> */}

        <div className="mt-8 inline-flex overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-sm font-medium">
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-2 transition-colors ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-6 py-2 transition-colors ${language === 'hi' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            हिंदी
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <button
            onClick={toggleListening}
            disabled={!supported}
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 ${
              listening 
                ? 'bg-emerald-600 shadow-[0_0_40px_rgba(5,150,105,0.6)] animate-pulse scale-105' 
                : 'bg-slate-800 hover:bg-slate-700 shadow-xl border border-slate-700'
            }`}
            aria-label="Toggle microphone"
          >
            <MicIcon />
          </button>
          <p className="mt-6 text-sm font-medium text-slate-400 tracking-wide">{status}</p>
        </div>

        {/* Input/Transcript Section */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {language === 'hi' ? 'Aapka Sawaal' : 'Your spoken script'}
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 min-h-[3rem]">
            {transcript || <span className="text-slate-600">{language === 'hi' ? 'Aapka sawaal yahan aayega...' : 'Your question will appear here.'}</span>}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(typedQuery)}
              placeholder={language === 'hi' ? 'Ya apna sawaal type karein…' : 'Or type your question here…'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={() => runSearch(typedQuery)}
              className="shrink-0 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              {language === 'hi' ? 'खोजें' : 'Search'}
            </button>
          </div>
        </div>


        {language === 'hi' && (aiReply || searching) && (
          <div className="mt-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6 text-left shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Yaksha-mini ka jawaab</p>
            </div>
            {searching ? (
              <p className="text-sm text-slate-400">Soch raha hoon…</p>
            ) : (
              <p className="text-sm leading-relaxed text-slate-200">{aiReply}</p>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Best FAQ matches</p>
          
          {searching && <p className="text-sm text-emerald-500 animate-pulse">Searching knowledge base...</p>}
          {!searching && matches.length === 0 && (
            <p className="text-sm italic text-slate-600">Start speaking or typing to see matches.</p>
          )}
          
          <div className="space-y-3">
            {matches.map((faq) => (
              <div key={faq._id} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden transition-all">
                <button
                  onClick={() => setOpenId(openId === faq._id ? null : faq._id)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex-1">{faq.question}</span>
                  <span className={`shrink-0 font-mono text-lg transition-transform ${openId === faq._id ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {openId === faq._id ? '−' : '+'}
                  </span>
                </button>
                
                {openId === faq._id && (
                  <div className="border-t border-slate-800/50 bg-slate-900/50 px-5 py-4 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {faq.answer ? (
                      faq.answer
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span>Answer available on the main FAQ page.</span>
                        <Link 
                          to={`/faq?q=${encodeURIComponent(faq.question)}`} 
                          className="text-emerald-500 hover:text-emerald-400 underline font-medium"
                        >
                          Read full answer here
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* <p className="mt-8 text-xs text-slate-500">
          For personal cases, log in at{' '}
          <a href="https://samagama.in/" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline hover:text-white transition-colors">
            samagama.in
          </a>{' '}
          and ask Yaksha.
        </p> */}
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