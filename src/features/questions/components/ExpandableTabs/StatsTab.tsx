import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/shared/ui';
import { chartColors } from '@/theme/palette';

import { useQuestionStats } from '../../hooks/useQuestionExtras';

interface StatsTabProps {
  questionId: string;
  correctKey: string; // correctOptionId or 'true'/'false'
}

export function StatsTab({ questionId, correctKey }: StatsTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: stats, isPending, isError, refetch } = useQuestionStats(questionId);

  if (isPending) return <CircularProgress size={24} aria-label={t('common.loading')} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (stats.totalResponses === 0) {
    return <EmptyState title={t('question.stats.empty')} />;
  }

  const colors = chartColors[theme.palette.mode];

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {t('question.stats.total', { count: stats.totalResponses })}
      </Typography>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <BarChart
          height={220}
          xAxis={[{ scaleType: 'band', data: stats.distribution.map((d) => d.label) }]}
          series={[
            {
              data: stats.distribution.map((d) => d.percentage),
              label: t('question.stats.answers'),
              valueFormatter: (v) => `${v ?? 0}%`,
            },
          ]}
          colors={[colors.other]}
          barLabel={(item) =>
            stats.distribution[item.dataIndex]?.optionId === correctKey ? '✓' : ''
          }
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Box>
  );
}
