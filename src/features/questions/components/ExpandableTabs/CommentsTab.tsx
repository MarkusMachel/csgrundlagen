import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, Box, Button, CircularProgress, List, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState, ErrorState } from '@/shared/ui';

import { useAddComment, useQuestionComments } from '../../hooks/useQuestionExtras';

const commentSchema = z.object({ body: z.string().trim().min(1) });
type CommentForm = z.infer<typeof commentSchema>;

export function CommentsTab({ questionId }: { questionId: string }) {
  const { t, i18n } = useTranslation();
  const { data: comments, isPending, isError, refetch } = useQuestionComments(questionId);
  const addComment = useAddComment(questionId);
  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: '' },
  });

  const onSubmit = form.handleSubmit(async ({ body }) => {
    await addComment.mutateAsync(body);
    form.reset();
  });

  if (isPending) return <CircularProgress size={24} aria-label={t('common.loading')} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <Box>
      {comments.length === 0 ? (
        <EmptyState title={t('question.comments.empty')} />
      ) : (
        <List dense>
          {comments.map((c) => (
            <ListItem key={c.id} alignItems="flex-start" disableGutters>
              <ListItemAvatar>
                <Avatar>{c.userName.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <>
                    <Typography component="span" fontWeight={600} variant="body2">
                      {c.userName}
                    </Typography>{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleDateString(i18n.language)}
                    </Typography>
                  </>
                }
                secondary={c.body}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('question.comments.placeholder')}
          error={!!form.formState.errors.body}
          {...form.register('body')}
        />
        <Button type="submit" variant="contained" disabled={addComment.isPending}>
          {t('question.comments.post')}
        </Button>
      </Box>
    </Box>
  );
}
