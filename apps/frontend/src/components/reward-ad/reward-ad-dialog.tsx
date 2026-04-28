'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createRewardAdProvider, type AdResult } from '@/lib/ads/reward-ad-provider';

interface RewardAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdCompleted: () => void;
  promptTitle?: string;
}

type AdState = 'idle' | 'loading' | 'showing' | 'completed' | 'error';

export function RewardAdDialog({
  open,
  onOpenChange,
  onAdCompleted,
  promptTitle = 'this prompt',
}: RewardAdDialogProps) {
  const [adState, setAdState] = useState<AdState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const providerRef = useRef<ReturnType<typeof createRewardAdProvider> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      providerRef.current = createRewardAdProvider();
      providerRef.current.initialize().catch(console.error);
    }
  }, [open]);

  const handleShowAd = useCallback(async () => {
    if (!providerRef.current) return;

    setAdState('loading');
    setErrorMessage(null);

    try {
      const result: AdResult = await providerRef.current.showRewardedAd();

      if (result.didShowAd) {
        setAdState('showing');
      } else {
        setAdState('error');
        setErrorMessage(result.errorReason || 'No ad available');
      }
    } catch (error) {
      setAdState('error');
      setErrorMessage(String(error));
    }
  }, []);

  const handleClose = useCallback(() => {
    setAdState('idle');
    setErrorMessage(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAdComplete = useCallback(() => {
    setAdState('completed');
    setTimeout(() => {
      onAdCompleted();
      handleClose();
    }, 500);
  }, [onAdCompleted, handleClose]);

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">
                Unlock with Ad
              </Dialog.Title>
              <Dialog.Close className="rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-muted-foreground">
              Watch a short ad to unlock <strong>{promptTitle}</strong>. The ad
              will play automatically and you'll get full access once completed.
            </Dialog.Description>

            {adState === 'idle' && (
              <div className="flex flex-col gap-3">
                <Button onClick={handleShowAd} className="w-full" size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Ad to Unlock
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ad plays automatically • Takes ~15-30 seconds
                </p>
              </div>
            )}

            {adState === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading ad...</p>
              </div>
            )}

            {adState === 'showing' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <Play className="h-8 w-8 fill-primary text-primary" />
                </div>
                <p className="text-sm font-medium">Ad is playing...</p>
                <p className="text-xs text-muted-foreground">
                  Please wait for the ad to complete
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdState('completed');
                    onAdCompleted();
                    handleClose();
                  }}
                  className="mt-2"
                >
                  (Demo: Skip to unlock)
                </Button>
              </div>
            )}

            {adState === 'completed' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle className="h-12 w-12 fill-green-500 text-green-500" />
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  Unlocked!
                </p>
                <p className="text-sm text-muted-foreground">
                  You now have full access to this prompt.
                </p>
              </div>
            )}

            {adState === 'error' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm font-medium">Ad failed to load</p>
                <p className="text-xs text-center text-muted-foreground">
                  {errorMessage || 'Please try again or subscribe for full access.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleShowAd}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}