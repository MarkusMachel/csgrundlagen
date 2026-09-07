import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  useDeleteTest,
  useTestAttempts,
  useTests,
  type CustomTest,
} from '@/features/custom-tests';
import { EmptyState, ErrorState } from '@/shared/ui';

function AttemptHistory({ testId, open }: { testId: string; open: boolean }) {
  const { t, i18n } = useTranslation();
  const { data: attempts, isPending } = useTestAttempts(testId, open);

  if (!open) return null;
  if (isPending) return <CircularProgress size={20} aria-label={t('common.loading')} />;
  if (!attempts || attempts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('myTests.attemptsEmpty')}
      </Typography>
    );
  }
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" data-testid="attempt-history">
        <TableHead>
          <TableRow>
            <TableCell>{t('myTests.date')}</TableCell>
            <TableCell>{t('myTests.mode')}</TableCell>
            <TableCell align="right">{t('myTests.score')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attempts.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                {a.submittedAt ? new Date(a.submittedAt).toLocaleString(i18n.language) : '—'}
              </TableCell>
              <TableCell>{t(`takeTest.${a.mode}`)}</TableCell>
              <TableCell align="right">{a.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TestCard({ test }: { test: CustomTest }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const deleteTest = useDeleteTest();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              {test.name}
            </Typography>
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ my: 1 }}>
              <Chip size="small" label={t('myTests.questions', { count: test.questionIds.length })} />
              <Chip
                size="small"
                variant="outlined"
                label={
                  test.timed
                    ? t('myTests.timed', { minutes: test.durationMinutes })
                    : t('myTests.untimed')
                }
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t('myTests.created', {
                date: new Date(test.createdAt).toLocaleDateString(i18n.language),
              })}
            </Typography>
          </Box>
          <IconButton
            aria-label={t('myTests.deleteTest')}
            onClick={() => deleteTest.mutate(test.id)}
            sx={{ width: 44, height: 44 }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate(`/tests/${test.id}/take`)}
          >
            {t('myTests.take')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            endIcon={
              <ExpandMoreIcon
                sx={{ transform: historyOpen ? 'rotate(180deg)' : 'none', transition: '150ms' }}
              />
            }
            onClick={() => setHistoryOpen((o) => !o)}
          >
            {t('myTests.attempts')}
          </Button>
        </Stack>
        <Collapse in={historyOpen} mountOnEnter>
          <Box sx={{ mt: 2 }}>
            <AttemptHistory testId={test.id} open={historyOpen} />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export function MyTestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tests, isPending, isError, refetch } = useTests();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        {t('myTests.title')}
      </Typography>
      {isPending ? (
        <CircularProgress aria-label={t('common.loading')} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : tests.length === 0 ? (
        <EmptyState
          title={t('myTests.empty')}
          description={t('myTests.emptyHint')}
          actionLabel={t('myTests.buildOne')}
          onAction={() => navigate('/build')}
        />
      ) : (
        tests.map((test) => <TestCard key={test.id} test={test} />)
      )}
    </Stack>
  );
}
