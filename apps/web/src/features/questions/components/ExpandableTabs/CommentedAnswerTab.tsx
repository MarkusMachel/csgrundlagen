import { useTranslation } from 'react-i18next';

import { RichText } from '@/shared/ui';

interface CommentedAnswerTabProps {
  explanation: string;
  revealed: boolean;
}

export function CommentedAnswerTab({ explanation, revealed }: CommentedAnswerTabProps) {
  const { t } = useTranslation();
  if (!revealed) {
    return <div className="alert alert--info">{t('question.explanationHidden')}</div>;
  }
  // Prose keeps its line breaks; ```lang fences render as highlighted code.
  return <RichText text={explanation} />;
}
