'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PromptLevel } from '@/lib/types';
import Link from 'next/link';

const LEVELS: PromptLevel[] = ['starter', 'builder', 'pro', 'super'];

interface PromptContent {
  [key: string]: string;
}

interface PromptData {
  id: string;
  title: string;
  category: string;
  status: string;
  basePath: string;
  currentVersion: number;
  isMultiVersion: boolean;
  preview?: string;
  content?: PromptContent;
}

export default function PromptPage() {
  const params = useParams();
  const promptId = params.id as string;
  
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<PromptLevel>('starter');

  useEffect(() => {
    loadPrompt();
  }, [promptId]);

  async function loadPrompt() {
    setLoading(true);
    try {
      const data = await api.get<PromptData>(`/prompts/${promptId}`);
      setPrompt(data);
    } catch (error) {
      console.error('Failed to load prompt:', error);
    } finally {
      setLoading(false);
    }
  }

  function getContent(): string {
    if (!prompt?.content) return '';
    return prompt.content[selectedLevel] || prompt.content.starter || '';
  }

  function getPreview(): string {
    if (!prompt?.preview) return '';
    return prompt.preview;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getContent());
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Prompt not found</div>
      </div>
    );
  }

  const content = getContent();
  const preview = getPreview();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{prompt.title}</h1>
          <p className="text-muted-foreground">{prompt.category}</p>
        </div>

        {prompt.isMultiVersion ? (
          <Tabs
            value={selectedLevel}
            onValueChange={(v) => setSelectedLevel(v as PromptLevel)}
          >
            <TabsList>
              {LEVELS.map((level) => (
                <TabsTrigger key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            {LEVELS.map((level) => (
              <TabsContent key={level} value={level}>
                <div className="rounded-lg border p-4">
                  <div className="space-y-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
                      {content || preview || 'No content available'}
                    </pre>
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard}>Copy</Button>
                      <Link href="/login">
                        <Button variant="outline">Sign in for full access</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="rounded-lg border p-4">
            <div className="space-y-4">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                {content || preview || 'No content available'}
              </pre>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard}>Copy</Button>
                <Link href="/login">
                  <Button variant="outline">Sign in for full access</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
