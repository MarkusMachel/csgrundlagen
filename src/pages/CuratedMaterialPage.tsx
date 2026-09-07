import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMaterials, type MaterialType } from '@/features/materials';
import { useTags } from '@/features/questions';
import { EmptyState, ErrorState } from '@/shared/ui';

const typeIcons: Record<MaterialType, typeof MenuBookOutlinedIcon> = {
  book: MenuBookOutlinedIcon,
  video: OndemandVideoOutlinedIcon,
  article: ArticleOutlinedIcon,
  link: LinkOutlinedIcon,
};

const materialTypes: MaterialType[] = ['book', 'video', 'article', 'link'];

export function CuratedMaterialPage() {
  const { t } = useTranslation();
  const [type, setType] = useState<MaterialType | ''>('');
  const [tag, setTag] = useState('');

  const { data: tags } = useTags();
  const { data: materials, isPending, isError, refetch } = useMaterials({
    type,
    tags: tag ? [tag] : [],
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        {t('materials.title')}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          select
          size="small"
          label={t('materials.filterType')}
          value={type}
          onChange={(e) => setType(e.target.value as MaterialType | '')}
          sx={{ minWidth: { sm: 180 } }}
        >
          <MenuItem value="">{t('materials.allTypes')}</MenuItem>
          {materialTypes.map((mt) => (
            <MenuItem key={mt} value={mt}>
              {t(`materials.type.${mt}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('home.filterByTag')}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
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
        <CircularProgress aria-label={t('common.loading')} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : materials.length === 0 ? (
        <EmptyState title={t('materials.empty')} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {materials.map((m) => {
            const Icon = typeIcons[m.type];
            return (
              <Card key={m.id}>
                <CardActionArea
                  component="a"
                  href={m.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Icon color="primary" />
                      <Chip size="small" label={t(`materials.type.${m.type}`)} />
                    </Stack>
                    <Typography variant="h6" component="h2">
                      {m.title}
                    </Typography>
                    {m.author && (
                      <Typography variant="body2" color="text.secondary">
                        {t('materials.by', { author: m.author })}
                      </Typography>
                    )}
                    {m.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {m.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      {m.tags.map((tg) => (
                        <Chip key={tg} size="small" variant="outlined" label={tg} />
                      ))}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
