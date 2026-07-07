import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';
import type { Category } from '../../utils/types';

/**
 * Inline "+ New FAQ" form for admins/moderators. Hits the existing
 * `POST /api/faq` endpoint (createFaq/createFaqSchema in
 * faqController.ts) — that endpoint has been live since Phase 1 but
 * had no frontend caller anywhere, so this was the missing half.
 */
export function AdminCreateFaqForm() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && categories.length === 0) {
      api.get('/public/categories').then(({ data }) => setCategories(data.categories));
    }
  }, [open, categories.length]);

  function resetForm() {
    setQuestion('');
    setAnswer('');
    setCategoryId('');
    setTags('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError('Please choose a category.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/faq', {
        question: question.trim(),
        answer: answer.trim(),
        categoryId,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSuccess('FAQ created and published.');
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create the FAQ. Please check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900"
      >
        <span>+ New FAQ</span>
        <span className="text-slate-400">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-200 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Question</label>
            <input
              required
              minLength={5}
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the NOC deadline?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Answer</label>
            <textarea
              required
              minLength={2}
              maxLength={5000}
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write the answer…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Tags (comma-separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="noc, hostel, stipend"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-700">{success}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create FAQ'}
          </Button>
        </form>
      )}
    </div>
  );
}