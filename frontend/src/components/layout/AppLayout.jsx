import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="md:ml-60 flex flex-col min-h-screen">
        <Header onMenuToggle={() => setMobileMenuOpen((v) => !v)} />

        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
