import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useLogout } from '@/features/auth';
import { GlobalSearch } from '@/features/search';
import { SUPPORTED_LOCALES } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

export function TopBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const themeMode = useUIStore((s) => s.themeMode);
  const toggleThemeMode = useUIStore((s) => s.toggleThemeMode);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const setMobileDrawerOpen = useUIStore((s) => s.setMobileDrawerOpen);

  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [localeMenuAnchor, setLocaleMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <AppBar position="fixed" sx={{ zIndex: (th) => th.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1 }}>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            aria-label={t('nav.openMenu')}
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ width: 44, height: 44 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            textDecoration: 'none',
            mr: { sm: 2 },
          }}
        >
          <SchoolIcon />
          {!isMobile && (
            <Typography variant="h6" component="span" noWrap>
              {t('common.appName')}
            </Typography>
          )}
        </Box>

        <GlobalSearch />

        <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0, sm: 1 } }}>
          <IconButton
            color="inherit"
            aria-label={t('nav.toggleTheme')}
            onClick={toggleThemeMode}
            data-testid="theme-toggle"
            sx={{ width: 44, height: 44 }}
          >
            {themeMode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>

          <IconButton
            color="inherit"
            aria-label={t('common.language')}
            onClick={(e) => setLocaleMenuAnchor(e.currentTarget)}
            data-testid="locale-switcher"
            sx={{ width: 44, height: 44 }}
          >
            <Typography variant="button">{locale === 'pt-BR' ? 'PT' : locale.toUpperCase()}</Typography>
          </IconButton>
          <Menu
            anchorEl={localeMenuAnchor}
            open={!!localeMenuAnchor}
            onClose={() => setLocaleMenuAnchor(null)}
          >
            {SUPPORTED_LOCALES.map(({ code, label }) => (
              <MenuItem
                key={code}
                selected={code === locale}
                onClick={() => {
                  setLocale(code);
                  setLocaleMenuAnchor(null);
                }}
              >
                {label}
              </MenuItem>
            ))}
          </Menu>

          {user && (
            <>
              <IconButton
                aria-label={t('nav.userMenu')}
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ width: 44, height: 44 }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>{user.name.charAt(0)}</Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={!!userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
              >
                <MenuItem disabled>
                  <ListItemText primary={user.name} secondary={user.email} />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setUserMenuAnchor(null);
                    logout.mutate(undefined, { onSettled: () => navigate('/login') });
                  }}
                >
                  {t('nav.logout')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
