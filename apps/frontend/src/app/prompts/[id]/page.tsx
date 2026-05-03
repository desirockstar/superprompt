'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { isFeatureEnabled } from '@/lib/analytics';
import type { PromptLevel } from '@/lib/types';
import Link from 'next/link';
import { Copy, Check, Play, Eye, Share2, ChevronDown, Loader2, Rocket, Bookmark, Users, Globe, Cpu, ChevronRight, BookOpen, ThumbsUp, ThumbsDown, Tag as TagIcon } from 'lucide-react';
import { RewardAdDialog } from '@/components/reward-ad/reward-ad-dialog';
import { TierBadge } from '@/components/tier-badge';
import { RatingDisplay, StarRatingInput } from '@/components/rating';
import { PromptCard } from '@/components/prompt-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractVariables, fillTemplate } from '@/lib/utils';
import { Toaster, toast } from 'sonner';

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
  tier?: string | null;
}

interface RelatedPrompt extends PromptData {
  tier: string | null;
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
  
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [relatedPrompts, setRelatedPrompts] = useState<RelatedPrompt[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedOverviewCards, setExpandedOverviewCards] = useState<string[]>(['customize', 'example', 'breakdown', 'related']);

  useEffect(() => {
    if (!authChecked) return;
    loadPrompt();
    checkIsUnlocked();
    loadEvaluation();
    loadRelatedPrompts();
  }, [promptId, isAuthenticated, authChecked]);

  useEffect(() => {
    const source = getContent() || getPreview();
    if (source) {
      const vars = extractVariables(source);
      setVariables(vars);
      if (vars.length > 0) {
        const initialValues: Record<string, string> = {};
        vars.forEach(v => initialValues[v] = '');
        setVariableValues(initialValues);
      }
    }
  }, [prompt?.content, prompt?.preview, selectedLevel]);

  async function checkIsUnlocked() {
    if (isAuthenticated && promptId) {
      const isUnlocked = unlockedPrompts.has(promptId);
      setUnlocked(isUnlocked);
    }
  }

