import React from 'react';
import type {ReactNode} from 'react';
import {useActivePlugin} from '@docusaurus/plugin-content-docs/client';
// 引用 swizzle 包装前的官方组件，避免递归
import DocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';

type Props = {
  docsPluginId?: string;
  mobile?: boolean;
  // 透传其余 props（dropdownItemsBefore/After、versions、dropdownActiveClassDisabled 等）
  [key: string]: unknown;
};

/**
 * 上下文感知的版本下拉选择器。
 *
 * 行为：仅当「当前正在浏览的 docs 产品线 === 本下拉绑定的产品线」时才渲染，
 * 否则返回 null（不显示）。这样导航栏同一时刻只会出现一个版本下拉，
 * 即当前产品线对应的那个——与 ESP-IDF 的「选中产品再看版本」体验一致。
 *
 * 判断依据：useActivePlugin() 基于当前 pathname 与各 docs 实例的 routeBasePath 做匹配，
 * 在非 docs 页（首页 / blog / open-source）返回 undefined，此时所有版本下拉自然隐藏。
 */
export default function ContextAwareDocsVersionDropdownNavbarItem({
  docsPluginId,
  ...props
}: Props): ReactNode {
  const activePlugin = useActivePlugin();

  // 当前产品线与本下拉绑定的一致才渲染
  if (activePlugin?.pluginId !== docsPluginId) {
    return null;
  }

  return (
    <DocsVersionDropdownNavbarItem
      docsPluginId={docsPluginId}
      // 官方组件要求这两个数组存在，提供默认空数组
      dropdownItemsBefore={[]}
      dropdownItemsAfter={[]}
      {...props}
    />
  );
}
