import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  large?: boolean;
}

export function SearchBar({ onSearch, placeholder = 'Search the archive…', large = false }: SearchBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative w-full">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="6.5" />
          <path d="M18 18l-3.8-3.8" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-mist-dark bg-white pl-11 pr-4 text-ink placeholder:text-ink-soft/60 focus:border-forest focus:outline-none ${
            large ? 'py-4 text-base' : 'py-2.5 text-sm'
          }`}
        />
      </div>
      <button
        type="submit"
        className={`shrink-0 rounded-lg bg-forest font-medium text-white transition-colors hover:bg-forest-dark ${
          large ? 'px-6 text-base' : 'px-5 text-sm'
        }`}
      >
        Search
      </button>
    </form>
  );
}