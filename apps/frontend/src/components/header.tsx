'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuthStore } from '@/lib/store';
import { useTheme } from './theme-provider';

const CATEGORIES = [
  { name: 'All', description: 'Browse the full prompt library' },
  { name: 'Business Communication', description: 'Professional emails, proposals, and memos' },
  { name: 'Content Marketing', description: 'Blog posts, newsletters, and content strategy' },
  { name: 'Developer Tools', description: 'Code review, documentation, and debugging' },
  { name: 'Productivity', description: 'Task management, planning, and focus techniques' },
  { name: 'Marketing', description: 'Campaigns, ad copy, and brand messaging' },
  { name: 'Product Marketing', description: 'Launch plans, positioning, and go-to-market' },
  { name: 'Customer Success', description: 'Onboarding, support scripts, and retention' },
  { name: 'Content Creation', description: 'Scripts, captions, and creative writing' },
  { name: 'Corporate Communications', description: 'Internal comms and announcements' },
  { name: 'Video Production', description: 'Scripts, storyboards, and production plans' },
];

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

  const handleCategorySelect = (category: string) => {
    if (category === 'All') {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <header className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-6 rounded-full border border-white/20 bg-black/80 backdrop-blur-sm px-8 py-3 shadow-lg">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="SuperPrompt" width={140} height={32} style={{ height: 'auto', width: 'auto' }} priority className="hidden md:block" />
          <Image src="/logo_small.png" alt="SuperPrompt" width={32} height={32} priority className="block md:hidden" />
        </Link>

        {/* Categories Mega Menu */}
        <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <DropdownMenuTrigger asChild onMouseEnter={() => setCategoriesOpen(true)}>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-lg gap-1"
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[520px] p-3 bg-zinc-900 border-zinc-700/60 text-zinc-100" onMouseLeave={() => setCategoriesOpen(false)}>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className="cursor-pointer flex flex-col items-start gap-0.5 rounded-md px-3 py-2.5 hover:bg-white/10 focus:bg-white/10"
                >
                  <span className="font-medium text-sm leading-tight text-zinc-100">{cat.name}</span>
                  <span className="text-xs text-zinc-400 leading-snug line-clamp-2">{cat.description}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pricing Link */}
        <Link href="/pricing">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/90 hover:text-white hover:bg-white/10 rounded-lg"
          >
            Pricing
          </Button>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3 ml-auto pl-6 border-l border-white/10">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg border-0 text-white/90 hover:text-white hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/>
                  <path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/>
                  <path d="m19.07 4.93-1.41 1.41"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
          {isAuthenticated ? (
            <>
              <User className="h-5 w-5 text-white/90" />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg text-white/90 hover:text-white hover:bg-red-500/20"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-lg">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}