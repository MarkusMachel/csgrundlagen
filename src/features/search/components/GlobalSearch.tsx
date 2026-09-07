import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Paper,
  Popper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useDebounce } from '@/shared/hooks/useDebounce';

import { useSearch } from '../hooks/useSearch';
import type { SearchResultItem } from '../types';

type GroupKey = 'questions' | 'materials' | 'tests';

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(query, 250);
  const { data: results } = useSearch(debounced);

  const close = () => {
    setOpen(false);
    setMobileExpanded(false);
  };

  const goTo = (group: GroupKey, item: SearchResultItem) => {
    close();
    setQuery('');
    if (group === 'questions') navigate(`/questions/${item.id}`);
    else if (group === 'materials') navigate('/materials');
    else navigate('/my-tests');
  };

  const groups: GroupKey[] = ['questions', 'materials', 'tests'];
  const hasResults = results && groups.some((g) => results[g].length > 0);

  const field = (
    <TextField
      fullWidth
      size="small"
      value={query}
      autoFocus={isMobile && mobileExpanded}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      placeholder={t('search.placeholder')}
      inputProps={{ 'aria-label': t('search.placeholder'), role: 'searchbox' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );

  // On small screens the search collapses to an icon that expands into a
  // full-width field (§12) instead of an unusably narrow centered box.
  if (isMobile && !mobileExpanded) {
    return (
      <IconButton
        aria-label={t('search.open')}
        onClick={() => setMobileExpanded(true)}
        sx={{ ml: 'auto', width: 44, height: 44 }}
      >
        <SearchIcon />
      </IconButton>
    );
  }

  return (
    <ClickAwayListener onClickAway={close}>
      <Box
        ref={anchorRef}
        sx={{
          flex: 1,
          maxWidth: { xs: '100%', sm: 480 },
          mx: { xs: 0, sm: 'auto' },
        }}
      >
        {field}
        <Popper
          open={open && debounced.trim().length >= 2}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          sx={{ zIndex: (th) => th.zIndex.modal + 1, width: anchorRef.current?.clientWidth }}
        >
          <Paper elevation={4} sx={{ mt: 0.5, maxHeight: 420, overflowY: 'auto' }}>
            {hasResults ? (
              <List dense disablePadding data-testid="search-results">
                {groups.map((group) =>
                  results[group].length === 0 ? null : (
                    <Box key={group}>
                      <ListSubheader disableSticky>{t(`search.groups.${group}`)}</ListSubheader>
                      {results[group].map((item) => (
                        <ListItemButton key={item.id} onClick={() => goTo(group, item)}>
                          <ListItemText primary={item.title} secondary={item.subtitle} />
                        </ListItemButton>
                      ))}
                    </Box>
                  ),
                )}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                {t('search.noResults', { query: debounced })}
              </Typography>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
