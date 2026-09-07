import { zodResolver } from '@hookform/resolvers/zod';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Question } from '@/features/questions';

import { useTestBuilderStore } from '../hooks/useTestBuilder';
import { useCreateTest } from '../hooks/useTests';
import type { CustomTest } from '../types';

const builderSchema = z
  .object({
    name: z.string().trim().min(1),
    timed: z.boolean(),
    durationMinutes: z.coerce.number().int().min(1).optional(),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
  })
  .refine((v) => !v.timed || (v.durationMinutes !== undefined && v.durationMinutes >= 1), {
    path: ['durationMinutes'],
  });

type BuilderForm = z.infer<typeof builderSchema>;

interface TestBuilderTrayProps {
  /** Question objects for the current selection (page resolves ids → data). */
  selectedQuestions: Question[];
  onSaved: (test: CustomTest) => void;
}

export function TestBuilderTray({ selectedQuestions, onSaved }: TestBuilderTrayProps) {
  const { t } = useTranslation();
  const { selectedQuestionIds, removeQuestion, clear } = useTestBuilderStore();
  const createTest = useCreateTest();

  const form = useForm<BuilderForm>({
    resolver: zodResolver(builderSchema),
    defaultValues: {
      name: '',
      timed: false,
      durationMinutes: 15,
      shuffleQuestions: false,
      shuffleOptions: false,
    },
  });
  const timed = form.watch('timed');

  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedQuestionIds.length === 0) return;
    const test = await createTest.mutateAsync({
      name: values.name,
      questionIds: selectedQuestionIds,
      timed: values.timed,
      durationMinutes: values.timed ? values.durationMinutes : undefined,
      shuffleQuestions: values.shuffleQuestions,
      shuffleOptions: values.shuffleOptions,
    });
    clear();
    form.reset();
    onSaved(test);
  });

  const promptOf = (id: string) =>
    selectedQuestions.find((q) => q.id === id)?.prompt ?? id;

  return (
    <Paper
      component="form"
      onSubmit={onSubmit}
      variant="outlined"
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
      data-testid="test-builder-tray"
    >
      <Typography variant="h6" component="h2">
        {t('builder.selected')} ({selectedQuestionIds.length})
      </Typography>

      {selectedQuestionIds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('builder.emptyTray')}
        </Typography>
      ) : (
        <List dense sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {selectedQuestionIds.map((id) => (
            <ListItem
              key={id}
              disableGutters
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={t('builder.remove')}
                  onClick={() => removeQuestion(id)}
                  sx={{ width: 44, height: 44 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={promptOf(id)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider />

      <TextField
        label={t('builder.testName')}
        size="small"
        error={!!form.formState.errors.name}
        helperText={form.formState.errors.name ? t('builder.nameRequired') : undefined}
        {...form.register('name')}
      />

      <Controller
        control={form.control}
        name="timed"
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={field.onChange} />}
            label={t('builder.timed')}
          />
        )}
      />
      {timed && (
        <TextField
          label={t('builder.durationMinutes')}
          type="number"
          size="small"
          inputProps={{ min: 1 }}
          error={!!form.formState.errors.durationMinutes}
          helperText={
            form.formState.errors.durationMinutes ? t('builder.durationInvalid') : undefined
          }
          {...form.register('durationMinutes')}
        />
      )}

      <Controller
        control={form.control}
        name="shuffleQuestions"
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={field.onChange} />}
            label={t('builder.shuffleQuestions')}
          />
        )}
      />
      <Controller
        control={form.control}
        name="shuffleOptions"
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={field.onChange} />}
            label={t('builder.shuffleOptions')}
          />
        )}
      />

      {selectedQuestionIds.length === 0 && form.formState.isSubmitted && (
        <Alert severity="warning">{t('builder.needQuestions')}</Alert>
      )}

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={createTest.isPending || selectedQuestionIds.length === 0}
        >
          {t('builder.saveTest')}
        </Button>
      </Box>
    </Paper>
  );
}
