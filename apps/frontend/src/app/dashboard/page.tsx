'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TierBadge } from '@/components/tier-badge';

interface Submission {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  tier?: string;
}

export default function DashboardPage() {
  const { isAuthenticated, authChecked } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (authChecked && isAuthenticated) {
      loadSubmissions();
    }
  }, [authChecked, isAuthenticated]);

  async function loadSubmissions() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<{ prompts: Submission[] }>('/prompts/my');
      setSubmissions(response.prompts || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  if (!authChecked || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your prompt submissions</p>
          </div>
          <Link href="/submit">
            <Button>Submit New Prompt</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Submissions Yet</CardTitle>
              <CardDescription>
                You haven't submitted any prompts yet. Submit your first prompt to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/submit">
                <Button>Submit a Prompt</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground">{submission.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.tier && <TierBadge level={submission.tier as any} />}
                      <span
                        className={`px-2 py-1 rounded text-xs text-white ${statusColors[submission.status]}`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}