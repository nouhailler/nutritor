import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/tokens';

type IconName =
  | 'menu'
  | 'back'
  | 'search'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'home'
  | 'book'
  | 'chart'
  | 'user'
  | 'scan'
  | 'sliders'
  | 'alert'
  | 'bookmark'
  | 'arrow-right'
  | 'sparkle'
  | 'leaf'
  | 'settings'
  | 'refresh'
  | 'upload'
  | 'download'
  | 'key'
  | 'cpu'
  | 'database'
  | 'trash'
  | 'edit'
  | 'help'
  | 'info'
  | 'zap'
  | 'shield'
  | 'target'
  | 'clock'
  | 'globe';

const FEATHER_MAP: Record<IconName, keyof typeof Feather.glyphMap> = {
  menu: 'menu',
  back: 'chevron-left',
  search: 'search',
  plus: 'plus',
  minus: 'minus',
  check: 'check',
  close: 'x',
  home: 'home',
  book: 'book-open',
  chart: 'bar-chart-2',
  user: 'user',
  scan: 'maximize',
  sliders: 'sliders',
  alert: 'alert-triangle',
  bookmark: 'bookmark',
  'arrow-right': 'arrow-right',
  sparkle: 'star',
  leaf: 'feather',
  settings: 'settings',
  refresh: 'refresh-cw',
  upload: 'upload',
  download: 'download',
  key: 'key',
  cpu: 'cpu',
  database: 'database',
  trash: 'trash-2',
  edit: 'edit-2',
  help: 'help-circle',
  info: 'info',
  zap: 'zap',
  shield: 'shield',
  target: 'target',
  clock: 'clock',
  globe: 'globe',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = Colors.ink }: IconProps) {
  const featherName = FEATHER_MAP[name] ?? 'circle';
  return <Feather name={featherName} size={size} color={color} />;
}
