import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PlayerBar } from '@/components/layout/PlayerBar';
import { NowPlayingModal } from '@/components/ui/NowPlayingModal';
import { useSidebarStore } from '@/store/sidebarStore';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayer } from '@/hooks/usePlayer';

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { isCollapsed } = useSidebarStore();
  const { currentTrack } = usePlayerStore();
  usePlayer(); // initialise audio element lifecycle for the app

  const sidebarWidth = isCollapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* TopBar */}
      <TopBar />

      {/* Main content area */}
      <motion.main
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="pt-16 min-h-screen"
        style={{
          paddingLeft: sidebarWidth,
          paddingBottom: currentTrack ? '88px' : '24px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={PAGE_TRANSITION.initial}
            animate={PAGE_TRANSITION.animate}
            exit={PAGE_TRANSITION.exit}
            transition={PAGE_TRANSITION.transition}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* PlayerBar */}
      <PlayerBar />

      {/* Now Playing fullscreen modal */}
      <NowPlayingModal />
    </div>
  );
};
