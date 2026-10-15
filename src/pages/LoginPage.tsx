import { KeyRound, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { AuthError } from '@/services/auth';
import { validateIdentifier } from '@/utils/validation';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = {
      identifier: validateIdentifier(identifier) ?? undefined,
      password: password ? undefined : 'Password wajib diisi.',
    };
    setErrors(next);
    setFormError(null);
    if (next.identifier || next.password) return;

    setLoading(true);
    try {
      await login(identifier, password);
      navigate(from && from !== '/masuk' ? from : '/beranda', { replace: true });
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'Tidak dapat masuk. Coba lagi.');
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Masuk" subtitle="Masuk untuk membuat & memantau laporan" footer={<>Belum punya akun? <Link to="/daftar" className="font-bold text-blue-600">Daftar</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {from && <Notice tone="info">Silakan masuk terlebih dahulu untuk melanjutkan.</Notice>}
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextField label="Email / Nomor HP" value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={errors.identifier} autoComplete="username" inputMode="email" placeholder="nama@email.com atau 0812…" leadingIcon={<User className="w-4 h-4" />} />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="current-password" placeholder="Password Anda" leadingIcon={<KeyRound className="w-4 h-4" />} />
        <div className="text-right -mt-2"><Link to="/lupa-password" className="text-xs font-bold text-blue-600">Lupa password?</Link></div>
        <Button type="submit" loading={loading}>Masuk</Button>
      </form>
    </AuthLayout>
  );
}
