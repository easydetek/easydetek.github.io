import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import TagsListInline from '@theme/TagsListInline';
import EditMetaRow from '@theme/EditMetaRow';
import styles from './styles.module.css';

// 反馈邮件投递目标
const FEEDBACK_EMAIL = 'support@easydetek.com';

/**
 * 构建「文档反馈」邮件链接（预填标题与正文，含页面路径便于定位）。
 */
function buildFeedbackMailto(helpful: boolean, title: string, permalink: string): string {
  const subject = `文档反馈：${title}`;
  const opinion = helpful ? '✅ 有帮助' : '❌ 需改进';
  const body = [
    `文档：《${title}》`,
    `路径：${permalink}`,
    `评价：${opinion}`,
    '',
    '补充说明（可选）：',
  ].join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function DocItemFooter(): ReactNode {
  const {metadata} = useDoc();
  const {editUrl, lastUpdatedAt, lastUpdatedBy, tags, title, permalink} = metadata;

  const canDisplayTagsRow = tags.length > 0;
  const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);

  const canDisplayMetaFooter = canDisplayTagsRow || canDisplayEditMetaRow;

  // 反馈区块始终渲染（不依赖 tags/edit 信息）
  return (
    <footer
      className={clsx(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      {canDisplayMetaFooter && (
        <>
          {canDisplayTagsRow && (
            <div
              className={clsx(
                'row margin-top--sm',
                ThemeClassNames.docs.docFooterTagsRow,
              )}>
              <div className="col">
                <TagsListInline tags={tags} />
              </div>
            </div>
          )}
          {canDisplayEditMetaRow && (
            <EditMetaRow
              className={clsx(
                'margin-top--sm',
                ThemeClassNames.docs.docFooterEditMetaRow,
              )}
              editUrl={editUrl}
              lastUpdatedAt={lastUpdatedAt}
              lastUpdatedBy={lastUpdatedBy}
            />
          )}
        </>
      )}
      {/* 文档反馈区块（借鉴 ESP-IDF）—— 每篇文档都显示 */}
      <div className={clsx('margin-top--lg', styles.feedback)}>
        <span className={styles.feedbackLabel}>此文档对您有帮助吗？</span>
        <a
          className={clsx('button button--sm', styles.feedbackBtn, styles.btnYes)}
          href={buildFeedbackMailto(true, title, permalink)}>
          👍 有帮助
        </a>
        <a
          className={clsx('button button--sm', styles.feedbackBtn, styles.btnNo)}
          href={buildFeedbackMailto(false, title, permalink)}>
          👎 需改进
        </a>
      </div>
    </footer>
  );
}
