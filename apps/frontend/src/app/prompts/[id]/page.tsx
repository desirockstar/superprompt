'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PromptLevel } from '@/lib/types';
import Link from 'next/link';
import { Copy, Check, Play, Eye, Tag } from 'lucide-react';
import { RewardAdDialog } from '@/components/reward-ad/reward-ad-dialog';
import { TierBadge } from '@/components/tier-badge';
import { RatingDisplay, StarRatingInput } from '@/components/rating';

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
  primaryTag?: string;
  isViral?: boolean;
  isNano?: boolean;
  views?: number;
  preview?: string;
  content?: PromptContent;
}

export default function PromptPage() {
  const params = useParams();
  const promptId = params.id as string;
  const { isAuthenticated, authChecked, hasSubscription, unlockedPrompts } = useAuthStore();
  
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<PromptLevel>('starter');
  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [evaluationTier, setEvaluationTier] = useState<'starter' | 'builder' | 'pro' | 'super' | null>(null);

  useEffect(() => {
    if (!authChecked) return;
    loadPrompt();
    checkIsUnlocked();
    loadEvaluation();
  }, [promptId, isAuthenticated, authChecked]);

  async function checkIsUnlocked() {
    if (isAuthenticated && promptId) {
      const isUnlocked = unlockedPrompts.has(promptId);
      setUnlocked(isUnlocked);
    }
  }

  async function loadEvaluation() {
    try {
      const evalData = await api.get<{ level: string | null }>(`/prompts/${promptId}/evaluation`);
      if (evalData.level) {
        setEvaluationTier(evalData.level as 'starter' | 'builder' | 'pro' | 'super');
      }
    } catch (error) {
      console.error('Failed to load evaluation:', error);
    }
  }

  async function loadPrompt() {
    setLoading(true);
    try {
      const endpoint = isAuthenticated ? `/prompts/${promptId}` : `/prompts/${promptId}/preview`;
      const data = await api.get<PromptData>(endpoint);
      setPrompt(data);
    } catch (error) {
      console.error('Failed to load prompt:', error);
    } finally {
      setLoading(false);
    }
  }

  function getContent(): string {
    if (!prompt?.content) return '';
    // Single version: return content directly
    // Multi version: return selected level content
    if (prompt.isMultiVersion) {
      return prompt.content[selectedLevel] || '';
    }
    return prompt.content.content || '';
  }

  function getPreview(): string {
    if (!prompt?.preview) return '';
    return prompt.preview;
  }

  function hasFullAccess(): boolean {
    if (!isAuthenticated) return false;
    // Single version: check subscription/unlock for single prompt
    // Multi version: all levels except 'super' are free
    if (prompt?.isMultiVersion) {
      if (selectedLevel === 'super') {
        return hasSubscription || unlocked || unlockedPrompts.has(promptId);
      }
      return true;
    }
    // Single version requires subscription or unlock for 'super' tier
    // (or the prompt needs to be unlocked via ad/subscription)
    return hasSubscription || unlocked || unlockedPrompts.has(promptId);
  }

  async function handleUnlockWithAd() {
    setShowAdDialog(true);
  }

  async function handleAdCompleted() {
    setUnlocking(true);
    try {
      await api.post(`/prompts/${promptId}/unlock`, {});
      setUnlocked(true);
      const newUnlocked = new Set(unlockedPrompts);
      newUnlocked.add(promptId);
      useAuthStore.setState({ unlockedPrompts: newUnlocked });
      loadPrompt();
    } catch (error) {
      console.error('Failed to unlock:', error);
    } finally {
      setUnlocking(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getContent() || getPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !authChecked) {
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
  const hasAccess = hasFullAccess();

  const renderContent = () => {
    if (hasAccess && content) {
      return (
        <div className="relative">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
            {content}
          </pre>
          <Button
            onClick={copyToClipboard}
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      );
    }

    return (
      <div className="relative">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-hidden max-h-[300px]">
          {preview || 'No content available'}
        </pre>
        <Button
          onClick={copyToClipboard}
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2"
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{prompt.title}</h1>
            <TierBadge level={evaluationTier} />
            {prompt.isViral && (
              <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded">VIRAL</span>
            )}
            {prompt.isNano && (
              <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded">NANO</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <p>{prompt.category}</p>
            {prompt.views !== undefined && prompt.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {prompt.views >= 1000 ? `${(prompt.views / 1000).toFixed(1)}k` : prompt.views}
              </span>
            )}
            <RatingDisplay promptId={promptId} />
          </div>
          {prompt.primaryTag && (
            <div className="flex items-center gap-2 mt-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{prompt.primaryTag}</span>
            </div>
          )}
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
                    {renderContent()}
                    <div className="flex flex-wrap gap-2">
                      {selectedLevel === 'super' && !hasAccess && isAuthenticated && (
                        <>
                          <Button 
                            onClick={handleUnlockWithAd} 
                            disabled={unlocking}
                            className="flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            {unlocking ? 'Unlocking...' : 'Unlock with Ad'}
                          </Button>
                          <Link href="/subscribe">
                            <Button variant="outline">Subscribe for full access</Button>
                          </Link>
                        </>
                      )}
                      {!isAuthenticated && (
                        <Link href="/login">
                          <Button variant="outline">Sign in for full access</Button>
                        </Link>
                      )}
                      <StarRatingInput promptId={promptId} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="rounded-lg border p-4">
            <div className="space-y-4">
              {renderContent()}
              <div className="flex flex-wrap gap-2">
                {selectedLevel === 'super' && !hasAccess && isAuthenticated && (
                  <>
                    <Button 
                      onClick={handleUnlockWithAd} 
                      disabled={unlocking}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {unlocking ? 'Unlocking...' : 'Unlock with Ad'}
                    </Button>
                    <Link href="/subscribe">
                      <Button variant="outline">Subscribe for full access</Button>
                    </Link>
                  </>
                )}
                {!isAuthenticated && (
                  <Link href="/login">
                    <Button variant="outline">Sign in for full access</Button>
                  </Link>
                )}
                <StarRatingInput promptId={promptId} />
              </div>
            </div>
          </div>
        )}
      </div>
      <RewardAdDialog
        open={showAdDialog}
        onOpenChange={setShowAdDialog}
        onAdCompleted={handleAdCompleted}
        promptTitle={prompt?.title}
      />
    </main>
  );
}