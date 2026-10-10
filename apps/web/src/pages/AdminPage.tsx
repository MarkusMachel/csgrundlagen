import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { AnkiImportTab } from '@/features/anki';
import {
  AdminStatsTab,
  BugReportQueue,
  CommentModeration,
  QualityReportTab,
  MaterialForm,
  MaterialManager,
  QuestionForm,
  QuestionManager,
  useBugReports,
  useIsAdmin,
  useModerationQueue,
} from '@/features/authoring';
import { AdminUsersTab } from '@/features/devices';

type Tab =
  | 'stats'
  | 'quality'
  | 'question'
  | 'material'
  | 'questions'
  | 'materials'
  | 'bugs'
  | 'comments'
  | 'users'
  | 'import';

export function AdminPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const idBase = useId();
  const [tab, setTab] = useState<Tab>('stats');
  const openBugs = useBugReports('open');
  const reported = useModerationQueue('reported');
  const openReports = reported.data?.openReports ?? 0;

  // Client-side gate; the mock API also rejects non-admins (403).
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs: Tab[] = [
    'stats',
    'quality',
    'question',
    'material',
    'questions',
    'materials',
    'bugs',
    'comments',
    'users',
    'import',
  ];

  return (
    <div className="stack admin-page">
      <div>
        <h1 style={{ marginBottom: 4 }}>
          <span className="tok-com">{'// '}</span>
          {t('authoring.title')}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {t('authoring.subtitle')}
        </p>
      </div>

      <div className="panel" style={{ borderRadius: 10, border: '1px solid var(--border)' }}>
        <div className="panel-tabs" role="tablist">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`${idBase}-tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`${idBase}-panel-${key}`}
              className="panel-tab"
              onClick={() => setTab(key)}
            >
              {t(`authoring.tab.${key}`)}
              {key === 'bugs' && (openBugs.data?.length ?? 0) > 0 && (
                <span
                  className="tab-badge"
                  aria-label={t('authoring.bugs.openCount', { count: openBugs.data!.length })}
                >
                  {openBugs.data!.length}
                </span>
              )}
              {key === 'comments' && openReports > 0 && (
                <span
                  className="tab-badge"
                  aria-label={t('moderation.openCount', { count: openReports })}
                >
                  {openReports}
                </span>
              )}
            </button>
          ))}
        </div>
        <div
          className="panel-body"
          role="tabpanel"
          id={`${idBase}-panel-${tab}`}
          aria-labelledby={`${idBase}-tab-${tab}`}
        >
          {tab === 'stats' && <AdminStatsTab />}
          {tab === 'quality' && <QualityReportTab />}
          {tab === 'question' && <QuestionForm />}
          {tab === 'material' && <MaterialForm />}
          {tab === 'questions' && <QuestionManager />}
          {tab === 'materials' && <MaterialManager />}
          {tab === 'bugs' && <BugReportQueue />}
          {tab === 'comments' && <CommentModeration />}
          {tab === 'users' && <AdminUsersTab />}
          {tab === 'import' && <AnkiImportTab />}
        </div>
      </div>
    </div>
  );
}
