import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface KPICardProps {
  id: string;
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'green' | 'red' | 'indigo' | 'mixed';
  subtitle?: string;
}

export default function KPICard({
  id,
  title,
  value,
  icon: Icon,
  variant,
  subtitle,
}: KPICardProps) {
  const getColors = () => {
    switch (variant) {
      case 'green':
        return {
          bg: 'bg-emerald-50/50 border-emerald-100 dark:bg-[#161920] dark:border-[#1E222A]',
          text: 'text-emerald-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold',
          iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full',
          valText: 'text-emerald-600 dark:text-white',
          valClass: 'font-light italic',
        };
      case 'red':
        return {
          bg: 'bg-rose-50/50 border-rose-100 dark:bg-[#161920] dark:border-[#1E222A]',
          text: 'text-rose-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold',
          iconBg: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 rounded-full',
          valText: 'text-rose-600 dark:text-white',
          valClass: 'font-light italic',
        };
      case 'indigo':
      case 'mixed':
      default: {
        const isPos = value >= 0;
        return {
          bg: 'bg-blue-50/50 border-blue-105 dark:bg-[#161920] dark:border-[#1E222A] dark:ring-1 dark:ring-indigo-500/30',
          text: 'text-blue-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold',
          iconBg: 'bg-blue-100 text-blue-800 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full',
          valText: isPos ? 'text-blue-750 dark:text-indigo-400' : 'text-amber-700 dark:text-amber-400',
          valClass: 'font-semibold',
        };
      }
    }
  };

  const colors = getColors();

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`relative overflow-hidden flex flex-col justify-between p-6 rounded-2xl border ${colors.bg} shadow-xs`}
    >
      <div className="flex items-center justify-between">
        <span className={`${colors.text}`}>
          {title}
        </span>
        <div className={`w-8 h-8 ${colors.iconBg} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="mt-4">
        <motion.p 
          key={value}
          initial={{ scale: 0.98, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl md:text-3xl tracking-tight font-sans ${colors.valClass} ${colors.valText}`}
        >
          {formatCurrency(value)}
        </motion.p>
        
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
