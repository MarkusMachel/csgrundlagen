import { useTranslation } from 'react-i18next';

interface CommentedAnswerTabProps {
  explanation: string;
  revealed: boolean;
}

export function CommentedAnswerTab({ explanation, revealed }: CommentedAnswerTabProps) {
  const { t } = useTranslation();
  if (!revealed) {
    return <div className="alert alert--info">{t('question.explanationHidden')}</div>;
  }
  // pre-wrap keeps paragraph breaks and code indentation from seeded explanations.
  return <p style={{ margin: 0, whiteSpace: 'pre-wrap', tabSize: 2 }}>{explanation}</p>;
}
