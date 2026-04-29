'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['All', 'Business Communication', 'Content Marketing', 'Developer Tools', 'Productivity', 'Marketing', 'Product Marketing', 'Customer Success', 'Content Creation', 'Corporate Communications', 'Video Production'];

const TIERS = ['All', 'starter', 'builder', 'pro', 'super'];
const DATES = ['All', 'newest', 'oldest'];

interface PromptWithPreview extends Prompt {
  preview?: string;
  tier?: 'starter' | 'builder' | 'pro' | 'super' | null;
  primaryTag?: string;
  views?: number;
  isViral?: boolean;
  isNano?: boolean;
}

export default function Home() {
  const [prompts, setPrompts] = useState<PromptWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [tier, setTier] = useState('All');
  const [date, setDate] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPrompts = useCallback(async (pageNum = 1, reset = true) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      const params: Record<string, string | number | undefined> = {
        page: pageNum,
        limit: 20,
      };
      if (category !== 'All') params.category = category;
      if (tier !== 'All') params.tier = tier;
      if (date !== 'All') params.date = date;
      if (search.trim()) params.search = search.trim();
      
      const response = await api.get<{ prompts: PromptWithPreview[]; total: number }>('/prompts', params);
      const newPrompts = response.prompts || [];
      
      if (reset) {
        setPrompts(newPrompts);
      } else {
        setPrompts(prev => [...prev, ...newPrompts]);
      }
      
      setHasMore(newPrompts.length >= 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, tier, date, search]);

  useEffect(() => {
    loadPrompts(1, true);
  }, [category, tier, date, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPrompts(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, loadPrompts]);

  const hasActiveFilters = category !== 'All' || tier !== 'All' || date !== 'All' || search.trim() !== '';

  function clearFilters() {
    setCategory('All');
    setTier('All');
    setDate('All');
    setSearch('');
  }

  function removeFilter(type: 'category' | 'tier' | 'date' | 'search') {
    switch (type) {
      case 'category': setCategory('All'); break;
      case 'tier': setTier('All'); break;
      case 'date': setDate('All'); break;
      case 'search': setSearch(''); break;
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image src="/mascot.png" alt="SuperPrompt" width={400} height={50} priority />
          </div>
          <p className="text-muted-foreground">
            Discover and use high-quality AI prompts
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search prompts..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={date} onValueChange={setDate}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Any Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Date</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="super">Super</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {search.trim() && (
                <Button variant="secondary" size="sm" onClick={() => removeFilter('search')} className="h-6 px-2 text-xs">
                  "{search}" ×
                </Button>
              )}
              {category !== 'All' && (
                <Button variant="secondary" size="sm" onClick={() => removeFilter('category')} className="h-6 px-2 text-xs">
                  {category} ×
                </Button>
              )}
              {tier !== 'All' && (
                <Button variant="secondary" size="sm" onClick={() => removeFilter('tier')} className="h-6 px-2 text-xs">
                  {tier} ×
                </Button>
              )}
              {date !== 'All' && (
                <Button variant="secondary" size="sm" onClick={() => removeFilter('date')} className="h-6 px-2 text-xs">
                  {date} ×
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs text-destructive">
                Clear all
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No prompts found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prompts.map((prompt) => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt} 
                  preview={prompt.preview} 
                  tier={prompt.tier}
                />
              ))}
            </div>
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {loadingMore && <span>Loading more...</span>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}