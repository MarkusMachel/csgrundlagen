import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { AdminStatsTab, MaterialForm, QuestionForm, useIsAdmin } from '@/features/authoring';

type Tab = 'stats' | 'question' | 'material';

export function AdminPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const idBase = useId();
  const [tab, setTab] = useState<Tab>('stats');

  // Client-side gate; the mock API also rejects non-admins (403).
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs: Tab[] = ['stats', 'question', 'material'];

  return (
    <div className="stack">
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
          {tab === 'question' && <QuestionForm />}
          {tab === 'material' && <MaterialForm />}
        </div>
      </div>
    </div>
  );
}
