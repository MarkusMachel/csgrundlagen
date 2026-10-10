import { Bot, Monitor, Smartphone, Tablet, type LucideProps } from 'lucide-react';

import type { DeviceType } from '../types';

const icons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, bot: Bot };

export function DeviceIcon({ device, ...props }: { device: DeviceType } & LucideProps) {
  const Icon = icons[device] ?? Monitor;
  return <Icon aria-hidden {...props} />;
}
