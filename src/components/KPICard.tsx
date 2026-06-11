import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import type { Theme } from '../utils/storage';
import { mp } from '../utils/theme';

interface KPICardProps {
  id: string;
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'green' | 'red' | 'indigo' | 'mixed';
  subtitle?: string;
  referenceValue?: number;
  theme?: Theme;
}

interface VariantStyle {
  /** Gradient accent colors */
  gradientFrom: string;
  gradientTo: string;
  /** Bar / accent color */
  accent: string;
  /** Light mode bar */
  accentLight: string;
  /** Glass background light */
  glassLight: string;
  /** Glass background dark */
  glassDark: string;
  /** Text color for value */
  valueText: string;
  /** Icon bg color */
  iconBg: string;
  /** Label color */
  labelColor: string;
}

const variantStyles: Record<string, VariantStyle> = {
  green: {
    gradientFrom: '#059669',
    gradientTo: '#10b981',
    accent: '#34d399',
    accentLight: '#a7f3d0',
    glassLight: 'rgba(16,185,129,0.08)',
    glassDark: 'rgba(16,185,129,0.06)',
    valueText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/20 dark:bg-emerald-400/15',
    labelColor: 'text-emerald-700 dark:text-emerald-400',
  },
  red: {
    gradientFrom: '#dc2626',
    gradientTo: '#f43f5e',
    accent: '#fb7185',
    accentLight: '#fecdd3',
    glassLight: 'rgba(244,63,94,0.08)',
    glassDark: 'rgba(244,63,94,0.06)',
    valueText: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/20 dark:bg-rose-400/15',
    labelColor: 'text-rose-700 dark:text-rose-400',
  },
  indigo: {
    gradientFrom: '#6366f1',
    gradientTo: '#818cf8',
    accent: '#a5b4fc',
    accentLight: '#c7d2fe',
    glassLight: 'rgba(99,102,241,0.08)',
    glassDark: 'rgba(99,102,241,0.06)',
    valueText: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/20 dark:bg-indigo-400/15',
    labelColor: 'text-indigo-700 dark:text-indigo-400',
  },
  mixed: {
    gradientFrom: '#6366f1',
    gradientTo: '#818cf8',
    accent: '#a5b4fc',
    accentLight: '#c7d2fe',
    glassLight: 'rgba(99,102,241,0.08)',
    glassDark: 'rgba(99,102,241,0.06)',
    valueText: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/20 dark:bg-indigo-400/15',
    labelColor: 'text-indigo-700 dark:text-indigo-400',
  },
};

function AnimatedValue({ value, className }: { value: number; className: string }) {
  const prevValue = useRef(value);
  const motionValue = useMotionValue(prevValue.current);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 18, mass: 0.4 });
  const display = useTransform(spring, (v) => formatCurrency(v));

  useEffect(() => {
    const diff = value - prevValue.current;
    motionValue.set(prevValue.current + diff);
    prevValue.current = value;
  }, [value, motionValue]);

  return <motion.p className={className}>{display}</motion.p>;
}

export default function KPICard({
  id,
  title,
  value,
  icon: Icon,
  variant,
  subtitle,
  referenceValue,
  theme = 'light',
}: KPICardProps) {
  const isNeg = value < 0;
  const key = variant === 'mixed' ? (isNeg ? 'red' : 'indigo') : variant;
  const colors = variantStyles[key] || variantStyles.indigo;

  // Mini progress bar ratio
  const ratio = referenceValue && referenceValue > 0
    ? Math.min(Math.abs(value) / referenceValue, 1)
    : 0;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      style={{
        backgroundColor: mp(theme, 'surface'),
        borderColor: mp(theme, 'border'),
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-[#161920] shadow-sm hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-black/20 transition-all duration-300"
    >
      {/* Gradient accent stripe at top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{
          background: `linear-gradient(90deg, ${colors.gradientFrom}, ${colors.gradientTo})`,
        }}
      />

      {/* Subtle glass sheen overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at 50% 0%, ${colors.glassLight}, transparent 70%)`,
        }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.08em] ${colors.labelColor}`}
          >
            {title}
          </span>
          <div
            className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl ${colors.iconBg} backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5`}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color: colors.accent }} />
          </div>
        </div>

        {/* Value */}
        <div className="mt-4">
          <AnimatedValue
            value={value}
            className={`text-2xl sm:text-[28px] font-semibold tracking-tight ${
              variant === 'mixed' && isNeg
                ? 'text-amber-600 dark:text-amber-400'
                : colors.valueText
            }`}
          />

          {subtitle && (
            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              {subtitle}
            </p>
          )}
        </div>

        {/* Mini progress indicator bar */}
        {ratio > 0 && variant === 'red' && (
          <div className="mt-4 h-0.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: ratio }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="h-full origin-left rounded-full"
              style={{ backgroundColor: colors.accent }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
