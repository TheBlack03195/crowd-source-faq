import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { SearchBar } from '../components/ui/SearchBar';
import type { Faq, Category } from '../utils/types';

export function FAQPage() {
  const [searchParams] = useSearchParams();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/public/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const request = query
      ? api.get('/search', { params: { q: query } }).then(({ data }) => data.results)
      : api
          .get('/faq', { params: activeCategory ? { categoryId: activeCategory } : {} })
          .then(({ data }) => data.items);

    request.then((items) => setFaqs(items)).finally(() => setLoading(false));
  }, [query, activeCategory]);

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">FAQs</h1>

      <SearchBar
        onSearch={(q) => {
          setQuery(q);
          setActiveCategory(null);
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveCategory(null);
            setQuery('');
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !activeCategory && !query ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => {
              setActiveCategory(c._id);
              setQuery('');
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeCategory === c._id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && faqs.length === 0 && (
          <p className="text-sm text-slate-500">No FAQs found. Try a different search or category.</p>
        )}
        {faqs.map((faq) => (
          <div key={faq._id} className="rounded-lg border border-slate-200">
            <button
              onClick={() => setOpenId(openId === faq._id ? null : faq._id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-900"
            >
              {faq.question}
              <span className="text-slate-400">{openId === faq._id ? '−' : '+'}</span>
            </button>
            {openId === faq._id && (
              <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                {faq.answer}
                <div className="mt-3">
                  <button
                    onClick={async () => {
                      const reason = prompt('Why does this need review? (optional)') || undefined;
                      await api.post(`/freshness/${faq._id}/flag-outdated`, { reason });
                      alert('Thanks — flagged for review.');
                    }}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    ⚠ Flag as outdated
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
