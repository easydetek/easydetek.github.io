import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// 此文件运行在 Node.js 中 —— 请勿使用浏览器端代码（BOM/DOM/JSX）

// ▼▼▼ 部署配置 ▼▼▼
// 组织/用户名（GitHub organization 或 username）
const ORGANIZATION_NAME = 'easydetek';
// 仓库：若用 <org>.github.io 形式则 baseUrl 必须为 '/'；
// 若仓库名为其他（如 docs），则改成对应仓库名并把 baseUrl 改为 '/<repo>/'
const PROJECT_NAME = 'easydetek.github.io';
// 站点最终访问地址。优先读环境变量 SITE_URL，便于 Docker / CI 动态指定；
// 不设置时回退到 GitHub Pages 默认地址。
const SITE_URL = process.env.SITE_URL || `https://${ORGANIZATION_NAME}.github.io`;
// 仓库地址（用于「编辑此页」、导航 GitHub 链接）
const REPO_URL = `https://github.com/${ORGANIZATION_NAME}/${PROJECT_NAME}`;
// ▲▲▲ 部署配置 ▲▲▲

const config: Config = {
  title: 'EasyDetek',
  tagline: '专业微波 / 毫米波雷达传感方案',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: SITE_URL,
  baseUrl: PROJECT_NAME.endsWith('.github.io') ? '/' : `/${PROJECT_NAME}/`,

  organizationName: ORGANIZATION_NAME,
  projectName: PROJECT_NAME,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // 国际化：默认中文，提供英文
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        htmlLang: 'zh-Hans',
      },
      en: {
        label: 'English',
        htmlLang: 'en',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${REPO_URL}/tree/main/docs/`,
          showLastUpdateTime: process.env.DISABLE_LAST_UPDATE !== '1',
          lastVersion: '1.0.0',
          versions: {
            current: {label: 'Next（开发版）', path: 'next', banner: 'unreleased'},
            '1.0.0': {label: '1.0.0', banner: 'none'},
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: `${REPO_URL}/tree/main/blog/`,
          blogTitle: '应用案例',
          blogSidebarTitle: '最新案例',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // 多 docs 实例：各产品线独立版本化、独立维护。
  // 新增产品线流程：① 建目录 xxx_docs/ ② 建 sidebars.xxx.ts ③ 在此加实例 ④ navbar 加入口
  plugins: [
    // 模组产品线
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'modules',
        path: 'modules_docs',
        routeBasePath: 'modules',
        sidebarPath: './sidebars.modules.ts',
        editUrl: `${REPO_URL}/tree/main/modules_docs/`,
        showLastUpdateTime: process.env.DISABLE_LAST_UPDATE !== '1',
        lastVersion: '1.0.0',
        versions: {
          current: {label: 'Next', path: 'next', banner: 'unreleased'},
          '1.0.0': {label: '1.0.0', banner: 'none'},
        },
      },
    ],
    // 独立传感器产品线
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'sensors',
        path: 'sensors_docs',
        routeBasePath: 'sensors',
        sidebarPath: './sidebars.sensors.ts',
        editUrl: `${REPO_URL}/tree/main/sensors_docs/`,
        showLastUpdateTime: process.env.DISABLE_LAST_UPDATE !== '1',
        lastVersion: '1.0.0',
        versions: {
          current: {label: 'Next', path: 'next', banner: 'unreleased'},
          '1.0.0': {label: '1.0.0', banner: 'none'},
        },
      },
    ],
    // 配件产品线
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'accessories',
        path: 'accessories_docs',
        routeBasePath: 'accessories',
        sidebarPath: './sidebars.accessories.ts',
        editUrl: `${REPO_URL}/tree/main/accessories_docs/`,
        showLastUpdateTime: process.env.DISABLE_LAST_UPDATE !== '1',
        lastVersion: '1.0.0',
        versions: {
          current: {label: 'Next', path: 'next', banner: 'unreleased'},
          '1.0.0': {label: '1.0.0', banner: 'none'},
        },
      },
    ],
    // 开源生态产品线
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'opensource',
        path: 'opensource_docs',
        routeBasePath: 'opensource',
        sidebarPath: './sidebars.opensource.ts',
        editUrl: `${REPO_URL}/tree/main/opensource_docs/`,
        showLastUpdateTime: process.env.DISABLE_LAST_UPDATE !== '1',
        lastVersion: '1.0.0',
        versions: {
          current: {label: 'Next', path: 'next', banner: 'unreleased'},
          '1.0.0': {label: '1.0.0', banner: 'none'},
        },
      },
    ],
  ],

  // 本地离线搜索（无需 Algolia，构建时生成索引，完全离线可用）
  themes: ['@easyops-cn/docusaurus-search-local'],

  themeConfig: {
    image: 'img/logo-full.png',
    // 本地搜索配置（中英文双语分词）
    search: {
      hashed: true,
      language: ['zh', 'en'],
      indexDocs: true,
      indexBlog: true,
      indexPages: true,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: 'EasyDetek Logo',
        src: 'img/logo-icon.png',
      },
      items: [
        // 各产品线入口（每个独立 docs 实例）
        {
          type: 'docSidebar',
          sidebarId: 'modulesSidebar',
          docsPluginId: 'modules',
          position: 'left',
          label: '模组',
        },
        {
          type: 'docSidebar',
          sidebarId: 'sensorsSidebar',
          docsPluginId: 'sensors',
          position: 'left',
          label: '传感器',
        },
        {
          type: 'docSidebar',
          sidebarId: 'accessoriesSidebar',
          docsPluginId: 'accessories',
          position: 'left',
          label: '配件',
        },
        {
          type: 'docSidebar',
          sidebarId: 'opensourceSidebar',
          docsPluginId: 'opensource',
          position: 'left',
          label: '开源生态',
        },
        {to: '/blog', label: '应用案例', position: 'left'},
        {to: '/open-source', label: '开源项目', position: 'left'},
        // 各产品线独立版本下拉（右侧）
        {
          type: 'docsVersionDropdown',
          docsPluginId: 'modules',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          type: 'docsVersionDropdown',
          docsPluginId: 'sensors',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          type: 'docsVersionDropdown',
          docsPluginId: 'accessories',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          type: 'docsVersionDropdown',
          docsPluginId: 'opensource',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: REPO_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      logo: {
        alt: 'EasyDetek Logo',
        src: 'img/logo-white.png',
        height: 48,
      },
      links: [
        {
          title: '产品线',
          items: [
            {label: '模组', to: '/modules/intro'},
            {label: '传感器', to: '/sensors/intro'},
            {label: '配件', to: '/accessories/intro'},
            {label: '开源生态', to: '/opensource/intro'},
          ],
        },
        {
          title: '通用',
          items: [
            {label: '快速开始', to: '/docs/intro'},
            {label: '应用案例', to: '/blog'},
            {label: '开源项目', to: '/open-source'},
            {
              label: 'GitHub',
              href: REPO_URL,
            },
          ],
        },
        {
          title: '联系我们',
          items: [
            {label: '商务合作', href: 'mailto:business@easydetek.com'},
            {label: '技术支持', href: 'mailto:support@easydetek.com'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} EasyDetek. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['c', 'cpp', 'python', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
