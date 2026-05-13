'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useTheme } from './theme-provider';
import { useCategories } from '@/lib/hooks/use-categories';
import { useTags } from '@/lib/hooks/use-tags';

interface BottomSearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  tag: string;
  setTag: (value: string) => void;
  tier: string;
  setTier: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  onClearAll: () => void;
  categories?: string[];
  tags?: string[];
}

export function BottomSearchBar({
  search,
  setSearch,
  category,
  setCategory,
  tag,
  setTag,
  tier,
  setTier,
  date,
  setDate,
  onClearAll,
  categories: categoriesProp,
  tags: tagsProp,
}: BottomSearchBarProps) {
  const { isDark } = useTheme();
  const { data: hookCategories } = useCategories();
  const { data: hookTags } = useTags();
  const rawCategories = categoriesProp ?? hookCategories;
  const categories: string[] = (rawCategories ?? ['All']).map((c: any) =>
    typeof c === 'string' ? c : (c?.name ?? String(c))
  );
  const rawTags = tagsProp ?? hookTags;
  const tags: string[] = (rawTags ?? ['All']).map((t: any) =>
    typeof t === 'string' ? t : (t?.name ?? String(t))
  );
  const categoriesRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const hasActiveFilters = search.trim() !== '' || category !== 'All' || tag !== 'All' || tier !== 'All' || date !== 'All';

  const containerBackground = isDark
    ? [
        'radial-gradient(circle at 80% 4%, rgba(150,68,255,0.86) 0%, rgba(150,68,255,0.5) 18%, rgba(150,68,255,0.16) 36%, rgba(150,68,255,0) 54%)',
        'radial-gradient(circle at -4% 44%, rgba(167,246,255,0.58) 0%, rgba(167,246,255,0.22) 24%, rgba(167,246,255,0.06) 36%, rgba(167,246,255,0) 52%)',
        'radial-gradient(circle at 4% 72%, rgba(16,68,255,0.88) 0%, rgba(16,68,255,0.54) 16%, rgba(16,68,255,0.2) 34%, rgba(16,68,255,0) 56%)',
        'radial-gradient(circle at 24% 52%, rgba(11,11,171,0.94) 0%, rgba(11,11,171,0.75) 24%, rgba(11,11,171,0.3) 42%, rgba(11,11,171,0) 66%)',
        'linear-gradient(175deg, #d8d2ea 0%, #bed6ec 22%, #c0bde3 46%, #adc0de 74%, #c9cde0 100%)',
      ].join(', ')
    : [
        'radial-gradient(circle at 80% 4%, rgba(150,68,255,0.86) 0%, rgba(150,68,255,0.5) 18%, rgba(150,68,255,0.16) 36%, rgba(150,68,255,0) 54%)',
        'radial-gradient(circle at -4% 44%, rgba(167,246,255,0.58) 0%, rgba(167,246,255,0.22) 24%, rgba(167,246,255,0.06) 36%, rgba(167,246,255,0) 52%)',
        'radial-gradient(circle at 4% 72%, rgba(16,68,255,0.88) 0%, rgba(16,68,255,0.54) 16%, rgba(16,68,255,0.2) 34%, rgba(16,68,255,0) 56%)',
        'radial-gradient(circle at 24% 52%, rgba(11,11,171,0.94) 0%, rgba(11,11,171,0.75) 24%, rgba(11,11,171,0.3) 42%, rgba(11,11,171,0) 66%)',
        'linear-gradient(175deg, #d8d2ea 0%, #bed6ec 22%, #c0bde3 46%, #adc0de 74%, #c9cde0 100%)',
      ].join(', ');

  const checkScrollButtons = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  React.useEffect(() => {
    checkScrollButtons();
    const container = categoriesRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[700px] px-4">
      <div
        className={`relative overflow-hidden rounded-3xl border ${isDark ? 'border-white/18 shadow-[0_28px_80px_rgba(27,19,130,0.5)]' : 'border-white/10 shadow-[0_28px_80px_rgba(3,34,24,0.45)]'}`}
        style={{
          background: containerBackground,
        }}
      >
        <div className={`absolute inset-y-0 left-[-4%] w-20 blur-xl ${isDark ? 'bg-[radial-gradient(circle_at_0%_50%,_rgba(126,238,255,0.42)_0%,_rgba(126,238,255,0.14)_42%,_transparent_72%)]' : 'bg-[radial-gradient(circle_at_0%_50%,_rgba(41,176,118,0.3)_0%,_rgba(41,176,118,0.08)_42%,_transparent_70%)]'}`} />
        <div className={`absolute left-[14%] top-[22%] h-64 w-64 rounded-full blur-[8px] ${isDark ? 'bg-[radial-gradient(circle,_rgba(11,11,171,0.86)_0%,_rgba(11,11,171,0.64)_36%,_rgba(11,11,171,0.2)_58%,_transparent_78%)]' : 'bg-[radial-gradient(circle,_rgba(4,35,25,0.85)_0%,_rgba(4,35,25,0.6)_38%,_rgba(4,35,25,0.18)_58%,_transparent_76%)]'}`} />
        <div className={`absolute bottom-[-26%] left-1/2 h-52 w-72 -translate-x-1/2 rounded-full blur-[18px] ${isDark ? 'bg-[radial-gradient(circle,_rgba(122,143,255,0.38)_0%,_rgba(122,143,255,0.16)_34%,_transparent_74%)]' : 'bg-[radial-gradient(circle,_rgba(41,210,136,0.34)_0%,_rgba(41,210,136,0.14)_34%,_transparent_74%)]'}`} />
        <div className="absolute inset-x-[18%] top-[8%] h-16 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_rgba(255,255,255,0.02)_32%,_transparent_70%)] blur-[10px]" />
        <div className={`relative rounded-[22px] backdrop-blur-[20px] ${isDark ? 'bg-[linear-gradient(180deg,rgba(15,14,68,0.2),rgba(16,18,81,0.32))]' : 'bg-[linear-gradient(180deg,rgba(6,36,27,0.14),rgba(6,36,27,0.24))]'}`}>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 px-4 py-2">
              <span className="shrink-0 text-xs text-white">Filters:</span>
              {search.trim() && (
                <button
                  onClick={() => setSearch('')}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white transition hover:bg-white/14"
                >
                  &quot;{search}&quot; <X className="h-3 w-3" />
                </button>
              )}
              {category !== 'All' && (
                <button
                  onClick={() => setCategory('All')}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                >
                  {typeof category === 'string' ? category : (category as any)?.name} <X className="h-3 w-3" />
                </button>
              )}
              {tag !== 'All' && (
                <button
                  onClick={() => setTag('All')}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                >
                  {typeof tag === 'string' ? tag : (tag as any)?.name} <X className="h-3 w-3" />
                </button>
              )}
              {tier !== 'All' && (
                <button
                  onClick={() => setTier('All')}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                >
                  {tier} <X className="h-3 w-3" />
                </button>
              )}
              {date !== 'All' && (
                <button
                  onClick={() => setDate('All')}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white transition"
                >
                  {date} <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={onClearAll}
                className={`ml-auto shrink-0 text-xs transition text-white`}
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/48" />
              <input
                type="search"
                placeholder="Search prompts..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className={`h-10 w-full rounded-full border border-white/10 bg-black/16 pl-10 pr-4 placeholder:text-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.12)] focus:outline-none ${isDark ? 'focus:border-[#8f9dff]' : 'focus:border-[#55d497]'}`}
              />
            </div>

            <Select value={date} onValueChange={setDate}>
              <SelectTrigger className="h-10 w-[110px] rounded-full border-white/10 bg-black/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.12)]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Date</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-10 w-[110px] rounded-full border-white/10 bg-black/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.12)]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="super">Super</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="h-10 w-[110px] rounded-full border-white/10 bg-black/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.12)]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tags</SelectItem>
                {tags.filter(t => t !== 'All').map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 px-2 pb-3">
            <button
              onClick={() => scrollCategories('left')}
              disabled={!canScrollLeft}
              className="shrink-0 rounded-full p-1 text-white transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={categoriesRef}
              className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((cat, idx) => (
                <button
                  key={`${cat}-${idx}`}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm uppercase transition-colors ${
                    (typeof category === 'string' ? category : (category as any)?.name) === cat
                      ? (isDark
                        ? 'bg-white/30  shadow-[0_10px_24px_rgba(107,95,240,0.34)]'
                        : 'bg-white/30 text-white shadow-[0_10px_24px_rgba(126,240,182,0.22)]')
                      : 'text-white hover:bg-white/10 '
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              disabled={!canScrollRight}
              className="shrink-0 rounded-full p-1 text-white transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}