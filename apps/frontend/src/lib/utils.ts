import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    starter: "bg-green-100 text-green-800",
    builder: "bg-blue-100 text-blue-800",
    pro: "bg-purple-100 text-purple-800",
    super: "bg-yellow-100 text-yellow-800",
  };
  return colors[level] || colors.starter;
}

export function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    starter: "Starter",
    builder: "Builder",
    pro: "Pro",
    super: "Super",
  };
  return labels[level] || level;
}