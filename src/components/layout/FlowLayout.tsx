import { Outlet } from 'react-router-dom';

/** Bingkai langkah pelaporan: penuh di HP, kartu di tengah pada layar lebar. */
export function FlowLayout() {
  return (
    <div className="-mx-4 -my-5 sm:mx-auto sm:my-0 sm:max-w-xl bg-white sm:border sm:border-slate-200 sm:rounded-xl overflow-hidden min-h-[calc(100dvh-4rem)] sm:min-h-0 flex flex-col">
      <Outlet />
    </div>
  );
}
