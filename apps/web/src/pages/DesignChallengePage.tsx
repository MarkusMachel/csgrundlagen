import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';

import { DesignChallenge } from '@/features/design';
import { useQuestion } from '@/features/questions';
import { ErrorState, Spinner } from '@/shared/ui';

export function DesignChallengePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useQuestion(id);
  if (isPending) return <Spinner center />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;
  // other questions open on their own page
  if (data.type !== 'design') return <Navigate to={`/questions/${data.id}`} replace />;
  return (
    <div aria-label={t('design.title')}>
      <DesignChallenge key={data.id} question={data} />
    </div>
  );
}
