import { KeyRound, Mail, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useToast } from '@/components/ui/Toast';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { AuthError } from '@/services/auth';
import { validateEmail, validatePassword, validatePasswordConfirm, validatePhone } from '@/utils/validation';

type Field = 'email' | 'phone' | 'password' | 'confirm';

/** Reset password versi prototype: verifikasi email + nomor HP terdaftar (belum ada email/OTP). */
export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    const checks: [Field, string | null][] = [
      ['email', validateEmail(form.email)],
      ['phone', validatePhone(form.phone)],
      ['password', validatePassword(form.password)],
      ['confirm', validatePasswordConfirm(form.password, form.confirm)],
    ];
    checks.forEach(([k, m]) => m && (next[k] = m));
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await resetPassword({ email: form.email, phone: form.phone, newPassword: form.password });
      showToast('Password berhasil diubah. Silakan masuk.', 'success');
      navigate('/masuk', { replace: true });
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'Gagal mengubah password.');
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Lupa Password" subtitle="Atur ulang password akun Anda" footer={<Link to="/masuk" className="font-bold text-blue-600">Kembali ke Masuk</Link>}>
      <form onSubmit={onSubmit} noValidate className="space-y-3.5">
        <Notice tone="info">Versi prototype: identitas diverifikasi dengan mencocokkan email dan nomor HP yang terdaftar. Pada versi produksi pengaturan ulang dilakukan lewat tautan/OTP.</Notice>
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextField label="Email Terdaftar" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" leadingIcon={<Mail className="w-4 h-4" />} />
        <TextField label="Nomor HP Terdaftar" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" leadingIcon={<Phone className="w-4 h-4" />} />
        <TextField label="Password Baru" type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="Minimal 8 karakter, kombinasi huruf dan angka." leadingIcon={<KeyRound className="w-4 h-4" />} />
        <TextField label="Konfirmasi Password Baru" type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" leadingIcon={<KeyRound className="w-4 h-4" />} />
        <Button type="submit" loading={loading}>Simpan Password Baru</Button>
      </form>
    </AuthLayout>
  );
}
