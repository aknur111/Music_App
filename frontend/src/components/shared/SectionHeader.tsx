import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  onViewAll?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  viewAllHref,
  onViewAll,
  action,
  className,
}) => {
  return (
    <div className={`flex items-end justify-between gap-4 ${className ?? ''}`}>
      <div className="flex flex-col gap-0.5">
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-white tracking-tight"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-sm text-white/40"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {(viewAllHref || onViewAll || action) && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
          {(viewAllHref || onViewAll) && (
            viewAllHref ? (
              <Link to={viewAllHref}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-0.5 text-sm text-white/40 hover:text-violet-400 transition-colors duration-200 cursor-pointer"
                >
                  <span className="font-medium">View all</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </Link>
            ) : (
              <motion.button
                whileHover={{ x: 2 }}
                onClick={onViewAll}
                className="flex items-center gap-0.5 text-sm text-white/40 hover:text-violet-400 transition-colors duration-200"
              >
                <span className="font-medium">View all</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )
          )}
        </div>
      )}
    </div>
  );
};
