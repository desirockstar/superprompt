'use client';

import * as React from 'react';

interface CircularScoreProps {
  score: number; // 0-10
  isLight?: boolean;
}

export function CircularScore({ score, isLight = true }: CircularScoreProps) {
  const [displayScore, setDisplayScore] = React.useState(0);
  const circumference = 2 * Math.PI * 45;

  React.useEffect(() => {
    const duration = 800;
    const steps = 40;
    const stepDuration = duration / steps;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, increment * step);
      setDisplayScore(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayScore(score);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score]);

  const strokeDashoffset = circumference - (score / 10) * circumference;

  let scoreColor = '#ef4444';
  let tierLabel = 'Starter';
  if (score >= 9) { scoreColor = '#C084FC'; tierLabel = 'Super'; } // #5703f3
  else if (score >= 7) { scoreColor = '#818CF8'; tierLabel = 'Pro'; } //#164bf9
  else if (score >= 5) { scoreColor = '#2DD4BF'; tierLabel = 'Builder'; } //#00927a
  else if (score >= 3) { scoreColor = '#38BDF8'; tierLabel = 'Starter'; } // #920092

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-[60px] w-[60px]">
        <svg
          width="60"
          height="60"
          viewBox="0 0 100 100"
          className="absolute inset-0"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isLight ? '#e5e5e5' : '#3a3b40'}
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={scoreColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50px 50px',
              transition: 'stroke-dashoffset 0.8s ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[16px] font-bold"
            style={{ color: scoreColor }}
          >
            {displayScore.toFixed(1)}
          </span>
        </div>
      </div>

      <div
        className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider"
        style={{ color: scoreColor }}
      >
        {tierLabel}
      </div>
    </div>
  );
}