import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useQuestion } from '@/features/questions';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { toPlainText } from '@/shared/utils/richText';

import { EditQuestionView } from './EditQuestionView';
import { StatTile } from './StatTile';
import { useQualityReport, type QualityFlag, type QualityItem } from '../hooks/useQuestionAdmin';

const FLAGS: QualityFlag[] = [
  'wrong_key',
  'open_bug_reports',
  'too_hard',
  'too_easy',
  'dead_distractor',
];

/** Admin: which questions don't work well, judged from real answers. */
export function QualityReportTab() {
  const { t } = useTranslation();
  const report = useQualityReport();
  const [flag, setFlag] = useState<QualityFlag | 'flagged'>('flagged');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (editingId) return <EditById id={editingId} onDone={() => setEditingId(null)} />;
  if (report.isPending) return <Spinner center />;
  if (report.isError) return <ErrorState onRetry={() => void report.refetch()} />;

  const { items, analysed, tooFew, minAnswers, flagCounts } = report.data;
  const flagged = items.filter((it) => it.flags.length > 0);
  const shown = flag === 'flagged' ? flagged : items.filter((it) => it.flags.includes(flag));

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t('quality.intro', { min: minAnswers })}
      </p>
      <div className="stat-tiles">
        <StatTile label={t('quality.analysed')} value={analysed} />
        <StatTile label={t('quality.flagged')} value={flagged.length} />
        <StatTile label={t('quality.tooFew', { min: minAnswers })} value={tooFew} />
      </div>
      <div className="filters__group" role="group" aria-label={t('quality.filter')}>
        <button
          type="button"
          className="toggle-chip"
          aria-pressed={flag === 'flagged'}
          onClick={() => setFlag('flagged')}
        >
          {t('quality.allFlagged')} · {flagged.length}
        </button>
        {FLAGS.map((f) => (
          <button
            key={f}
            type="button"
            className="toggle-chip"
            aria-pressed={flag === f}
            disabled={!flagCounts[f]}
            onClick={() => setFlag(f)}
          >
            {t(`quality.flag.${f}.name`)} · {flagCounts[f] ?? 0}
          </button>
        ))}
      </div>
      {flag !== 'flagged' && (
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
          {t(`quality.flag.${flag}.hint`)}
        </p>
      )}
      {shown.length === 0 ? (
        <EmptyState title={t('quality.empty')} />
      ) : (
        <ul className="admin-list">
          {shown.map((it) => (
            <QualityRow key={it.questionId} item={it} onEdit={() => setEditingId(it.questionId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function QualityRow({ item, onEdit }: { item: QualityItem; onEdit: () => void }) {
  const { t } = useTranslation();
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <li className="admin-list__row admin-list__row--top">
      <div className="admin-list__main">
        <Link
          to={`/questions/${item.questionId}`}
          className="admin-list__title"
          style={{ whiteSpace: 'normal' }}
        >
          {toPlainText(item.prompt).split('\n')[0]}
        </Link>
        <span className="admin-list__meta">
          {t(`authoring.type.${item.type}`)} · {item.tags.join(', ')} ·{' '}
          {t('quality.answers', { count: item.answers })} ·{' '}
          {t('quality.correctRate', { rate: pct(item.correctRate) })}
        </span>
        <div className="filters__group" style={{ marginTop: 4 }}>
          {item.flags.map((f) => (
            <span
              key={f}
              className={
                f === 'wrong_key' || f === 'open_bug_reports'
                  ? 'chip chip--danger'
                  : 'chip chip--warn'
              }
              title={t(`quality.flag.${f}.hint`)}
            >
              {t(`quality.flag.${f}.name`)}
            </span>
          ))}
        </div>
        {item.options && item.options.length > 0 && item.answers > 0 && (
          <ul className="pick-bars" aria-label={t('quality.picks')}>
            {item.options.map((o) => (
              <li key={o.id} className={o.correct ? 'pick-bars__row is-correct' : 'pick-bars__row'}>
                <span className="pick-bars__label" title={o.label}>
                  <span className="tok-kw">{o.id}</span> {o.label}
                </span>
                <span className="pick-bars__track" aria-hidden>
                  <span className="pick-bars__fill" style={{ width: pct(o.share) }} />
                </span>
                <span className="pick-bars__value">
                  {pct(o.share)}
                  <span className="sr-only"> {o.correct ? t('quality.correctOption') : ''}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="admin-list__actions">
        <button type="button" className="btn btn--small btn--ghost" onClick={onEdit}>
          <Pencil size={14} aria-hidden />
          {t('authoring.bugs.editQuestion')}
        </button>
      </div>
    </li>
  );
}

function EditById({ id, onDone }: { id: string; onDone: () => void }) {
  const { data, isPending, isError } = useQuestion(id);
  if (isPending) return <Spinner center />;
  if (isError || !data) return <ErrorState />;
  return <EditQuestionView question={data} onDone={onDone} />;
}
