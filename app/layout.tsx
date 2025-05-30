'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

const navItems = [
  { href: '/cashflow', icon: '💸' },
  { href: '/', icon: '📊' },
  { href: '/attendance', icon: '🕒' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Penumping Cashflow System</title>
      </head>
      <body className={inter.className + ' text-xs'}>
        <div className="min-h-screen bg-gray-50 flex flex-row">
          {/* Minimal Sidebar */}
          <aside className="fixed top-0 left-0 z-50 h-full w-14 bg-gradient-to-b from-[#1e293b] to-[#312e81] text-white flex flex-col items-center py-4 rounded-r-2xl shadow-2xl">
            <div className="flex flex-col gap-6 flex-1 items-center justify-center w-full">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-indigo-600/80 transition-colors text-2xl"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </aside>
          {/* Main Content */}
          <main className="flex-1 min-h-screen ml-14 px-2 py-2">
            {children}
            <footer className="w-full text-center text-xs text-gray-400 py-2">
              &copy; 2025 /ail-tech
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
} 