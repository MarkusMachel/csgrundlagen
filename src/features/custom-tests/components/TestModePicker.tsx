import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TestMode } from '../types';

interface TestModePickerProps {
  onStart: (mode: TestMode) => void;
}

export function TestModePicker({ onStart }: TestModePickerProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TestMode>('practice');

  const options: { value: TestMode; icon: typeof SchoolOutlinedIcon; label: string; desc: string }[] =
    [
      {
        value: 'practice',
        icon: MenuBookOutlinedIcon,
        label: t('takeTest.practice'),
        desc: t('takeTest.practiceDesc'),
      },
      {
        value: 'exam',
        icon: SchoolOutlinedIcon,
        label: t('takeTest.exam'),
        desc: t('takeTest.examDesc'),
      },
    ];

  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" component="h2">
        {t('takeTest.chooseMode')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {options.map(({ value, icon: Icon, label, desc }) => (
          <Card
            key={value}
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: mode === value ? 'primary.main' : 'divider',
              borderWidth: mode === value ? 2 : 1,
            }}
          >
            <CardActionArea
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Icon color={mode === value ? 'primary' : 'action'} />
                <Typography variant="h6">{label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <Button variant="contained" size="large" onClick={() => onStart(mode)}>
        {t('takeTest.start')}
      </Button>
    </Stack>
  );
}
