'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge, badgeVariants } from './ui/badge';
import type { Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: Prompt;
  preview?: string;
}

export function PromptCard({ prompt, preview }: PromptCardProps) {
  // Map categories to simplified levels
  const getCategoryVariant = () => {
    const cat = prompt.category.toLowerCase();
    if (cat.includes('business')) return 'secondary';
    if (cat.includes('content')) return 'default';
    if (cat.includes('developer')) return 'destructive';
    return 'outline';
  };

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{prompt.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {preview || 'Click to view prompt...'}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={badgeVariants({ variant: getCategoryVariant() })}>
            {prompt.category}
          </span>
          <span>{prompt.isMultiVersion ? 'Multi-version' : 'Single'}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}