import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { CommunityPost } from '../utils/types';

interface DuplicateMatch {
  type: 'faq' | 'post';
  id: string;
  text: string;
  status?: string;
}

export function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const duplicateCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function loadPosts() {
    setLoading(true);
    api
      .get('/community/posts')
      .then(({ data }) => {
        setPosts(data.items);
        const initialVotes: Record<string, number> = {};
        (data.items as CommunityPost[]).forEach((p: any) => {
          if (p.userVote) initialVotes[p._id] = p.userVote;
        });
        setUserVotes(initialVotes);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadPosts, []);


  function handleTitleChange(value: string) {
    setTitle(value);
    if (duplicateCheckTimer.current) clearTimeout(duplicateCheckTimer.current);

    if (value.trim().length < 5) {
      setDuplicates([]);
      return;
    }

    duplicateCheckTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.post('/community/posts/check-duplicate', { title: value });
        setDuplicates(data.matches || []);
      } catch {
       
        setDuplicates([]);
      }
    }, 500);
  }

  async function handleDuplicateClick(_match: DuplicateMatch) {
    api.post('/community/posts/duplicate-averted').catch(() => {});
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/community/posts', { title, body });
      setTitle('');
      setBody('');
      setDuplicates([]);
      setShowForm(false);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create post');
    }
  }

  async function handleVote(e: React.MouseEvent, postId: string, direction: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert("Please log in to vote.");
      return;
    }

    const currentVote = userVotes[postId] || 0;
    let newVote = 0;
    let scoreChange = 0;

    if (currentVote === direction) {
      newVote = 0;
      scoreChange = -direction;
    } else {
      newVote = direction;
      scoreChange = direction - currentVote;
    }

    setUserVotes((prev) => ({ ...prev, [postId]: newVote }));
    setPosts((currentPosts) =>
      currentPosts.map((p) =>
        p._id === postId ? { ...p, upvotes: p.upvotes + scoreChange } : p
      )
    );

    try {
      const { data } = await api.post(`/community/posts/${postId}/vote`, { direction });
      if (data && (typeof data.upvotes === 'number' || typeof data.userVote !== 'undefined')) {
        setPosts((currentPosts) =>
          currentPosts.map((p) =>
            p._id === postId && typeof data.upvotes === 'number'
              ? { ...p, upvotes: data.upvotes }
              : p
          )
        );
        if (typeof data.userVote !== 'undefined') {
          setUserVotes((prev) => ({ ...prev, [postId]: data.userVote }));
        }
      }
    } catch (err) {
      console.error("Vote failed", err);
      
      setUserVotes((prev) => ({ ...prev, [postId]: currentVote }));
      setPosts((currentPosts) =>
        currentPosts.map((p) =>
          p._id === postId ? { ...p, upvotes: p.upvotes - scoreChange } : p
        )
      );
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Community Q&A</h1>
          <p className="mt-1 text-sm text-ink-soft">Ask questions and help fellow interns.</p>
        </div>
        {isAuthenticated && (
          <Button variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'Ask a question'}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-xl border border-mist-dark bg-paper/50 p-6 shadow-sm">
          <div>
            <input
              required
              placeholder="What is your question?"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none"
            />
          </div>

          
          {duplicates.length > 0 && (
            <div className="rounded-lg border border-gold/40 bg-gold-soft p-4 shadow-sm animate-fade-up">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gold-dark">
                This looks familiar
              </p>
              <p className="mb-3 text-sm text-ink-soft">
                We found {duplicates.length} similar {duplicates.length > 1 ? 'items' : 'item'}. Checking these might save you time!
              </p>
              <div className="space-y-2">
                {duplicates.map((d) => (
                  <Link
                    key={`${d.type}-${d.id}`}
                    to={d.type === 'faq' ? `/faq?q=${encodeURIComponent(d.text)}` : `/community/${d.id}`}
                    onClick={() => handleDuplicateClick(d)}
                    className="flex items-start gap-3 rounded-md bg-white/70 px-3 py-2 text-sm text-ink transition-colors hover:bg-white"
                  >
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${d.type === 'faq' ? 'bg-forest text-white' : 'bg-mist-dark text-ink'}`}>
                      {d.type === 'faq' ? 'FAQ' : 'Post'}
                    </span>
                    <span className="leading-snug hover:text-forest">{d.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <textarea
              required
              placeholder="Provide more details here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button type="submit">Post Question</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading && <LoadingRow label="Loading discussions..." />}
        
        {!loading && posts.length === 0 && (
          <EmptyState 
            title="No posts yet" 
            description="Be the first to start a discussion or ask a question." 
          />
        )}
        
        {posts.map((post) => {
          const userVote = userVotes[post._id] || 0;
          
          return (
            <Link
              key={post._id}
              to={`/community/${post._id}`}
              className="group flex flex-col gap-3 rounded-xl border border-mist bg-paper p-4 transition-all hover:border-forest/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-ink">{post.title}</h3>
                <StatusPill
                  tone={post.status === 'resolved' ? 'forest' : post.status === 'closed' ? 'mist' : 'gold'}
                >
                  {post.status}
                </StatusPill>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{post.body}</p>

              <div className="mt-1 flex items-center gap-2">

                <div className="flex items-center gap-1 rounded-full bg-ink/90 px-1.5 py-1 shadow-sm">
                  <button
                    onClick={(e) => handleVote(e, post._id, 1)}
                    aria-label="Upvote"
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                      userVote === 1
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-white/70 hover:bg-white/10 hover:text-emerald-400'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  <span
                    className={`min-w-[1.5rem] text-center text-sm font-bold tabular-nums ${
                      userVote === 1
                        ? 'text-emerald-400'
                        : userVote === -1
                        ? 'text-red-400'
                        : 'text-white'
                    }`}
                  >
                    {post.upvotes}
                  </span>

                  <button
                    onClick={(e) => handleVote(e, post._id, -1)}
                    aria-label="Downvote"
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                      userVote === -1
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-white/70 hover:bg-white/10 hover:text-red-400'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                
                <div className="flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="tabular-nums">{post.comments?.length ?? 0}</span>
                </div>

                {post.categoryId && typeof post.categoryId === 'object' && 'name' in post.categoryId && (
                  <span className="ml-auto rounded-full bg-mist-dark/30 px-3 py-1 text-xs font-medium text-ink-soft">
                    {post.categoryId.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}