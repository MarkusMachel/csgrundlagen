import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/shared/hooks/useDebounce';
import { EmptyState, ErrorState } from '@/shared/ui';

import { QuestionCard } from './QuestionCard';
import { useQuestions, useTags } from '../hooks/useQuestions';


const PAGE_SIZE = 10; // §15 open decision: 10 per page

interface QuestionFeedProps {
  mode: 'feed' | 'pick';
  selectedIds?: string[];
  onToggleSelect?: (questionId: string) => void;
}

/**
 * Filterable, paginated question list shared by Home (feed mode) and the
 * Build-a-Test picker (pick mode). Rendering is a plain map over one page
 * (10 items) — swap for a virtualized list if page sizes ever grow (§12).
 */
export function QuestionFeed({ mode, selectedIds = [], onToggleSelect }: QuestionFeedProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: tags } = useTags();
  const { data, isPending, isError, refetch } = useQuestions({
    page,
    pageSize: PAGE_SIZE,
    tags: tag ? [tag] : [],
    search: debouncedSearch,
  });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('home.searchPlaceholder')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          label={t('home.filterByTag')}
          sx={{ minWidth: { sm: 200 } }}
        >
          <MenuItem value="">{t('home.allTags')}</MenuItem>
          {(tags ?? []).map((tg) => (
            <MenuItem key={tg} value={tg}>
              {tg}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isPending ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress aria-label={t('common.loading')} />
        </Box>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('home.noResults')} description={t('home.noResultsHint')} />
      ) : (
        <>
          <Stack spacing={2} data-testid="question-feed">
            {data.items.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                mode={mode}
                selected={selectedIds.includes(question.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </Stack>
          {data.totalPages > 1 && (
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={(_e, p) => setPage(p)}
              sx={{ alignSelf: 'center' }}
            />
          )}
        </>
      )}
    </Stack>
  );
}
