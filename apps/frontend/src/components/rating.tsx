'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface RatingProps {
  promptId: string;
  average?: number;
  count?: number;
  onRatingChange?: (rating: number) => void;
}

export function RatingDisplay({ promptId, average, count = 0 }: RatingProps) {
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState({ average, count });

  useEffect(() => {
    async function fetchRating() {
      try {
        const data = await api.get<{ average: number | null; count: number }>(`/prompts/${promptId}/rating`);
        setRatingData({ average: data.average ?? undefined, count: data.count });
      } catch (err) {
        console.error('Failed to fetch rating:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRating();
  }, [promptId]);

  if (loading) {
    return <span className="text-sm text-muted-foreground">Loading...</span>;
  }

  if (ratingData.count === 0) {
    return <span className="text-sm text-muted-foreground">No ratings yet</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={cn(
            "text-sm",
            star <= Math.round(ratingData.average || 0) ? "text-yellow-500" : "text-muted"
          )}>
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {ratingData.average?.toFixed(1)} ({ratingData.count})
      </span>
    </div>
  );
}

export function StarRatingInput({ promptId }: { promptId: string }) {
  const { isAuthenticated, authChecked } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(value: number) {
    if (!isAuthenticated || submitting) return;
    
    setSubmitting(true);
    try {
      await api.post(`/prompts/${promptId}/rate`, { rating: value });
      setRating(value);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked || !isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground">
        Login to rate this prompt
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm text-green-500">
        Thanks for your rating! ★{rating}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Rate this prompt</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={cn(
              "text-2xl transition-colors",
              (hover || rating) >= star ? "text-yellow-500" : "text-muted hover:text-yellow-400",
              submitting && "opacity-50 cursor-not-allowed"
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}