'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  'Business Communication',
  'Content Marketing',
  'Developer Tools',
  'Productivity',
  'Marketing',
  'Product Marketing',
  'Customer Success',
  'Content Creation',
  'Corporate Communications',
  'Video Production',
];

const TIER_LEVELS = ['starter', 'builder', 'pro', 'super'];

export default function SubmitPage() {
  const router = useRouter();
  const { isAuthenticated, authChecked } = useAuthStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [singleContent, setSingleContent] = useState('');
  const [multiVersion, setMultiVersion] = useState(false);
  const [multiContent, setMultiContent] = useState<Record<string, string>>({
    starter: '',
    builder: '',
    pro: '',
    super: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push('/login');
    }
  }, [authChecked, isAuthenticated, router]);

  function handleMultiContentChange(tier: string, value: string) {
    setMultiContent((prev) => ({ ...prev, [tier]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let payload: { title: string; category: string; content: Record<string, string>; isMultiVersion: boolean };

    if (!multiVersion) {
      if (singleContent.trim().length < 50) {
        setError('Prompt content must be at least 50 characters');
        return;
      }
      payload = {
        title: title.trim(),
        category,
        content: { content: singleContent.trim() },
        isMultiVersion: false,
      };
    } else {
      const contentCount = Object.values(multiContent).filter((c) => c.trim().length >= 50).length;
      if (contentCount === 0) {
        setError('Please provide at least one prompt content (minimum 50 characters)');
        return;
      }
      payload = {
        title: title.trim(),
        category,
        content: multiContent,
        isMultiVersion: true,
      };
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/prompts', payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked || !isAuthenticated) {
    return null;
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Submission Received!</CardTitle>
            <CardDescription>Your prompt has been submitted for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Prompt</CardTitle>
            <CardDescription>
              Your prompt will be graded and assigned a tier (Starter/Builder/Pro/Super) based on quality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional Email Responder"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiVersion"
                  checked={multiVersion}
                  onChange={(e) => setMultiVersion(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="multiVersion" className="cursor-pointer">
                  Add multiple difficulty levels (optional)
                </Label>
              </div>

              {!multiVersion ? (
                <div className="space-y-2">
                  <Label>Prompt Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Write your prompt. It will be graded and assigned a tier based on quality.
                  </p>
                  <textarea
                    className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
                    placeholder="Write your prompt here..."
                    value={singleContent}
                    onChange={(e) => setSingleContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {singleContent.length}/50 characters {singleContent.length >= 50 ? '✓' : ''}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Prompt Content (multiple levels)</Label>
                  <p className="text-sm text-muted-foreground">
                    Provide content for each difficulty level. Each tier requires minimum 50 characters.
                  </p>

                  {TIER_LEVELS.map((tier) => (
                    <div key={tier} className="space-y-2">
                      <Label className="capitalize">{tier} Level</Label>
                      <textarea
                        className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
                        placeholder={`Write your ${tier} level prompt here...`}
                        value={multiContent[tier]}
                        onChange={(e) => handleMultiContentChange(tier, e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {multiContent[tier].length}/50 characters {multiContent[tier].length >= 50 ? '✓' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}