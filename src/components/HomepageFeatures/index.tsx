import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

/* 简洁的线性图标（stroke 跟随 currentColor，自动适配主题色） */
const RadarIcon = () => (
  <svg className={styles.featureSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M12 4a8 8 0 0 1 8 8" />
    <path d="M12 8a4 4 0 0 1 4 4" opacity="0.6" />
    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.35" />
    <path d="M12 12L19 5" />
  </svg>
);

const ChipIcon = () => (
  <svg className={styles.featureSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3" />
  </svg>
);

const PlugIcon = () => (
  <svg className={styles.featureSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 2v6M15 2v6" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0V8z" />
    <path d="M12 17v5" />
  </svg>
);

const BookIcon = () => (
  <svg className={styles.featureSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
  </svg>
);

type FeatureItem = {
  icon: React.ComponentType;
  title: ReactNode;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    icon: RadarIcon,
    title: <Translate id="homepage.feature.radar.title">微波 / 毫米波雷达感应</Translate>,
    description: (
      <Translate id="homepage.feature.radar.desc">
        覆盖 5.8GHz 微波与毫米波频段，支持人体存在感应、运动检测、微动识别，抗干扰、不受温度与光线影响。
      </Translate>
    ),
  },
  {
    icon: ChipIcon,
    title: <Translate id="homepage.feature.chip.title">低功耗 · 高集成模组</Translate>,
    description: (
      <Translate id="homepage.feature.chip.desc">
        自研雷达模组与传感器成品，体积小、功耗低，适配吸顶灯、橱柜灯、安防、智能家居等多种形态。
      </Translate>
    ),
  },
  {
    icon: PlugIcon,
    title: <Translate id="homepage.feature.plug.title">开放对接 · 多协议</Translate>,
    description: (
      <Translate id="homepage.feature.plug.desc">
        支持 KNX、PLC 电力线载波、串口及自定义通信协议，提供完整的对接指南，方便集成商快速接入。
      </Translate>
    ),
  },
  {
    icon: BookIcon,
    title: <Translate id="homepage.feature.book.title">完整技术文档与案例</Translate>,
    description: (
      <Translate id="homepage.feature.book.desc">
        提供规格书、安装说明、开发指南与真实应用案例，配合开源示例代码，让选型与落地更高效。
      </Translate>
    ),
  },
];

function Feature({icon: Icon, title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--3 margin-vert--md')}>
      <div className="text--center padding-horiz--md">
        <div className={styles.featureIconWrap}>
          <Icon />
        </div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
