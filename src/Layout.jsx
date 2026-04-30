// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Sparkles, DollarSign, Package,
  Receipt, BarChart3, MessageSquare, Menu, X, LogOut,
  User, ChevronRight, Settings, Building2, Clock, Link2,
  ShieldCheck, ArrowLeftRight,
} from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';

const menuItems = [
  { name: 'Agenda',                   icon: Calendar,   page: 'Agenda' },
  { name: 'Clientes',                 icon: Users,      page: 'Clients' },
  { name: 'Serviços',                 icon: Sparkles,   page: 'Services' },
  { name: 'Profissionais',            icon: User,       page: 'Professionals' },
  { name: 'Produtos',                 icon: Package,    page: 'Products' },
  { name: 'Empresa',                  icon: Building2,  page: 'empresa' },
  { name: 'Horário de Funcionamento', icon: Clock,      page: 'horario-funcionamento' },
  { name: 'Link de Agendamento',      icon: Link2,      page: 'link-agendamento' },
  { name: 'Despesas',                 icon: Receipt,    page: 'Expenses' },
  { name: 'Financeiro',               icon: DollarSign, page: 'Financial' },
  { name: 'Relatórios',               icon: BarChart3,  page: 'Reports' },
];

const pageLabel = (name) =>
  menuItems.find((m) => m.page === name)?.name ||
  (name === 'Messages' ? 'WhatsApp'      :
   name === 'Settings' ? 'Configurações' :
   name || 'BeautyPro');

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, company, isAdmin, adminCompany, clearAdminCompany, logout } = useAuth();
  const navigate = useNavigate();

  const effectiveCompany = isAdmin ? adminCompany : company;

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleTrocarEmpresa = () => {
    setSidebarOpen(false);
    clearAdminCompany();
    navigate('/admin/empresas');
  };

  return (
    <div className="min-h-screen page-bg">

      {/* ── Banner de contexto admin ─────────────────────────────────────────── */}
      {isAdmin && adminCompany && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-1.5"
          style={{ background: 'linear-gradient(90deg,#1a1200,#2a1e00)', borderBottom: '1px solid rgba(201,168,97,0.25)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A861' }} />
            <span className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Visualizando:{' '}
              <strong className="text-white">{adminCompany.name}</strong>
            </span>
          </div>
          <button
            onClick={handleTrocarEmpresa}
            className="flex items-center gap-1 text-[10px] font-bold flex-shrink-0 ml-2"
            style={{ color: '#C9A861' }}
          >
            <ArrowLeftRight className="w-3 h-3" />
            Trocar
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed left-0 right-0 z-40 bg-black text-white flex items-center justify-between px-4 border-b border-white/10"
        style={{
          top: isAdmin && adminCompany ? '30px' : '0',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-medium tracking-widest uppercase opacity-50 leading-none mb-0.5">
            Beauty<span style={{ color: '#C9A861' }}>Pro</span>
          </p>
          <h1 className="text-[15px] font-semibold tracking-tight leading-none">
            {pageLabel(currentPageName)}
          </h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center"
          aria-label="Perfil"
        >
          <span className="text-black font-bold text-sm">{initials}</span>
        </button>
      </header>

      {/* ── Sidebar overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
            />

            <motion.aside
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#0C0C0C] z-50 shadow-2xl flex flex-col"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {/* Cabeçalho da sidebar */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-0.5">
                      {effectiveCompany?.name || 'BeautyPro'}
                    </p>
                    <h2 className="text-lg font-bold text-white leading-none">
                      Beauty<span style={{ color: '#C9A861' }}>Pro</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/8">
                    <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold text-sm">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-medium text-sm truncate">{user.name || 'Usuário'}</p>
                        {isAdmin && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                            style={{ background: 'rgba(201,168,97,0.2)', color: '#C9A861' }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mx-5 border-t border-white/8" />

              {/* Admin: trocar empresa */}
              {isAdmin && adminCompany && (
                <div className="px-3 pt-3">
                  <button
                    onClick={handleTrocarEmpresa}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                    style={{ background: 'rgba(201,168,97,0.08)', border: '1px solid rgba(201,168,97,0.2)' }}
                  >
                    <ArrowLeftRight className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A861' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: '#C9A861' }}>Trocar empresa</p>
                      <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {adminCompany.name}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Navegação */}
              <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-0.5">
                {menuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'gold-gradient text-black font-semibold'
                          : 'text-gray-400 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      <span className="text-sm">{item.name}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </Link>
                  );
                })}

                {/* Comunicação */}
                <div className="pt-2 mt-1 border-t border-white/8">
                  <Link
                    to={createPageUrl('Messages')}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      currentPageName === 'Messages'
                        ? 'gold-gradient text-black font-semibold'
                        : 'text-gray-400 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <MessageSquare size={18} className="flex-shrink-0" />
                    <span className="text-sm">Templates WhatsApp</span>
                    {currentPageName === 'Messages' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div className="px-3 pb-3 border-t border-white/8 pt-3 space-y-0.5">
                <Link
                  to={createPageUrl('Settings')}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    currentPageName === 'Settings'
                      ? 'gold-gradient text-black font-semibold'
                      : 'text-gray-400 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <Settings size={18} className="flex-shrink-0" />
                  <span className="text-sm">Configurações</span>
                  {currentPageName === 'Settings' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </Link>
                <button
                  onClick={() => { setSidebarOpen(false); logout(); }}
                  className="flex items-center gap-3 px-3 py-2.5 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Conteúdo principal ────────────────────────────────────────────────── */}
      <main
        className="min-h-screen page-enter"
        style={{
          paddingTop: isAdmin && adminCompany
            ? 'calc(3.5rem + env(safe-area-inset-top) + 30px)'
            : 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        {children}
      </main>

      {/* ── Bottom tab bar (mobile) ───────────────────────────────────────────── */}
      <BottomTabBar currentPageName={currentPageName} />
    </div>
  );
}
