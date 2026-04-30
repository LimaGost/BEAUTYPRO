// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, Calendar,
  LogOut, ShieldCheck, ArrowLeftRight, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const GOLD = '#C9A861';

const navItems = [
  { label: 'Dashboard',   path: '/admin/dashboard',     icon: LayoutDashboard },
  { label: 'Empresas',    path: '/admin/empresas',      icon: Building2 },
  { label: 'Clientes',    path: '/admin/clientes',      icon: Users },
  { label: 'Agendamentos',path: '/admin/agendamentos',  icon: Calendar },
];

export default function AdminLayout({ children }) {
  const { user, adminCompany, clearAdminCompany, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() || 'A';

  const handleSairEmpresa = () => {
    clearAdminCompany();
    navigate('/admin/empresas');
    setMenuOpen(false);
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

      {/* ── Topo: banner + header ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50">

        {/* Banner admin global */}
        <div
          className="flex items-center justify-between px-4 py-1.5"
          style={{ background: 'linear-gradient(90deg,#0d0a00,#1a1400)', borderBottom: '1px solid rgba(201,168,97,0.18)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: GOLD }}>
              Admin Global
            </span>
          </div>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {user?.name || user?.email}
          </span>
        </div>

        {/* Header principal */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: '#0C0C0C', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-black text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
            >
              B
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">
                Beauty<span style={{ color: GOLD }}>Pro</span>
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                Painel Administrativo
              </p>
            </div>
          </div>

          {/* Mobile: hamburger. Desktop: inline actions */}
          <div className="flex items-center gap-2">
            {/* Se admin entrou em empresa, mostra botão de sair */}
            {adminCompany && (
              <button
                onClick={handleSairEmpresa}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(201,168,97,0.12)', color: GOLD, border: '1px solid rgba(201,168,97,0.25)' }}
              >
                <ArrowLeftRight className="w-3 h-3" />
                Sair de {adminCompany.name}
              </button>
            )}
            <button
              onClick={() => { logout(); }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              {menuOpen
                ? <X className="w-4 h-4 text-white" />
                : <Menu className="w-4 h-4 text-white" />
              }
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Nav tabs */}
        <nav
          className="flex overflow-x-auto scrollbar-hide border-b"
          style={{ background: '#0A0A0A', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {navItems.map((item) => {
            const active = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 whitespace-nowrap text-xs font-bold flex-shrink-0 relative transition-colors"
                style={{ color: active ? GOLD : 'rgba(255,255,255,0.4)' }}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="admin-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: GOLD }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Menu mobile overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              key="menu-sheet"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 w-64 z-50 flex flex-col"
              style={{ background: '#0C0C0C', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-white font-bold text-sm">Menu Admin</span>
                <button onClick={() => setMenuOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {navItems.map((item) => {
                  const active = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                      style={{
                        background: active ? 'rgba(201,168,97,0.12)' : 'transparent',
                        color: active ? GOLD : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="px-3 pb-4 space-y-2 border-t pt-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {adminCompany && (
                  <button
                    onClick={handleSairEmpresa}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(201,168,97,0.10)', color: GOLD, border: '1px solid rgba(201,168,97,0.2)' }}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Sair de {adminCompany.name}
                  </button>
                )}
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      {/* Header: banner(28px) + header(56px) + tabs(40px) = 124px */}
      <main className="flex-1" style={{ paddingTop: '124px' }}>
        {children}
      </main>
    </div>
  );
}
