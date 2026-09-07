import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, CircularProgress, Fade, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQuestionNote, useSaveQuestionNote } from '../../hooks/useQuestionNote';

/**
 * Private per-user note (§10.6). Deliberately distinct from Comments: labeled
 * private, no author attribution, saved on blur via PUT /questions/:id/notes.
 */
export function MyNotesTab({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const { data: note, isPending } = useQuestionNote(questionId);
  const saveNote = useSaveQuestionNote(questionId);
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (note) setDraft(note.body);
  }, [note]);

  if (isPending) return <CircularProgress size={24} aria-label={t('common.loading')} />;

  const handleBlur = () => {
    if (draft !== (note?.body ?? '')) {
      saveNote.mutate(draft, {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2000);
        },
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <LockOutlinedIcon fontSize="inherit" color="action" />
        <Typography variant="caption" color="text.secondary">
          {t('question.notes.privacy')}
        </Typography>
        <Fade in={savedFlash}>
          <Typography variant="caption" color="success.main" sx={{ ml: 'auto' }} role="status">
            {t('question.notes.saved')}
          </Typography>
        </Fade>
      </Box>
      <TextField
        fullWidth
        multiline
        minRows={3}
        label={t('question.notes.label')}
        placeholder={t('question.notes.placeholder')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
      />
    </Box>
  );
}
