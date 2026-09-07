import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import { CircularProgress, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { MaterialType } from '@/features/materials';
import { EmptyState, ErrorState } from '@/shared/ui';

import { useQuestionMaterials } from '../../hooks/useQuestionExtras';

const typeIcons: Record<MaterialType, typeof MenuBookOutlinedIcon> = {
  book: MenuBookOutlinedIcon,
  video: OndemandVideoOutlinedIcon,
  article: ArticleOutlinedIcon,
  link: LinkOutlinedIcon,
};

export function MaterialTab({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const { data: materials, isPending, isError, refetch } = useQuestionMaterials(questionId);

  if (isPending) return <CircularProgress size={24} aria-label={t('common.loading')} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (materials.length === 0) return <EmptyState title={t('question.material.empty')} />;

  return (
    <List dense>
      {materials.map((m) => {
        const Icon = typeIcons[m.type];
        return (
          <ListItemButton
            key={m.id}
            component="a"
            href={m.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText
              primary={m.title}
              secondary={m.author ? t('materials.by', { author: m.author }) : m.description}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
