import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const heading = (name: string | RegExp) => screen.findByRole('heading', { name });

async function registerBudi(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Nama Lengkap'), 'Budi Pratama');
  await user.type(screen.getByLabelText('Email'), 'budi@example.com');
  await user.type(screen.getByLabelText('Nomor HP'), '081234567890');
  await user.type(screen.getByLabelText('Password'), 'rahasia123');
  await user.type(screen.getByLabelText('Konfirmasi Password'), 'rahasia123');
  await user.click(screen.getByRole('button', { name: 'Daftar' }));
}

beforeEach(() => sessionStorage.setItem('laporin.splashSeen', '1'));

describe('autentikasi & route guard', () => {
  it('landing publik menampilkan headline, Masuk & Daftar', async () => {
    renderAt('/');
    expect(await heading('Laporkan Kerusakan Jalan dengan Mudah')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Masuk' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Daftar' }).length).toBeGreaterThan(0);
    // landing menyiapkan slot gambar untuk diisi sendiri
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it.each(['/beranda', '/lapor', '/lapor/foto', '/riwayat', '/profil', '/draft', '/pengaturan', '/laporan/abc'])(
    'belum login: %s dialihkan ke Masuk',
    async (path) => {
      renderAt(path);
      expect(await heading('Masuk')).toBeTruthy();
      expect(screen.queryByText(/Halo,/)).toBeNull();
    },
  );

  it('form daftar menampilkan error validasi', async () => {
    const user = userEvent.setup();
    renderAt('/daftar');
    await user.click(await screen.findByRole('button', { name: 'Daftar' }));
    expect(await screen.findByText('Nama lengkap wajib diisi.')).toBeTruthy();
    expect(screen.getByText('Email wajib diisi.')).toBeTruthy();
    expect(screen.getByText('Nomor HP wajib diisi.')).toBeTruthy();
    expect(screen.getByText('Password wajib diisi.')).toBeTruthy();

    await user.type(screen.getByLabelText('Email'), 'salah');
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.type(screen.getByLabelText('Konfirmasi Password'), 'beda1234');
    await user.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(await screen.findByText('Format email tidak valid.')).toBeTruthy();
    expect(screen.getByText('Konfirmasi password tidak cocok.')).toBeTruthy();
  });

  it('daftar -> Beranda berisi nama user; sesi bertahan; logout kembali ke Masuk', async () => {
    const user = userEvent.setup();
    renderAt('/daftar');
    await registerBudi(user);
    expect(await heading(/Halo, Budi/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buat Laporan' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeTruthy();

    // buka kembali aplikasi: tetap masuk Beranda
    cleanup();
    renderAt('/');
    expect(await heading(/Halo, Budi/)).toBeTruthy();

    // profil -> logout
    await user.click(screen.getByRole('link', { name: 'Profil' }));
    expect(await screen.findByText('budi@example.com')).toBeTruthy();
    expect(screen.getByText('081234567890')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Keluar/ }));
    expect(await heading('Masuk')).toBeTruthy();
    expect(localStorage.getItem('laporin.session')).toBeNull();

    // setelah logout, Beranda tidak bisa dibuka lagi
    cleanup();
    renderAt('/beranda');
    expect(await heading('Masuk')).toBeTruthy();
  });

  it('login: password salah menampilkan error, nomor HP + password benar masuk ke Beranda', async () => {
    const user = userEvent.setup();
    renderAt('/daftar');
    await registerBudi(user);
    await heading(/Halo, Budi/);
    await user.click(screen.getByRole('link', { name: 'Profil' }));
    await user.click(await screen.findByRole('button', { name: /Keluar/ }));
    await heading('Masuk');

    await user.type(screen.getByLabelText('Email / Nomor HP'), '0812 3456 7890');
    await user.type(screen.getByLabelText('Password'), 'salahsekali1');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Email/nomor HP atau password salah.')).toBeTruthy();

    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await heading(/Halo, Budi/)).toBeTruthy(); // bukan /profil: tujuan kembali dibuang setelah logout
  });

  it('"Buat Laporan" tanpa login diarahkan ke Masuk, lalu kembali ke alur setelah login', async () => {
    const user = userEvent.setup();
    renderAt('/daftar');
    await registerBudi(user);
    await heading(/Halo, Budi/);
    await user.click(screen.getByRole('link', { name: 'Profil' }));
    await user.click(await screen.findByRole('button', { name: /Keluar/ }));
    await heading('Masuk');
    cleanup();

    renderAt('/lapor');
    await heading('Masuk');
    expect(screen.getByText(/masuk terlebih dahulu/i)).toBeTruthy();
    await user.type(screen.getByLabelText('Email / Nomor HP'), 'budi@example.com');
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await heading('Buat Laporan Baru')).toBeTruthy();
  });

  it('langkah laporan tidak bisa dilompati lewat URL (guard alur)', async () => {
    const user = userEvent.setup();
    renderAt('/daftar');
    await registerBudi(user);
    await heading(/Halo, Budi/);
    cleanup();
    renderAt('/lapor/review');
    // belum ada foto -> dikembalikan ke langkah Foto
    expect(await screen.findByText('Ambil Foto Kerusakan')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: /Lanjutkan ke Lokasi/ }).hasAttribute('disabled')).toBe(true));
  });
});
