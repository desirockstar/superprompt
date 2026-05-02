import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

type TierLevel = 'starter' | 'builder' | 'pro' | 'super';

interface TierBadgeProps {
  level: TierLevel | null | undefined;
  showLabel?: boolean;
  showPending?: boolean;
}

const TIER_LABELS: Record<TierLevel, string> = {
  starter: 'Starter',
  builder: 'Builder',
  pro: 'Pro',
  super: 'Super',
};

const TIER_ICONS: Record<TierLevel, string> = {
  starter: '',
  builder: '',
  pro: '',
  super: '👑',
};

export function TierBadge({ level, showLabel = true, showPending = true }: TierBadgeProps) {
  if (!level) {
    if (showPending) {
      return (
        <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50">
          ⏳ Pending
        </Badge>
      );
    }
    return null;
  }

  const label = showLabel ? TIER_LABELS[level] : level;
  const icon = TIER_ICONS[level];

  return (
    <Badge variant={level} className="capitalize">
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}