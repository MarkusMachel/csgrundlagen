import { Alert, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface CommentedAnswerTabProps {
  explanation: string;
  revealed: boolean;
}

export function CommentedAnswerTab({ explanation, revealed }: CommentedAnswerTabProps) {
  const { t } = useTranslation();
  if (!revealed) {
    return <Alert severity="info">{t('question.explanationHidden')}</Alert>;
  }
  return <Typography variant="body2">{explanation}</Typography>;
}
