import { useTranslation } from 'react-i18next';

import { ErrorState, Spinner } from '@/shared/ui';


import { CategoricalBarChart } from './CategoricalBarChart';
import { CorrectnessBar } from './CorrectnessBar';
import { MagnitudeBarChart } from './MagnitudeBarChart';
import { StatTile } from './StatTile';
import { useAdminStats } from '../hooks/useAuthoring';

export function AdminStatsTab() {
  const { t } = useTranslation();
  const { data: stats, isPending, isError, refetch } = useAdminStats();

  if (isPending) return <Spinner center />;
  if (isError || !stats) return <ErrorState onRetry={() => void refetch()} />;

  const tileEntries: { key: keyof typeof stats.totals; label: string }[] = [
    { key: 'questions', label: t('authoring.stats.totalQuestions') },
    { key: 'materials', label: t('authoring.stats.totalMaterials') },
    { key: 'users', label: t('authoring.stats.totalUsers') },
    { key: 'answersSubmitted', label: t('authoring.stats.totalAnswers') },
    { key: 'tests', label: t('authoring.stats.totalTests') },
    { key: 'testAttempts', label: t('authoring.stats.totalAttempts') },
    { key: 'bookmarks', label: t('authoring.stats.totalBookmarks') },
    { key: 'bugReports', label: t('authoring.stats.totalBugReports') },
  ];

  return (
    <div className="stack" style={{ gap: 20 }} data-testid="admin-stats-tab">
      <div className="stat-tiles">
        {tileEntries.map(({ key, label }) => (
          <StatTile key={key} label={label} value={stats.totals[key]} />
        ))}
      </div>

      <div className="stats-grid">
        <CategoricalBarChart
          title={t('authoring.stats.questionsByType')}
          emptyText={t('authoring.stats.noQuestionsYet')}
          data={stats.questionsByType.map((d) => ({
            label: t(`authoring.type.${d.type}`),
            count: d.count,
          }))}
        />
        <CategoricalBarChart
          title={t('authoring.stats.questionsByDifficulty')}
          emptyText={t('authoring.stats.noQuestionsYet')}
          data={stats.questionsByDifficulty.map((d) => ({
            label:
              d.difficulty === 'unspecified'
                ? t('authoring.stats.unspecified')
                : t(`question.difficulty.${d.difficulty}`),
            count: d.count,
          }))}
        />
        <CategoricalBarChart
          title={t('authoring.stats.materialsByType')}
          emptyText={t('authoring.stats.noMaterialsYet')}
          data={stats.materialsByType.map((d) => ({
            label: t(`materials.type.${d.type}`),
            count: d.count,
          }))}
        />
        <CorrectnessBar
          correct={stats.correctness.correct}
          incorrect={stats.correctness.incorrect}
        />
      </div>

      <MagnitudeBarChart
        title={t('authoring.stats.answersByTag')}
        emptyText={t('authoring.stats.noAnswersYet')}
        data={stats.answersByTag.map((d) => ({ label: d.tag, count: d.count }))}
      />
    </div>
  );
}
