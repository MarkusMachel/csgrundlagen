import { ChevronDown, ClipboardList, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  useDeleteTest,
  useTestAttempts,
  useTests,
  type CustomTest,
} from '@/features/custom-tests';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

function AttemptHistory({ testId, open }: { testId: string; open: boolean }) {
  const { t, i18n } = useTranslation();
  const { data: attempts, isPending } = useTestAttempts(testId, open);

  if (!open) return null;
  if (isPending) return <Spinner />;
  if (!attempts || attempts.length === 0) {
    return (
      <p className="tok-com" style={{ margin: 0 }}>
        {'// '}
        {t('myTests.attemptsEmpty')}
      </p>
    );
  }
  return (
    <div className="table-wrap">
      <table className="data-table" data-testid="attempt-history">
        <thead>
          <tr>
            <th>{t('myTests.date')}</th>
            <th>{t('myTests.mode')}</th>
            <th style={{ textAlign: 'right' }}>{t('myTests.score')}</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td>{a.submittedAt ? new Date(a.submittedAt).toLocaleString(i18n.language) : '—'}</td>
              <td>{t(`takeTest.${a.mode}`)}</td>
              <td style={{ textAlign: 'right' }}>{a.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestCard({ test }: { test: CustomTest }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const deleteTest = useDeleteTest();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div className="hstack" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{test.name}</h2>
          <div className="chip-row" style={{ margin: '6px 0' }}>
            <span className="chip">{t('myTests.questions', { count: test.questionIds.length })}</span>
            <span className="chip">
              {test.timed
                ? t('myTests.timed', { minutes: test.durationMinutes })
                : t('myTests.untimed')}
            </span>
          </div>
          <span className="tok-com" style={{ fontSize: 12 }}>
            {'// '}
            {t('myTests.created', {
              date: new Date(test.createdAt).toLocaleDateString(i18n.language),
            })}
          </span>
        </div>
        <button
          type="button"
          className="btn btn--icon btn--danger"
          aria-label={t('myTests.deleteTest')}
          onClick={() => deleteTest.mutate(test.id)}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
      <div className="hstack" style={{ flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate(`/tests/${test.id}/take`)}
        >
          <Play size={15} aria-hidden />
          {t('myTests.take')}
        </button>
        <button
          type="button"
          className="btn"
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((o) => !o)}
        >
          {t('myTests.attempts')}
          <ChevronDown
            size={15}
            aria-hidden
            style={{
              transform: historyOpen ? 'rotate(180deg)' : 'none',
              transition: '150ms',
            }}
          />
        </button>
      </div>
      {historyOpen && <AttemptHistory testId={test.id} open={historyOpen} />}
    </div>
  );
}

export function MyTestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tests, isPending, isError, refetch } = useTests();

  return (
    <div className="stack">
      <h1>
        <span className="tok-com">{'// '}</span>
        {t('myTests.title')}
      </h1>
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : tests.length === 0 ? (
        <EmptyState
          title={t('myTests.empty')}
          description={t('myTests.emptyHint')}
          actionLabel={t('myTests.buildOne')}
          onAction={() => navigate('/build')}
          glyph={<ClipboardList size={28} />}
        />
      ) : (
        tests.map((test) => <TestCard key={test.id} test={test} />)
      )}
    </div>
  );
}
