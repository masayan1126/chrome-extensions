import type { ManifestV3 } from '@crxjs/vite-plugin';

const manifest: ManifestV3 = {
  manifest_version: 3,
  name: '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
  version: '1.0.2',
  minimum_chrome_version: '114',
  default_locale: 'en',
  permissions: [
    'tabs',
    'tabGroups',
    'clipboardWrite',
    'contextMenus',
    'activeTab',
    'offscreen'
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  action: {
    default_title: 'Copy Tab Anything',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icon-16.png',
      32: 'public/icon-16.png',
      48: 'public/icon-16.png',
      128: 'public/icon-16.png'
    }
  },
  options_page: 'src/options/index.html',
  commands: {
    'copy-current-window': {
      suggested_key: {
        default: 'Alt+Shift+C'
      },
      description: '__MSG_commandCopyCurrentWindow__'
    }
  },
  icons: {
    16: 'public/icon-16.png',
    32: 'public/icon-16.png',
    48: 'public/icon-16.png',
    128: 'public/icon-16.png'
  },
  web_accessible_resources: [
    {
      resources: ['src/offscreen/index.html'],
      matches: ['<all_urls>']
    }
  ]
};

export default manifest;


