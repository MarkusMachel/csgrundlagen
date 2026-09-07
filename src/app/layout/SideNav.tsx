import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { useUIStore } from '@/stores/useUIStore';

export const SIDENAV_WIDTH = 240;
export const SIDENAV_COLLAPSED_WIDTH = 64;

const navItems = [
  { to: '/', key: 'nav.home', icon: HomeOutlinedIcon, end: true },
  { to: '/weak-spots', key: 'nav.weakSpots', icon: TrendingDownIcon },
  { to: '/bookmarks', key: 'nav.bookmarks', icon: BookmarkBorderIcon },
  { to: '/build', key: 'nav.buildTest', icon: PlaylistAddCheckIcon },
  { to: '/my-tests', key: 'nav.myTests', icon: QuizOutlinedIcon },
  { to: '/materials', key: 'nav.materials', icon: LibraryBooksOutlinedIcon },
];

export function SideNav() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileDrawerOpen = useUIStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useUIStore((s) => s.setMobileDrawerOpen);

  const width = collapsed && !isMobile ? SIDENAV_COLLAPSED_WIDTH : SIDENAV_WIDTH;

  const content = (
    <Box sx={{ overflowX: 'hidden' }} role="navigation">
      <Toolbar />
      <List>
        {navItems.map(({ to, key, icon: Icon, end }) => {
          const selected = end ? location.pathname === to : location.pathname.startsWith(to);
          const button = (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              selected={selected}
              onClick={() => isMobile && setMobileDrawerOpen(false)}
              sx={{ minHeight: 48, px: 2.5, justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: collapsed && !isMobile ? 0 : 2 }}>
                <Icon />
              </ListItemIcon>
              {(!collapsed || isMobile) && <ListItemText primary={t(key)} />}
            </ListItemButton>
          );
          return collapsed && !isMobile ? (
            <Tooltip key={to} title={t(key)} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
      {!isMobile && (
        <>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
            <IconButton
              onClick={toggleSidebar}
              aria-label={collapsed ? t('nav.expandMenu') : t('nav.collapseMenu')}
              sx={{ width: 44, height: 44 }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );

  if (isMobile) {
    // Full overlay drawer below the sm breakpoint (§8, §12).
    return (
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: SIDENAV_WIDTH } }}
        data-testid="mobile-drawer"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width'),
          overflowX: 'hidden',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
