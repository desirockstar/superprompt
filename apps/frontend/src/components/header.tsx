'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuthStore } from '@/lib/store';
import { useTheme } from './theme-provider';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-2 rounded-full border border-white/20 bg-black px-4 py-2 shadow-lg">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="SuperPrompt" width={120} height={100} priority className="hidden md:block" />
          <Image src="/logo_small.png" alt="SuperPrompt" width={40} height={40} priority className="block md:hidden" />
        </Link>

        <div className="flex items-center gap-2 ml-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-0 text-white bg-white/10">
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
          
          {isAuthenticated ? (
            <>
              <User className="h-5 w-5 text-white" />
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white" onClick={() => logout()}>
                <LogOut className="h-4 w-4 hover:text-black" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full bg-white text-black hover:bg-white/90">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}