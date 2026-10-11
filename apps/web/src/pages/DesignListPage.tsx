import { useTranslation } from 'react-i18next';

import { DesignChallengeList } from '@/features/design';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function DesignListPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('design.title'));
  return <DesignChallengeList />;
}
