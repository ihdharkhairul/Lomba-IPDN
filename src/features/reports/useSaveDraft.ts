import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useReportFlow } from './ReportFlowContext';

/** Menyimpan form laporan saat ini sebagai draft offline, lalu membuka halaman Draft. */
export function useSaveDraft() {
  const flow = useReportFlow();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await flow.saveAsDraft();
      showToast('Laporan disimpan ke Draft Offline.', 'success');
      navigate('/draft');
      flow.reset();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menyimpan draft.', 'error');
    } finally {
      setSaving(false);
    }
  }
  return { save, saving };
}