  async function loadEvaluation() {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/prompts/${promptId}/evaluation`, {
        cache: 'no-store',
      });
      if (!response.ok || response.status === 204) {
        setEvaluationTier(null);
        return;
      }
      const text = await response.text();
      if (!text) {
        setEvaluationTier(null);
        return;
      }
      const evalData = JSON.parse(text);
      if (evalData.level) {
        setEvaluationTier(evalData.level as 'starter' | 'builder' | 'pro' | 'super');
      }
    } catch (error) {
      console.error('Failed to load evaluation:', error);
      setEvaluationTier(null);
    }
  }

  async function loadRelatedPrompts() {
    setLoadingRelated(true);
    try {
      const data = await api.get<RelatedPrompt[]>(`/prompts/${promptId}/related?limit=3`);
      setRelatedPrompts(data);
    } catch (error) {
      console.error('Failed to load related prompts:', error);
    } finally {
      setLoadingRelated(false);
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
    if (prompt?.isMultiVersion) {
      if (selectedLevel === 'super') {
        return hasSubscription || unlocked || unlockedPrompts.has(promptId);
      }
      return true;
    }
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

  function copyToClipboard(text: string, message: string = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(message);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleUsePrompt() {
    const content = getContent() || getPreview();
    copyToClipboard(content, 'Prompt copied to clipboard!');
  }

  function handleGenerate() {
    const content = getContent();
    if (!content) return;
    
    setIsGenerating(true);
    const filled = fillTemplate(content, variableValues);
    setGeneratedPrompt(filled);
    setIsGenerating(false);
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/prompts/${promptId}`);
    toast.success('Link copied to clipboard!');
  }

  function formatCount(count?: number) {
    if (!count) return '0';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }

  function toggleSection(id: string) {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
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

  const showReviews = isFeatureEnabled('reviews');
  const TABS = ['overview', 'preview', 'prompt', 'examples', ...(showReviews ? ['reviews'] : [])];

  const BREAKDOWN_SECTIONS = [
    { id: 'system',    color: 'bg-blue-500',   label: 'System Prompt', desc: 'The role and behavior instructions for the AI' },
    { id: 'user',      color: 'bg-green-500',  label: 'User Prompt',   desc: 'The main instruction with variables' },
    { id: 'variables', color: 'bg-orange-500', label: 'Variables',     desc: 'Dynamic inputs used in the prompt' },
  ];

  const renderContent = () => {
    if (hasAccess && content) {
      return (
        <div className="relative">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
            {content}
          </pre>
          <Button
            onClick={() => copyToClipboard(content)}
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
          onClick={() => copyToClipboard(preview)}
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
    <main className="min-h-screen bg-background pt-30">
      <Toaster position="bottom-right" />

      {/* Breadcrumb */}
      <div className="">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <span className="text-gray-400">›</span>
          <Link href={`/?category=${encodeURIComponent(prompt.category)}`} className="hover:text-gray-300 transition-colors">
            {prompt.category}
          </Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-400 truncate max-w-[200px]">{prompt.primaryTag || prompt.title}</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title block card */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex gap-6 items-start">
                {/* Left: Icon + Content */}
                <div className="flex gap-4 items-start flex-1">
                  <div className="w-24 h-24 rounded-3xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-5xl shrink-0 select-none">
                    📝
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold leading-snug">{prompt.title}</h1>
                      {prompt.isViral && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                          🔥 Trending
                        </span>
                      )}
                      {prompt.isNano && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                          ⚡ Nano
                        </span>
                      )}
                    </div>

                    {/* Stats row with bullet separators */}
                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <RatingDisplay promptId={promptId} />
                      <span>•</span>
                      {prompt.views !== undefined && prompt.views > 0 && (
                        <>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatCount(prompt.views)} uses
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>Updated 2 days ago</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium">{prompt.category}</span>
                      {prompt.primaryTag && (
                        <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium">{prompt.primaryTag}</span>
                      )}
                      {evaluationTier && <TierBadge level={evaluationTier} />}
                    </div>

                    {/* Description */}
                    {preview && (
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {preview.slice(0, 220)}{preview.length > 220 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Quick action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button onClick={handleUsePrompt} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold text-sm h-10 whitespace-nowrap">
                    <Rocket className="h-4 w-4" />
                    Use Prompt
                  </Button>
                  <Button variant="outline" onClick={() => copyToClipboard(content || preview)} className="flex items-center gap-2 rounded-lg text-sm h-10 px-4 whitespace-nowrap">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 rounded-lg text-sm h-10 px-4 whitespace-nowrap">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="bg-slate-900 rounded-lg p-1 flex gap-1 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize rounded-md transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-slate-700 text-slate-100 dark:bg-slate-700/60 dark:text-white'
                      : 'text-white/80 hover:text-slate-300 '
                  }`}
                >
                  {tab === 'reviews' ? 'Reviews' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === 'overview' && (
              <div className="space-y-3">

                {/* § 1 Customize Inputs */}
                <section className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedOverviewCards(prev => prev.includes('customize') ? prev.filter(c => c !== 'customize') : [...prev, 'customize'])}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <h2 className="text-base font-semibold">1. Customize Your Inputs</h2>
                    <ChevronDown className={`h-5 w-5 transition-transform ${expandedOverviewCards.includes('customize') ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedOverviewCards.includes('customize') && (
                    <div className="border-t px-5 pb-5 pt-4">
                      {variables.length > 0 ? (
                        <div className="rounded-lg border-2 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {variables.map((variable) => (
                          <div key={variable} className="space-y-1.5">
                            <Label htmlFor={variable} className="capitalize font-medium text-sm">{variable}</Label>
                            <Input
                              id={variable}
                              value={variableValues[variable] || ''}
                              onChange={(e) => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))}
                              placeholder={`Enter ${variable}…`}
                              className="bg-white dark:bg-slate-950"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || Object.values(variableValues).every(v => !v.trim())}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold mt-2"
                      >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                        Generate Example
                      </Button>
                    </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                          No customizable inputs detected for this prompt.
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* § 2 Example Output */}
                <section className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedOverviewCards(prev => prev.includes('example') ? prev.filter(c => c !== 'example') : [...prev, 'example'])}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold">2. Example Output</h2>
                      {generatedPrompt && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                          Generated
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform shrink-0 ${expandedOverviewCards.includes('example') ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedOverviewCards.includes('example') && (
                    <div className="border-t px-5 pb-5 pt-4 space-y-4">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => copyToClipboard(generatedPrompt || content || preview, 'Output copied!')}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1.5 text-muted-foreground text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Output
                        </Button>
                      </div>

                      {prompt.isMultiVersion && (
                        <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as PromptLevel)} className="mb-3">
                          <TabsList>
                            {LEVELS.map((level) => (
                              <TabsTrigger key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      )}

                      <div className="rounded-lg border overflow-hidden">{renderContent()}</div>

                      {!isAuthenticated && (
                        <div className="mt-3">
                          <Link href="/login">
                            <Button variant="outline">Sign in for full access</Button>
                          </Link>
                        </div>
                      )}
                      {!hasAccess && isAuthenticated && (
                        <div className="mt-3 flex gap-3">
                          <Button onClick={handleUnlockWithAd} disabled={unlocking} className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            {unlocking ? 'Unlocking…' : 'Unlock with Ad'}
                          </Button>
                          <Link href="/subscribe">
                            <Button variant="outline">Subscribe for full access</Button>
                          </Link>
                        </div>
                      )}

                      {generatedPrompt && (
                        <div className="mt-4 relative">
                          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                            {generatedPrompt}
                          </pre>
                          <Button
                            onClick={() => copyToClipboard(generatedPrompt, 'Generated prompt copied!')}
                            size="icon"
                            variant="secondary"
                            className="absolute top-2 right-2"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* § 3 Prompt Breakdown */}
                <section className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedOverviewCards(prev => prev.includes('breakdown') ? prev.filter(c => c !== 'breakdown') : [...prev, 'breakdown'])}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <h2 className="text-base font-semibold">3. Prompt Breakdown</h2>
                      <p className="text-xs text-muted-foreground">See exactly how this prompt works under the hood.</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform shrink-0 ${expandedOverviewCards.includes('breakdown') ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedOverviewCards.includes('breakdown') && (
                    <div className="border-t px-5 pb-5 pt-4">
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={() => setExpandedSections(BREAKDOWN_SECTIONS.map(s => s.id))}
                        >
                          Expand All
                        </Button>
                      </div>
                      <div className="border rounded-lg divide-y">
                    {BREAKDOWN_SECTIONS.map(({ id, color, label, desc }) => (
                      <div key={id}>
                        <button
                          onClick={() => toggleSection(id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expandedSections.includes(id) ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSections.includes(id) && (
                          <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground bg-muted/30">
                            {id === 'variables' && variables.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {variables.map(v => (
                                  <span key={v} className="px-2 py-0.5 text-xs bg-background border rounded font-mono">{`{{${v}}}`}</span>
                                ))}
                              </div>
                            ) : (
                              <p className="italic py-1">Content available after unlock.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                      </div>
                    </div>
                  )}
                </section>

              </div>
            )}

            {/* ── Preview tab ── */}
            {activeTab === 'preview' && (
              <div className="rounded-lg border overflow-hidden">
                <pre className="whitespace-pre-wrap font-mono text-sm p-4 overflow-auto max-h-[600px]">
                  {preview || 'No preview available'}
                </pre>
              </div>
            )}

            {/* ── Prompt tab ── */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                {prompt.isMultiVersion && (
                  <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as PromptLevel)}>
                    <TabsList>
                      {LEVELS.map((level) => (
                        <TabsTrigger key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
                <div className="rounded-lg border overflow-hidden">{renderContent()}</div>
                {!hasAccess && isAuthenticated && (
                  <div className="flex gap-3">
                    <Button onClick={handleUnlockWithAd} disabled={unlocking} className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      {unlocking ? 'Unlocking…' : 'Unlock with Ad'}
                    </Button>
                    <Link href="/subscribe"><Button variant="outline">Subscribe</Button></Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Examples tab ── */}
            {activeTab === 'examples' && (
              <div className="rounded-lg border p-12 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Examples coming soon</p>
                <p className="text-sm mt-1">We're collecting real-world examples for this prompt.</p>
              </div>
            )}

            {/* ── Reviews tab ── */}
            {activeTab === 'reviews' && showReviews && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <RatingDisplay promptId={promptId} />
                  {isAuthenticated && <StarRatingInput promptId={promptId} />}
                </div>
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              </div>
            )}

            {/* Related Prompts — always visible */}
            {activeTab === 'overview' && (
            <section className="rounded-lg border bg-card mt-3">
              <button
                onClick={() => setExpandedOverviewCards(prev => prev.includes('related') ? prev.filter(c => c !== 'related') : [...prev, 'related'])}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <h2 className="text-base font-semibold">4. Related Prompts You Might Like</h2>
                <ChevronDown className={`h-5 w-5 transition-transform ${expandedOverviewCards.includes('related') ? 'rotate-180' : ''}`} />
              </button>
              {expandedOverviewCards.includes('related') && (
                <div className="border-t px-5 pb-5 pt-4">
                  <div className="flex justify-end mb-4">
                    <Link href="/" className="text-sm text-primary flex items-center gap-0.5 hover:underline">
                      View all <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
              {loadingRelated ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse shrink-0 w-[220px]">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-muted rounded w-3/4" />
                          <div className="h-2.5 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : relatedPrompts.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {relatedPrompts.map((related) => {
                    const categoryColors: Record<string, string> = {
                      marketing: 'from-pink-500 to-rose-500',
                      business: 'from-blue-500 to-indigo-500',
                      developer: 'from-green-500 to-emerald-500',
                      productivity: 'from-purple-500 to-violet-500',
                      content: 'from-orange-500 to-amber-500',
                    };
                    const colorKey = Object.keys(categoryColors).find(k =>
                      related.category.toLowerCase().includes(k)
                    ) || 'default';
                    const gradient = categoryColors[colorKey] || 'from-slate-500 to-slate-600';

                    return (
                      <Link
                        key={related.id}
                        href={`/prompts/${related.id}`}
                        className="group shrink-0 w-[200px] rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 flex flex-col gap-2.5"
                      >
                        {/* Icon + bookmark row */}
                        <div className="flex items-start justify-between">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shrink-0`}>
                            📝
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {related.title}
                        </p>

                        {/* Category */}
                        <span className="text-xs text-muted-foreground">{related.category}</span>

                        {/* Footer: rating + uses */}
                        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                          <span className="flex items-center gap-0.5">
                            <span className="text-yellow-400">★</span>
                            4.5
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatCount(related.views)} uses
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {[
                    { title: 'Ultimate Blog Post Writer', category: 'Content', gradient: 'from-orange-500 to-amber-500', emoji: '✍️', rating: '4.8', uses: '2.4k' },
                    { title: 'SEO Meta Description Generator', category: 'Marketing', gradient: 'from-pink-500 to-rose-500', emoji: '🎯', rating: '4.6', uses: '1.8k' },
                    { title: 'Cold Email Outreach Pro', category: 'Business', gradient: 'from-blue-500 to-indigo-500', emoji: '📧', rating: '4.7', uses: '3.1k' },
                    { title: 'Product Description Writer', category: 'E-Commerce', gradient: 'from-green-500 to-emerald-500', emoji: '🛒', rating: '4.9', uses: '5.2k' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="group shrink-0 w-[200px] rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 flex flex-col gap-2.5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-lg shrink-0`}>
                          {item.emoji}
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <span className="flex items-center gap-0.5">
                          <span className="text-yellow-400">★</span>
                          {item.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.uses} uses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </div>
              )}
            </section>
            )}

            {/* Helpful feedback bar */}
            <div className="rounded-lg border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-medium text-sm">Did this prompt help you?</p>
                  <p className="text-xs text-muted-foreground">Your feedback helps us improve our prompts.</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" /> Yes, helpful
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                  <ThumbsDown className="h-3.5 w-3.5" /> Not really
                </Button>
              </div>
            </div>

          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Use Prompt button */}
              <Button onClick={handleUsePrompt} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg py-3 font-semibold text-base h-12">
                <Rocket className="h-5 w-5" />
                Use Prompt
              </Button>

              {/* Social Proof card */}
              <div className="rounded-lg border p-4 space-y-4 ">
                <h3 className="font-semibold text-sm">Social Proof</h3>
                
                {/* Stats row */}
                <div className="flex gap-8">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(prompt.views)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-snug">People used this<br />prompt</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">4.8</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Average rating</div>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>

                {/* Testimonials */}
                {showReviews && (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug mb-2">"This prompt helped us increase our email epest rates by 32%."</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-300 dark:bg-purple-500" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Sarah J.</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Marketing Manager</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug mb-2">"This prompt headed to increase the email rates rase by 52%."</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-300 dark:bg-amber-500" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Mike T.</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Founder</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug mb-2">"This prompt hat users to engages and toudd sales fundel copy."</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-300 dark:bg-pink-500" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Aisha K.</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">SEO Specialist</div>
                      </div>
                    </div>
                  </div>
</div>
                </div>
                )}

              {/* Details card */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <TagIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Category</div>
                      <div className="text-sm font-medium">{prompt.category}</div>
                    </div>
                  </div>
                  {prompt.primaryTag && (
                    <div className="flex items-start gap-2.5">
                      <Cpu className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Use Case</div>
                        <div className="text-sm font-medium">{prompt.primaryTag}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Created by</div>
                      <div className="text-sm font-medium">SuperPrompt Team</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Eye className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Last Updated</div>
                      <div className="text-sm font-medium">2 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Language</div>
                      <div className="text-sm font-medium">English</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Cpu className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Compatibility</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-medium">🤖</span>
                        <span className="text-xs text-muted-foreground">GPT-4</span>
                        <span className="text-sm font-medium">🧠</span>
                        <span className="text-xs text-muted-foreground">Claude</span>
                        <span className="text-sm font-medium">✨</span>
                        <span className="text-xs text-muted-foreground">Gemini</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 text-xs bg-muted rounded-md">{prompt.category.toLowerCase()}</span>
                      {prompt.primaryTag && (
                        <span className="px-2 py-0.5 text-xs bg-muted rounded-md">{prompt.primaryTag.toLowerCase()}</span>
                      )}
                      {evaluationTier && <TierBadge level={evaluationTier} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Help card */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-1">Need help getting started?</h3>
                <p className="text-xs text-muted-foreground mb-3">Check out our guide on writing better prompts.</p>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-sm">
                  View Guide <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

            </div>
          </div>

        </div>
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