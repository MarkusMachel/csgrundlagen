import { useParams } from 'react-router-dom';

import { QuestionCard, useQuestion } from '@/features/questions';
import { ErrorState, Spinner } from '@/shared/ui';

/** Single-question view — the navigation target for search results. */
export function QuestionPage() {
  const { id } = useParams();
  const { data: question, isPending, isError, refetch } = useQuestion(id);

  if (isPending) return <Spinner center />;
  if (isError || !question) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div style={{ maxWidth: 800 }}>
      <QuestionCard question={question} mode="feed" />
    </div>
  );
}
