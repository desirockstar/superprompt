'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PromptCard } from '@/components/prompt-card';
import type { Prompt } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['All', 'Business Communication', 'Content Marketing', 'Developer Tools', 'Productivity', 'Marketing', 'Product Marketing', 'Customer Success', 'Content Creation', 'Corporate Communications', 'Video Production'];

interface PromptWithPreview extends Prompt {
  preview?: string;
}

export default function Home() {
  const [prompts, setPrompts] = useState<PromptWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadPrompts();
  }, [category]);

  async function loadPrompts() {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number | undefined> = {};
      if (category !== 'All') params.category = category;
      
      const response = await api.get<{ prompts: PromptWithPreview[] }>('/prompts', params);
      setPrompts(response.prompts || []);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">SuperPrompt</h1>
          <p className="text-muted-foreground">
            Discover and use high-quality AI prompts
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} preview={prompt.preview} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
