"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number
  duration?: number
  color?: string | string[]
}

const DEFAULT_COLOR = "#a855f7"

export function ShineBorder({
  borderWidth = 2,
  duration = 3,
  color = DEFAULT_COLOR,
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color.join(", ") : color

  return (
    <div
      style={{
        "--shine-color": color || DEFAULT_COLOR,
        background: `
          linear-gradient(to right, transparent 0%, transparent 45%, var(--shine-color) 50%, transparent 55%, transparent 100%)
        `,
        backgroundSize: "200% 200%",
        backgroundPosition: "0% 50%",
        padding: borderWidth,
        borderRadius: "0.5rem",
        ...style,
      }}
      className={cn(
        "relative rounded-lg border-2 border-violet-500 bg-origin-border animate-shine-border overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="relative rounded-[calc(0.5rem-2px)] h-full w-full bg-background">
        {children}
      </div>
    </div>
  )
}