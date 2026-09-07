import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useReportBug } from '../../hooks/useQuestionExtras';

const bugSchema = z.object({ message: z.string().trim().min(1) });
type BugForm = z.infer<typeof bugSchema>;

export function BugReportTab({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const reportBug = useReportBug(questionId);
  const form = useForm<BugForm>({ resolver: zodResolver(bugSchema), defaultValues: { message: '' } });

  const onSubmit = form.handleSubmit(async ({ message }) => {
    await reportBug.mutateAsync(message);
    form.reset();
  });

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {reportBug.isSuccess && <Alert severity="success">{t('question.bug.success')}</Alert>}
      <TextField
        multiline
        minRows={2}
        placeholder={t('question.bug.placeholder')}
        error={!!form.formState.errors.message}
        helperText={form.formState.errors.message ? t('question.bug.required') : undefined}
        {...form.register('message')}
      />
      <Button
        type="submit"
        variant="outlined"
        disabled={reportBug.isPending}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('question.bug.submit')}
      </Button>
    </Box>
  );
}
