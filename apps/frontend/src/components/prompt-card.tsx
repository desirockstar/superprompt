'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { badgeVariants } from './ui/badge';
import { TierBadge } from '@/components/tier-badge';
import type { Prompt } from '@/lib/types';
import { Share2 } from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt & { primaryTag?: string; views?: number; isViral?: boolean; isNano?: boolean; likes?: number };
  preview?: string;
  tier?: 'starter' | 'builder' | 'pro' | 'super' | null;
}

export function PromptCard({ prompt, preview, tier }: PromptCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(prompt.likes || 0);

  const getCategoryVariant = () => {
    const cat = prompt.category.toLowerCase();
    if (cat.includes('business')) return 'secondary';
    if (cat.includes('content')) return 'default';
    if (cat.includes('developer')) return 'destructive';
    return 'outline';
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/prompts/${prompt.slug}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <Link href={`/prompts/${prompt.slug}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{prompt.title}</CardTitle>
            <div className="flex items-center gap-1">
              {tier && <TierBadge level={tier} />}
              {prompt.isViral && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">VIRAL</span>
              )}
              {prompt.isNano && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-white rounded">NANO</span>
              )}
            </div>
          </div>
          {prompt.primaryTag && (
            <span className="text-xs text-primary font-medium">{prompt.primaryTag}</span>
          )}
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap break-words">
            {preview || 'No preview available'}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className={badgeVariants({ variant: getCategoryVariant() })}>
              {prompt.category}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Share */}
            <button
              onClick={handleShare}
              className="hover:text-primary flex items-center gap-1"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}