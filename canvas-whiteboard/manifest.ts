import type { ManifestV3 } from '@crxjs/vite-plugin';

const manifest: ManifestV3 = {
  manifest_version: 3,
  name: '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
  version: '1.0.0',
  minimum_chrome_version: '114',
  default_locale: 'en',
  permissions: ['storage', 'activeTab', 'tabs', 'scripting'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_title: 'Canvas Whiteboard',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icon-16.png',
      48: 'public/icon-48.png',
      128: 'public/icon-128.png',
    },
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      css: ['src/content/styles.css'],
      run_at: 'document_idle',
    },
  ],
  commands: {
    'toggle-whiteboard': {
      suggested_key: {
        default: 'Alt+W',
      },
      description: '__MSG_commandToggle__',
    },
  },
  icons: {
    16: 'public/icon-16.png',
    48: 'public/icon-48.png',
    128: 'public/icon-128.png',
  },
};

export default manifest;
