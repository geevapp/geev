import {
  Home,
  User,
  Wallet,
  Trophy,
  Bell,
  Settings,
  TrendingUp,
} from 'lucide-react';

export const navigationItems = [
  {
    label: 'Feed',
    href: '/feed',
    icon: Home,
  },
  // {
  //   label: 'Profile',
  //   // Note: Profile href will likely need dynamic user ID injection in components
  //   href: '/profile/me',
  //   icon: User,
  // }, not part of the figma design
  // {
  //   label: 'Wallet',
  //   href: '/wallet',
  //   icon: Wallet,
  // }, not part of the figma design although part of the issue description
  {
    label: 'Activity',
    href: '/activity',
    icon: TrendingUp,
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
