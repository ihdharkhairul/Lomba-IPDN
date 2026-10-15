import { Archive, ChevronRight, ClipboardList, LogOut, Mail, Phone, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth, useCurrentUser } from '@/features/auth/AuthContext';
import { useReportData } from '@/features/reports/ReportDataContext';
import { useReportFlow } from '@/features/reports/ReportFlowContext';
import { formatDate, initials } from '@/utils/format';

export function ProfilePage() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const flow = useReportFlow();
  const navigate = useNavigate();
  const { reports, drafts } = useReportData();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    await logout(); // menghapus sesi
    flow.reset(); // jangan sisakan data form milik user sebelumnya
    navigate('/masuk', { replace: true });
  }

  const MENU = [
    { to: '/riwayat', icon: ClipboardList, label: 'Riwayat Laporan', badge: `${reports.length}` },
    { to: '/draft', icon: Archive, label: 'Draft Offline', badge: `${drafts.length}` },
    { to: '/pengaturan', icon: Settings, label: 'Pengaturan', badge: '' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">{initials(user.name)}</div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{user.name}</h1>
          <p className="text-sm text-slate-500">Bergabung {formatDate(user.createdAt)}</p>
        </div>
      </section>

      <dl className="bg-white border border-slate-200 rounded-xl p-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-3 min-w-0"><Mail className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-slate-400">Email</dt><dd className="font-medium text-slate-800 truncate">{user.email}</dd></div></div>
        <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" /><div><dt className="text-xs text-slate-400">Nomor HP</dt><dd className="font-medium text-slate-800">{user.phone}</dd></div></div>
      </dl>

      <nav aria-label="Menu profil" className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {MENU.map(({ to, icon: Icon, label, badge }) => (
          <Link key={to} to={to} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
            <Icon className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
            {badge && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{badge}</span>}
            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </Link>
        ))}
      </nav>

      <Button variant="danger" loading={loggingOut} onClick={() => void onLogout()} icon={<LogOut className="w-4 h-4" aria-hidden="true" />}>Keluar (Logout)</Button>
    </div>
  );
}
