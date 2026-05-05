import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#06060e] text-white flex overflow-hidden">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Admin top bar */}
        <div className="h-16 flex items-center px-8 border-b border-white/[0.04] bg-[#06060e]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-white/50">
              Admin Console
            </span>
            <span className="text-white/20">/</span>
            <span className="text-sm font-medium text-white/80 capitalize">
              {location.pathname.split('/').filter(Boolean).slice(-1)[0] ?? 'Overview'}
            </span>
          </div>

          {/* Alert strip */}
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="text-xs text-orange-300 font-medium">Admin mode</span>
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 p-8 overflow-y-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
