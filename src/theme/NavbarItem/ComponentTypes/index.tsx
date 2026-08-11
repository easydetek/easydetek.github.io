import React from 'react';
import type {ComponentType} from 'react';
import OriginalComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import ContextAwareDocsVersionDropdownNavbarItem from '@theme/NavbarItem/ContextAwareDocsVersionDropdownNavbarItem';

// 在官方类型表基础上追加自定义类型。
// Docusaurus 的别名机制会自动用本文件合并/覆盖原 ComponentTypes。
const ComponentTypes = {
  ...OriginalComponentTypes,
  // 上下文感知的版本下拉：只在当前产品线页面显示对应版本下拉
  'custom-contextAwareDocsVersionDropdown':
    ContextAwareDocsVersionDropdownNavbarItem as ComponentType<any>,
};

export default ComponentTypes;
