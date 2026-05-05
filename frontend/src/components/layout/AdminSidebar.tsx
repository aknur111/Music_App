import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Music2,
  Activity,
  BarChart3,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AdminNavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'User Analytics', icon: Users, path: '/admin/users' },
  { label: 'Track Analytics', icon: Music2, path: '/admin/tracks' },
  { label: 'Service Health', icon: Activity, path: '/admin/health' },
  { label: 'System Metrics', icon: BarChart3, path: '/admin/metrics' },
];

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-60 flex flex-col bg-[#0d0d1a] border-r border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-white/[0.04] flex-shrink-0">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/50">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-xl bg-orange-500/30 blur-sm -z-10"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
        <div>
          <span className="text-sm font-black tracking-widest bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            AURA
          </span>
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-400/60">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-1">
        {ADMIN_NAV.map(({ label, icon: Icon, path }) => {
          const isActive =
            path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

          return (
            <NavLink key={path} to={path}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl relative overflow-hidden transition-colors duration-200 cursor-pointer',
                  isActive
                    ? 'bg-orange-500/10 text-orange-300'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={clsx(
                    'w-[18px] h-[18px] flex-shrink-0 transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]'
                  )}
                />
                <span className="text-sm font-medium">{label}</span>

                {isActive && (
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-orange-600/10 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Back to App */}
      <div className="px-3 py-4 border-t border-white/[0.04] flex-shrink-0">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Back to App</span>
        </motion.button>
      </div>
    </aside>
  );
};
