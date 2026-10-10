import { ArrowLeft, Check, History, Pencil, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Question } from '@/features/questions';
import { ErrorState, RichText, Spinner } from '@/shared/ui';
import { formatRelative } from '@/shared/utils/relativeTime';

import { QuestionForm } from './QuestionForm';
import {
  changedFields,
  useRestoreRevision,
  useRevisions,
  type Revision,
} from '../hooks/useQuestionAdmin';

/** Editing one question: the form, plus its version history with restore. */
export function EditQuestionView({ question, onDone }: { question: Question; onDone: () => void }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'edit' | 'history'>('edit');
  // after a restore the form shows the restored content
  const [current, setCurrent] = useState(question);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn btn--small btn--ghost" onClick={onDone}>
          <ArrowLeft size={14} aria-hidden />
          {t('authoring.history.back')}
        </button>
        <div className="filters__group" role="group" aria-label={t('authoring.history.view')}>
          <button
            type="button"
            className="toggle-chip"
            aria-pressed={view === 'edit'}
            onClick={() => setView('edit')}
          >
            <Pencil size={13} aria-hidden /> {t('authoring.history.edit')}
          </button>
          <button
            type="button"
            className="toggle-chip"
            aria-pressed={view === 'history'}
            onClick={() => setView('history')}
          >
            <History size={13} aria-hidden /> {t('authoring.history.title')}
          </button>
        </div>
      </div>
      <h2 style={{ margin: 0 }}>{t('authoring.editQuestion')}</h2>
      {view === 'edit' ? (
        <QuestionForm
          key={`${current.id}-${formKey}`}
          question={current}
          onSaved={onDone}
          onCancel={onDone}
        />
      ) : (
        <RevisionHistory
          questionId={question.id}
          onRestored={(restored) => {
            setCurrent(restored);
            setFormKey((k) => k + 1);
            setView('edit');
          }}
        />
      )}
    </div>
  );
}

function RevisionHistory({
  questionId,
  onRestored,
}: {
  questionId: string;
  onRestored: (q: Question) => void;
}) {
  const { t, i18n } = useTranslation();
  const revisions = useRevisions(questionId);
  const restore = useRestoreRevision(questionId);
  const [open, setOpen] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  if (revisions.isPending) return <Spinner center />;
  if (revisions.isError) return <ErrorState onRetry={() => void revisions.refetch()} />;
  if (revisions.data.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        {t('authoring.history.empty')}
      </p>
    );
  }

  return (
    <ol className="admin-list revision-list" aria-label={t('authoring.history.title')}>
      {revisions.data.map((rev, i) => {
        const older = revisions.data[i + 1];
        const changes = older ? changedFields(older.snapshot, rev.snapshot) : [];
        const isCurrent = i === 0;
        return (
          <li key={rev.id} className="admin-list__row admin-list__row--top">
            <div className="admin-list__main">
              <span className="admin-list__title" style={{ whiteSpace: 'normal' }}>
                <span className="tok-com">v{revisions.data.length - i}</span>{' '}
                {t(`authoring.history.kind.${rev.kind}`, {
                  version:
                    revisions.data.length -
                    revisions.data.findIndex((r) => r.id === rev.restoredFrom),
                })}
                {isCurrent && (
                  <span className="chip chip--accent">{t('authoring.history.current')}</span>
                )}
              </span>
              <span className="admin-list__meta">
                {rev.editorName ?? t('authoring.history.unknownEditor')} ·{' '}
                <time
                  dateTime={rev.createdAt}
                  title={new Date(rev.createdAt).toLocaleString(i18n.language)}
                >
                  {formatRelative(rev.createdAt, i18n.language)}
                </time>
                {changes.length > 0 && (
                  <>
                    {' · '}
                    {t('authoring.history.changed', {
                      fields: changes.map((f) => t(`authoring.history.field.${f}`)).join(', '),
                    })}
                  </>
                )}
              </span>
              <button
                type="button"
                className="linklike revision-list__toggle"
                aria-expanded={open === rev.id}
                onClick={() => setOpen(open === rev.id ? null : rev.id)}
              >
                {open === rev.id
                  ? t('authoring.history.hideVersion')
                  : t('authoring.history.showVersion')}
              </button>
              {open === rev.id && <SnapshotPreview revision={rev} />}
            </div>
            {!isCurrent && (
              <div className="admin-list__actions">
                {confirming === rev.id ? (
                  <span className="hstack" style={{ gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn--small btn--primary"
                      disabled={restore.isPending}
                      onClick={() =>
                        restore.mutate(rev.id, {
                          onSuccess: (q) => {
                            setConfirming(null);
                            onRestored(q);
                          },
                        })
                      }
                    >
                      {t('authoring.history.confirmRestore')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => setConfirming(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => setConfirming(rev.id)}
                  >
                    <RotateCcw size={14} aria-hidden />
                    {t('authoring.history.restore')}
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SnapshotPreview({ revision }: { revision: Revision }) {
  const { t } = useTranslation();
  const s = revision.snapshot;
  const correct = new Set([s.correctOptionId, ...(s.correctOptionIds ?? [])].filter(Boolean));
  return (
    <div className="revision-preview">
      <RichText text={s.prompt} />
      {s.options && s.options.length > 0 && (
        <ul className="revision-preview__options">
          {s.options.map((o, i) => (
            <li key={o.id} className={correct.has(o.id) ? 'is-correct' : undefined}>
              <span className="tok-kw">{s.type === 'ordering' ? `${i + 1}.` : `${o.id}`}</span>{' '}
              {o.label}
              {correct.has(o.id) && (
                <Check size={13} aria-label={t('authoring.history.correctOption')} />
              )}
            </li>
          ))}
        </ul>
      )}
      {s.type === 'true-false' && (
        <p style={{ margin: '6px 0 0' }}>
          {t('authoring.history.answerIs')} <code>{String(s.correctAnswer)}</code>
        </p>
      )}
      {s.expectedOutput !== undefined && s.expectedOutput !== null && (
        <p style={{ margin: '6px 0 0' }}>
          {t('authoring.history.answerIs')} <code>{s.expectedOutput}</code>
        </p>
      )}
      <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
        {s.tags.join(', ')}
        {s.difficulty && ` · ${s.difficulty}`}
      </p>
    </div>
  );
}
