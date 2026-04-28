'use client';

import { useState, useRef, useCallback, HTMLAttributes } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  size?: number;
  trigger?: 'click' | 'autoplay';
}

export function AnimatedIcon({ src, size = 80, trigger = 'click', className, ...props }: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const lottieRef = useRef<any>(null);

  const playAnimation = useCallback(() => {
    lottieRef.current?.play();
  }, []);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      // style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={trigger === 'click' ? playAnimation : undefined}
      {...props}
    >
      <DotLottieReact

        dotLottieRefCallback={(dotLottie) => {
          lottieRef.current = dotLottie;
        }}
        src={src}
        autoplay={trigger === 'autoplay'}
        loop={false}
        // style={{ width: size, height: size }}
      />
    </div>
  );
}