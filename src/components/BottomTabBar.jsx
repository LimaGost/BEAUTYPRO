// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, DollarSign, Sparkles,
  Package, Receipt, BarChart3, MessageSquare,
  User, Grid3X3, X, ShieldCheck, ArrowLeftRight,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';

const primaryTabs = [
  { name: 'Agenda',    icon: Calendar,   page: 'Agenda' },
  { name: 'Clientes',  icon: Users,      page: 'Clients' },
  { name: 'Financeiro',icon: DollarSign, page: 'Financial' },
  { name: 'Serviços',  icon: Sparkles,   page: 'Services' },
];

const moreItems = [
  { name: 'Profissionais', icon: User,          page: 'Professionals' },
  { name: 'Produtos',      icon: Package,       page: 'Products' },
  { name: 'Despesas',      icon: Receipt,       page: 'Expenses' },
  { name: 'Relatórios',    icon: BarChart3,     page: 'Reports' },
  { name: 'WhatsApp',      icon: MessageSquare, page: 'Messages' },
];

const GOLD = '#C9A861';
const GRAY = '#6B7280';

export default function BottomTabBar({ currentPageName }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin, adminCompany, clearAdminCompany } = useAuth();
  const navigate = useNavigate();

  const isMoreActive = moreItems.some((i) => i.page === currentPageName);

  const handleTrocarEmpresa = () => {
    setMoreOpen(false);
    clearAdminCompany();
    navigate('/admin/empresas');
  };

  return (
    <>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/[0.08] flex sm:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {primaryTabs.map((tab) => {
          const isActive = currentPageName === tab.page;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              onClick={() => setMoreOpen(false)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 select-none min-h-[56px] relative"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-x-1 inset-y-1 rounded-xl"
                  style={{ background: 'rgba(201,168,97,0.12)' }}
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
                />
              )}
              <tab.icon
                className="relative z-10 w-[22px] h-[22px]"
                style={{ color: isActive ? GOLD : GRAY }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className="relative z-10 text-[10px] font-semibold"
                style={{ color: isActive ? GOLD : GRAY }}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* Mais */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 select-none min-h-[56px] relative"
        >
          {(isMoreActive || moreOpen) && (
            <motion.div
              layoutId="tab-pill"
              className="absolute inset-x-1 inset-y-1 rounded-xl"
              style={{ background: 'rgba(201,168,97,0.12)' }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            />
          )}
          <div className="relative z-10">
            {moreOpen
              ? <X className="w-[22px] h-[22px]" style={{ color: GOLD }} strokeWidth={2.2} />
              : <Grid3X3 className="w-[22px] h-[22px]" style={{ color: (isMoreActive || moreOpen) ? GOLD : GRAY }} strokeWidth={1.8} />
            }
          </div>
          <span
            className="relative z-10 text-[10px] font-semibold"
            style={{ color: (moreOpen || isMoreActive) ? GOLD : GRAY }}
          >
            Mais
          </span>
        </button>
      </nav>

      {/* ── More drawer ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 sm:hidden"
            />

            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="fixed left-0 right-0 z-40 bg-[#0C0C0C] border-t border-white/10 rounded-t-3xl sm:hidden"
              style={{ bottom: `calc(56px + env(safe-area-inset-bottom))` }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 bg-white/20 rounded-full" />
              </div>

              <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest text-center pb-3">
                Mais opções
              </p>

              <div className="grid grid-cols-5 pb-4 px-3 gap-1">
                {moreItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-colors active:bg-white/5"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg,#C9A861,#E5D4A8)'
                            : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <item.icon
                          className="w-5 h-5"
                          style={{ color: isActive ? '#000' : '#9CA3AF' }}
                          strokeWidth={1.8}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold text-center leading-tight"
                        style={{ color: isActive ? GOLD : '#6B7280' }}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Admin: trocar empresa */}
              {isAdmin && adminCompany && (
                <div className="px-4 pb-4 border-t border-white/8 pt-3">
                  <button
                    onClick={handleTrocarEmpresa}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(201,168,97,0.08)', border: '1px solid rgba(201,168,97,0.2)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,97,0.15)' }}>
                      <ArrowLeftRight className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold" style={{ color: GOLD }}>Trocar empresa</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {adminCompany.name}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
