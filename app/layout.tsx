'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

const navItems = [
  {
    href: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
        <rect x="7" y="13" width="3" height="5" rx="1" className="fill-blue-500" />
        <rect x="12" y="9" width="3" height="9" rx="1" className="fill-indigo-500" />
        <rect x="17" y="5" width="3" height="13" rx="1" className="fill-green-500" />
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    href: '/cashflow',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Cashflow',
  },
  {
    href: '/attendance',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Attendance',
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <html lang="en">
      <head>
        <title>Penumping Cashflow System</title>
      </head>
      <body className={inter.className + ' text-xs'}>
        <div className="min-h-screen bg-gray-50 flex flex-row">
          {/* Sidebar Desktop */}
          <aside
            className={
              'fixed top-0 left-0 z-50 h-full w-16 bg-gradient-to-b from-[#232946] to-[#3b3c5c] text-white flex-col items-center py-6 rounded-r-3xl shadow-xl transition-transform duration-200' +
              ' hidden md:flex'
            }
          >
            <div className="flex flex-col gap-6 flex-1 items-center justify-center w-full">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center w-11 h-11 rounded-xl hover:bg-indigo-600/80 transition-colors group"
                  title={item.label}
                >
                  <span className="text-indigo-300 group-hover:text-white transition-colors">{item.icon}</span>
                  <span className="text-[10px] mt-1 text-indigo-200 group-hover:text-white hidden xl:block">{item.label}</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Burger for mobile/tablet */}
          <button
            className="fixed top-3 left-3 z-50 md:hidden bg-white/80 border border-gray-200 rounded-lg p-2 shadow-lg focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Sidebar Drawer Mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 bg-black/30 flex">
              <aside className="h-full w-48 bg-gradient-to-b from-[#232946] to-[#3b3c5c] text-white flex flex-col items-center py-8 rounded-r-3xl shadow-2xl animate-slideInLeft">
                <button
                  className="absolute top-3 right-3 text-white hover:text-indigo-300"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex flex-col gap-6 flex-1 items-center justify-center w-full mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center justify-center w-11 h-11 rounded-xl hover:bg-indigo-600/80 transition-colors group"
                      title={item.label}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="text-indigo-300 group-hover:text-white transition-colors">{item.icon}</span>
                      <span className="text-[11px] mt-1 text-indigo-200 group-hover:text-white">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </aside>
              <div className="flex-1" onClick={() => setSidebarOpen(false)} />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-h-screen md:ml-16 px-2 py-2">
            {children}
            <footer className="w-full text-center text-xs text-gray-400 py-2">
              &copy; 2025 /ail-tech
            </footer>
          </main>
        </div>
        <style jsx global>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          .animate-slideInLeft {
            animation: slideInLeft 0.2s cubic-bezier(0.4,0,0.2,1) both;
          }
        `}</style>
      </body>
    </html>
  );
} 