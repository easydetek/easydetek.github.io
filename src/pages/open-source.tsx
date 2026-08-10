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

const projects: Project[] = [
  {
    name: 'easydetek-radar-sdk',
    description: (
      <Translate id="oss.sdk.desc">
        EasyDetek 雷达传感器通用 SDK，封装串口通信、数据解析与配置接口，支持 EDV 系列。
      </Translate>
    ),
    language: 'C / Python',
    stars: '⭐ 待补充',
    url: 'https://github.com/easydetek/easydetek-radar-sdk',
    tags: ['SDK', '串口', 'EDV 系列'],
  },
  {
    name: 'edc116-arduino-example',
    description: (
      <Translate id="oss.arduino.desc">
        EDC116 嵌入式模组与 Arduino / ESP32 的对接示例，演示灯具人体感应控制。
      </Translate>
    ),
    language: 'C++',
    stars: '⭐ 待补充',
    url: 'https://github.com/easydetek/edc116-arduino-example',
    tags: ['Arduino', 'EDC116', '示例'],
  },
  {
    name: 'knx-edq25sk-profile',
    description: (
      <Translate id="oss.knx.desc">
        EDQ25S-K 双鉴 KNX 传感器的 KNX 设备描述文件与 ETS 工程模板。
      </Translate>
    ),
    language: 'KNX',
    stars: '⭐ 待补充',
    url: 'https://github.com/easydetek/knx-edq25sk-profile',
    tags: ['KNX', 'EDQ25S-K', '双鉴'],
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
            <div key={p.name} className="col col--4 margin-vert--sm">
              <ProjectCard project={p} />
            </div>
          ))}
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
              href="mailto:business@easydetek.com">
              <Translate id="oss.more.contact">商务合作</Translate>
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
