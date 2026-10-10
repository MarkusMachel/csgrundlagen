import { Upload } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TagInput } from '@/features/authoring';
import { useTags } from '@/features/questions';
import { InlineText } from '@/shared/ui';

import { useImportFlashcards } from './hooks';
import { ankiTagToTopic, parseAnki, type ParsedDeck } from './parseAnki';

const PREVIEW = 8;

/** file.text(), with a FileReader fallback for older browsers. */
function readText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Admin: turn an Anki text export into flashcard questions. */
export function AnkiImportTab() {
  const { t } = useTranslation();
  const fileId = useId();
  const { data: allTags } = useTags();
  const importCards = useImportFlashcards();
  const [deck, setDeck] = useState<ParsedDeck | null>(null);
  const [fileName, setFileName] = useState('');
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  const [useCardTags, setUseCardTags] = useState(true);

  const cards = useMemo(
    () =>
      (deck?.cards ?? []).map((c) => ({
        ...c,
        tags: useCardTags
          ? [...new Set(c.tags.map(ankiTagToTopic).filter((x): x is string => !!x))]
          : [],
      })),
    [deck, useCardTags],
  );
  const untagged = cards.filter((c) => c.tags.length === 0).length;

  const onFile = async (file: File | undefined) => {
    importCards.reset();
    if (!file) return;
    setFileName(file.name);
    setDeck(parseAnki(await readText(file)));
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t('anki.importIntro')}
      </p>
      <div className="field">
        <label htmlFor={fileId}>{t('anki.file')}</label>
        <input
          id={fileId}
          type="file"
          accept=".txt,.tsv,.csv,text/plain,text/tab-separated-values"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>

      {deck && (
        <>
          <p style={{ margin: 0 }} role="status">
            {t('anki.parsed', { count: deck.cards.length, file: fileName })}
            {deck.skipped > 0 && ' ' + t('anki.skippedLines', { count: deck.skipped })}
          </p>
          {cards.length > 0 && (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('authoring.front')}</th>
                      <th>{t('authoring.back')}</th>
                      <th>{t('anki.topics')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.slice(0, PREVIEW).map((c, i) => (
                      <tr key={i}>
                        <td className="anki-cell">
                          <InlineText text={c.front} />
                        </td>
                        <td className="anki-cell">
                          <InlineText text={c.back} />
                        </td>
                        <td>
                          {c.tags.join(', ') || (
                            <span className="muted">{defaultTags.join(', ') || '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cards.length > PREVIEW && (
                <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                  {t('anki.andMore', { count: cards.length - PREVIEW })}
                </p>
              )}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={useCardTags}
                  onChange={(e) => setUseCardTags(e.target.checked)}
                />
                {t('anki.useCardTags')}
              </label>
              {untagged > 0 && (
                <div className="field" style={{ maxWidth: 480 }}>
                  <label>{t('anki.defaultTags', { count: untagged })}</label>
                  <TagInput
                    value={defaultTags}
                    onChange={setDefaultTags}
                    suggestions={allTags ?? []}
                  />
                </div>
              )}
              <div>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={importCards.isPending}
                  onClick={() => importCards.mutate({ cards, defaultTags })}
                >
                  <Upload size={15} aria-hidden />
                  {t('anki.import', { count: cards.length })}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {importCards.isSuccess && (
        <div className="alert alert--success" role="status">
          {t('anki.done', { created: importCards.data.created, skipped: importCards.data.skipped })}
          {importCards.data.errors.length > 0 && (
            <ul style={{ margin: '6px 0 0' }}>
              {importCards.data.errors.slice(0, 10).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {importCards.isError && (
        <div className="alert alert--error" role="alert">
          {t('common.errorTitle')}
        </div>
      )}
    </div>
  );
}
