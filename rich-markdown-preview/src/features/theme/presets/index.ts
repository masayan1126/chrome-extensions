import type { Theme } from '../../../shared/types';
import { githubThemes } from './githubThemes';
import { classicThemes } from './classicThemes';
import { materialThemes } from './materialThemes';
import { catppuccinThemes } from './catppuccinThemes';
import { ayuThemes } from './ayuThemes';
import { everforestThemes } from './everforestThemes';
import { rosePineThemes } from './rosePineThemes';
import { darkClassicThemes } from './darkClassicThemes';
import { tokyoThemes } from './tokyoThemes';
import { retroThemes } from './retroThemes';

const allThemeGroups: Theme[] = [
  ...githubThemes,
  ...classicThemes,
  ...materialThemes,
  ...catppuccinThemes,
  ...ayuThemes,
  ...everforestThemes,
  ...rosePineThemes,
  ...darkClassicThemes,
  ...tokyoThemes,
  ...retroThemes,
];

// Original order: light themes first, then dark themes
export const presetThemes: Theme[] = [
  ...allThemeGroups.filter((t) => !t.isDark),
  ...allThemeGroups.filter((t) => t.isDark),
];

export const defaultThemeId = 'github-dark';
