import type {ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import styles from './open-source.module.css';

type Project = {
  name: string;
  description: ReactNode;
  language: string;
  stars: string;
  url: string;
  tags: string[];
};

type Recipe = {
  title: string;
  summary: ReactNode;
  /** 主文档地址：标题与「查看完整案例」都指向它 */
  docUrl: string;
  links: {label: string; to: string}[];
  tags: string[];
};

const projects: Project[] = [
  {
    name: 'ed_radar',
    description: (
      <Translate id="oss.sdk.desc">
        面向 EDQ152 / EDV163 / EDV11P 等多款易探雷达的 ESP-IDF 面向对象抽象接口层：统一 API 屏蔽协议细节，支持 ESP Component Registry 一键引入。
      </Translate>
    ),
    language: 'C',
    stars: '⭐ 待补充',
    url: 'https://github.com/fuhua817/ed_radar',
    tags: ['ESP-IDF', '雷达组件', 'ESP Registry'],
  },
];

// 站内「参考方案 / Recipes」：从硬件到上位机的完整可复现教程，
// 与本页上方的开源仓库卡片区分开（条目指向站内文档、固件与在线工具）。
const recipes: Recipe[] = [
  {
    title: 'EDK60 + EDV151 呼吸心率监测方案',
    docUrl: '/blog/edk60-vital-signs-edv151',
    summary: (
      <Translate id="oss.recipe.edk60.desc">
        用 EDK60（ESP32-C6）搭载 EDV151 生命体征雷达，非接触测量呼吸率与心率，经原生 USB 免驱实时上报 PC；含实测数据、串口协议与关键调参经验。
      </Translate>
    ),
    // 注意：static/ 下的文件不是站点路由，必须加 pathname:// 前缀，
    // 否则 Docusaurus 的 broken-link 检查会判定为失效链接。
    // 前缀会让 <Link> 退化为普通 <a href> 并跳过链接校验（与站内 markdown 写法一致）。
    links: [
      {label: '查看完整案例', to: '/blog/edk60-vital-signs-edv151'},
      {
        label: '新手烧录指南',
        to: '/opensource/%E5%BC%80%E6%BA%90%E7%A1%AC%E4%BB%B6/EDK60/flash-guide',
      },
      {label: '网页烧录工具', to: 'pathname:///edk60/flash.html'},
      {label: '固件下载', to: 'pathname:///edk60/edk60_edv151_vital.bin'},
    ],
    tags: ['EDK60', 'EDV151', 'ESP32-C6', '生命体征'],
  },
];

function ProjectCard({project}: {project: Project}) {
  return (
    <div className={clsx('card', styles.card)}>
      <div className="card__header">
        <Heading as="h3" className={styles.name}>
          <Link href={project.url} className={styles.link}>
            {project.name}
          </Link>
        </Heading>
        <div className={styles.meta}>
          <span className="badge badge--secondary">{project.language}</span>
          <span className={styles.stars}>{project.stars}</span>
        </div>
      </div>
      <div className="card__body">
        <p>{project.description}</p>
      </div>
      <div className="card__footer">
        <div className={styles.tags}>
          {project.tags.map((t) => (
            <span key={t} className="badge badge--primary badge--sm">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({recipe}: {recipe: Recipe}) {
  return (
    <div className={clsx('card', styles.card)}>
      <div className="card__header">
        <Heading as="h3" className={styles.name}>
          <Link to={recipe.docUrl} className={styles.link}>
            {recipe.title}
          </Link>
        </Heading>
      </div>
      <div className="card__body">
        <p>{recipe.summary}</p>
      </div>
      <div className="card__footer">
        <div className={styles.recipeActions}>
          {recipe.links.map((l, i) => (
            <Link
              key={l.label}
              to={l.to}
              className={clsx(
                'button button--sm',
                i === 0 ? 'button--primary' : 'button--secondary button--outline',
              )}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className={clsx(styles.tags, 'margin-top--sm')}>
          {recipe.tags.map((t) => (
            <span key={t} className="badge badge--secondary badge--sm">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OpenSourcePage(): ReactNode {
  return (
    <Layout
      title="开源项目"
      description="EasyDetek 开源项目：SDK、示例代码与参考设计。">
      <main className="container margin-vert--lg">
        <Heading as="h1" className="text--center">
          <Translate id="oss.title">开源项目</Translate>
        </Heading>
        <p className="text--center margin-bottom--xl">
          <Translate id="oss.subtitle">
            我们将 SDK、对接示例与参考设计开源，帮助开发者与集成商快速上手。
          </Translate>
        </p>
        <div className="row">
          {projects.map((p) => (
            <div key={p.name} className="col col--6 margin-vert--sm">
              <ProjectCard project={p} />
            </div>
          ))}
        </div>

        <div className="margin-top--xl">
          <Heading as="h2" className="text--center">
            <Translate id="oss.recipe.title">参考方案</Translate>
          </Heading>
          <p className="text--center margin-bottom--lg">
            <Translate id="oss.recipe.subtitle">
              从硬件到上位机的完整可复现方案，附固件、在线烧录工具与实战调参记录。
            </Translate>
          </p>
          <div className="row">
            {recipes.map((r) => (
              <div key={r.title} className="col col--12 margin-vert--sm">
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cta}>
          <Heading as="h3">
            <Translate id="oss.more.title">想了解更多？</Translate>
          </Heading>
          <p>
            <Translate id="oss.more.desc">
              访问我们的 GitHub 组织获取全部公开仓库，或通过商务邮箱沟通定制需求。
            </Translate>
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className="button button--primary button--lg"
              href="https://github.com/easydetek">
              <Translate id="oss.more.github">前往 GitHub 组织</Translate>
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="mailto:sales@easydetek.com">
              <Translate id="oss.more.contact">sales@easydetek.com</Translate>
            </Link>
          </div>
          <p className={styles.ctaContacts}>
            <Translate id="oss.more.tel">电话：0755-27788421</Translate>
            <br />
            <Translate id="oss.more.mobile">手机：+8615361626679</Translate>
          </p>
        </div>
      </main>
    </Layout>
  );
}
