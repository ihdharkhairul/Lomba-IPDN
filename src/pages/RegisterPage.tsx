import { KeyRound, Mail, Phone, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { AuthError } from '@/services/auth';
import { validateEmail, validateName, validatePassword, validatePasswordConfirm, validatePhone } from '@/utils/validation';

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirm';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    const checks: [Field, string | null][] = [
      ['name', validateName(form.name)],
      ['email', validateEmail(form.email)],
      ['phone', validatePhone(form.phone)],
      ['password', validatePassword(form.password)],
      ['confirm', validatePasswordConfirm(form.password, form.confirm)],
    ];
    checks.forEach(([k, msg]) => msg && (next[k] = msg));
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/beranda', { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.field && err.field !== 'identifier') {
        setErrors({ [err.field]: err.message });
      } else {
        setFormError(err instanceof AuthError ? err.message : 'Pendaftaran gagal. Coba lagi.');
      }
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Daftar" subtitle="Buat akun untuk mulai melapor" footer={<>Sudah punya akun? <Link to="/masuk" className="font-bold text-blue-600">Masuk</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-3.5">
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextField label="Nama Lengkap" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Nama sesuai identitas" leadingIcon={<User className="w-4 h-4" />} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="nama@email.com" leadingIcon={<Mail className="w-4 h-4" />} />
        <TextField label="Nomor HP" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" placeholder="0812 3456 7890" leadingIcon={<Phone className="w-4 h-4" />} />
        <TextField label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="Minimal 8 karakter, kombinasi huruf dan angka." leadingIcon={<KeyRound className="w-4 h-4" />} />
        <TextField label="Konfirmasi Password" type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" leadingIcon={<KeyRound className="w-4 h-4" />} />
        <Button type="submit" loading={loading}>Daftar</Button>
      </form>
    </AuthLayout>
  );
}
