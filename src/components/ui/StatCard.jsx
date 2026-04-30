// @ts-nocheck
import { motion } from 'framer-motion';

export function StatCard({ icon: Icon, label, value, sub, color = '#C9A861', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && (
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>
      )}
    </motion.div>
  );
}
