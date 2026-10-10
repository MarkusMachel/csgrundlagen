import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isSignInCancelled } from '@/stores/useAuthPrompt';

import { useAnkiExport, type AnkiSource } from './hooks';

/** "Export to Anki" for bookmarks, a test, or the current filter. */
export function AnkiExportButton({
  source,
  className = 'btn btn--small',
}: {
  source: AnkiSource;
  className?: string;
}) {
  const { t } = useTranslation();
  const exportAnki = useAnkiExport();
  return (
    <button
      type="button"
      className={className}
      disabled={exportAnki.isPending}
      title={t('anki.exportHint')}
      onClick={() => exportAnki.mutate(source)}
    >
      <Download size={14} aria-hidden />
      {exportAnki.isError && !isSignInCancelled(exportAnki.error)
        ? t('anki.exportFailed')
        : t('anki.export')}
    </button>
  );
}
