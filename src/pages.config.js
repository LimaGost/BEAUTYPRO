import Agenda from './pages/Agenda';
import Clients from './pages/Clients';
import Expenses from './pages/Expenses';
import Financial from './pages/Financial';
import Messages from './pages/Messages';
import Products from './pages/Products';
import Professionals from './pages/Professionals';
import Reports from './pages/Reports';
import Services from './pages/Services';
import ProfessionalDetail from './pages/ProfessionalDetail';
import Settings from './pages/Settings';
import Company from './pages/Company';
import BusinessHours from './pages/BusinessHours';
import BookingLink from './pages/BookingLink';
import __Layout from './Layout.jsx';

export const PAGES = {
  // ── Operacional ──────────────────────────────────────────────────────────
  'Agenda':               Agenda,
  'Clients':              Clients,
  'Services':             Services,
  'Professionals':        Professionals,
  'Products':             Products,
  // ── Empresa (rotas internas, dentro do layout) ────────────────────────
  'empresa':              Company,
  'horario-funcionamento': BusinessHours,
  'link-agendamento':     BookingLink,
  // ── Financeiro ────────────────────────────────────────────────────────
  'Expenses':             Expenses,
  'Financial':            Financial,
  'Reports':              Reports,
  // ── Extras ────────────────────────────────────────────────────────────
  'Messages':             Messages,
  'ProfessionalDetail':   ProfessionalDetail,
  'Settings':             Settings,
};

export const pagesConfig = {
  mainPage: 'Agenda',
  Pages:    PAGES,
  Layout:   __Layout,
};
