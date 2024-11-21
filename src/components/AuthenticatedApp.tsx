import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { MyBookings } from './MyBookings';
import { BookingPage } from '../pages/BookingPage';
import { Book2Page } from '../pages/Book2Page';
import { AdminPage } from '../pages/AdminPage';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState<'stay' | 'my-bookings' | 'admin'>('stay');
  const session = useSession();
  const isAdmin = session?.user?.email === 'andre@thegarden.pt';

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-emerald-900 flex items-center gap-3">
              <Sprout className="w-8 h-8" />
              <h1 className="text-2xl font-display font-light tracking-wide">The Garden</h1>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex gap-6">
                <button
                  onClick={() => setCurrentPage('stay')}
                  className={`text-sm font-body transition-colors ${
                    currentPage === 'stay' 
                      ? 'text-emerald-900 font-medium' 
                      : 'text-stone-600 hover:text-emerald-900'
                  }`}
                >
                  Stay
                </button>
                <button
                  onClick={() => setCurrentPage('my-bookings')}
                  className={`text-sm font-body transition-colors ${
                    currentPage === 'my-bookings' 
                      ? 'text-emerald-900 font-medium' 
                      : 'text-stone-600 hover:text-emerald-900'
                  }`}
                >
                  My Bookings
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setCurrentPage('admin')}
                    className={`text-sm font-body transition-colors ${
                      currentPage === 'admin' 
                        ? 'text-emerald-900 font-medium' 
                        : 'text-stone-600 hover:text-emerald-900'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </nav>
              <span className="text-stone-600 font-body text-sm">{session?.user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="bg-emerald-900 text-white px-6 py-2 rounded-full hover:bg-emerald-800 transition-colors text-sm font-body"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {currentPage === 'stay' && <Book2Page />}
        {currentPage === 'my-bookings' && <MyBookings />}
        {currentPage === 'admin' && isAdmin && <AdminPage />}
      </main>
    </div>
  );
}