/**
 * Y-Nav Hooks 统一导出入口
 * @version 2.0.0
 * @description 所有自定义 hooks 的集中管理点，提供类型安全的导出和便捷的使用方式
 * 
 * @example
 * // 单个导入（推荐，支持 Tree Shaking）
 * import { useDataStore, useTheme } from '@/hooks';
 * 
 * // 批量导入
 * import * as Hooks from '@/hooks';
 * const { useDataStore, useTheme } = Hooks;
 */

// ============ 核心状态管理 Hooks ============

/**
 * 数据存储 Hook - 管理所有应用数据（链接、分类、设置）
 * @see {@link useDataStore}
 * @example
 * ```tsx
 * const { links, categories, addLink, updateLink, deleteLink } = useDataStore();
 * ```
 */
export { useDataStore } from './useDataStore';

/**
 * 主题 Hook - 管理深色/浅色模式切换
 * @see {@link useTheme}
 * @example
 * ```tsx
 * const { theme, toggleTheme, setTheme } = useTheme();
 * ```
 */
export { useTheme, type ThemeMode } from './useTheme';

/**
 * 搜索 Hook - 提供链接搜索和过滤功能
 * @see {@link useSearch}
 * @example
 * ```tsx
 * const { searchQuery, filteredLinks, setSearchQuery } = useSearch();
 * ```
 */
export { useSearch } from './useSearch';

// ============ UI 交互 Hooks ============

/**
 * 模态框 Hook - 管理所有弹窗状态
 * @see {@link useModals}
 * @example
 * ```tsx
 * const { openModal, closeModal, isModalOpen } = useModals();
 * ```
 */
export { useModals } from './useModals';

/**
 * 右键菜单 Hook - 管理上下文菜单
 * @see {@link useContextMenu}
 * @example
 * ```tsx
 * const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
 * ```
 */
export { useContextMenu } from './useContextMenu';

/**
 * 侧边栏 Hook - 管理侧边栏状态
 * @see {@link useSidebar}
 * @example
 * ```tsx
 * const { isOpen, toggle, setOpen } = useSidebar();
 * ```
 */
export { useSidebar } from './useSidebar';

// ============ 数据操作 Hooks ============

/**
 * 批量编辑 Hook - 支持多选和批量操作
 * @see {@link useBatchEdit}
 * @example
 * ```tsx
 * const { selectedIds, toggleSelection, clearSelection, batchDelete } = useBatchEdit();
 * ```
 */
export { useBatchEdit } from './useBatchEdit';

/**
 * 排序 Hook - 管理链接和分类的排序
 * @see {@link useSorting}
 * @example
 * ```tsx
 * const { sortBy, sortOrder, sortedLinks, setSortBy, setSortOrder } = useSorting();
 * ```
 */
export { useSorting } from './useSorting';

/**
 * 配置 Hook - 管理应用配置
 * @see {@link useConfig}
 * @example
 * ```tsx
 * const { config, updateConfig, resetConfig } = useConfig();
 * ```
 */
export { useConfig } from './useConfig';

// ============ 同步引擎 Hooks ============

/**
 * 同步引擎 Hook - 处理云端数据同步
 * @see {@link useSyncEngine}
 * @example
 * ```tsx
 * const { syncStatus, lastSync, sync, pull, push } = useSyncEngine();
 * ```
 */
export { useSyncEngine, buildSyncData } from './useSyncEngine';

// ============ 类型导出 ============

/**
 * 所有 Hooks 的类型集合
 * @description 用于类型注解和高阶组件
 */
export type {
    // 从 useDataStore 导出的类型
    DataStoreState,
    DataStoreActions,
    // 从 useTheme 导出的类型
    ThemeMode,
    // 从 useSearch 导出的类型
    SearchState,
    // 从 useModals 导出的类型
    ModalState,
    ModalType,
    // 从 useContextMenu 导出的类型
    ContextMenuState,
    // 从 useBatchEdit 导出的类型
    BatchEditState,
    // 从 useSorting 导出的类型
    SortBy,
    SortOrder,
    // 从 useConfig 导出的类型
    AppConfig,
    // 从 useSyncEngine 导出的类型
    SyncStatus,
    SyncEngineState
} from './types';

// ============ 工具函数导出 ============

/**
 * Hook 工具函数集合
 * @description 提供一些常用的辅助函数
 */
export * from './utils';

// ============ 命名空间导出（用于批量使用） ============

/**
 * 所有 Hooks 的命名空间导出
 * @description 用于需要一次性导入所有 hooks 的场景
 * @example
 * ```tsx
 * import { Hooks } from '@/hooks';
 * 
 * function MyComponent() {
 *   const { links } = Hooks.useDataStore();
 *   const { theme } = Hooks.useTheme();
 *   // ...
 * }
 * ```
 */
import * as useDataStore from './useDataStore';
import * as useTheme from './useTheme';
import * as useSearch from './useSearch';
import * as useModals from './useModals';
import * as useContextMenu from './useContextMenu';
import * as useBatchEdit from './useBatchEdit';
import * as useSorting from './useSorting';
import * as useConfig from './useConfig';
import * as useSidebar from './useSidebar';
import * as useSyncEngine from './useSyncEngine';

export const Hooks = {
    useDataStore: useDataStore.useDataStore,
    useTheme: useTheme.useTheme,
    useSearch: useSearch.useSearch,
    useModals: useModals.useModals,
    useContextMenu: useContextMenu.useContextMenu,
    useBatchEdit: useBatchEdit.useBatchEdit,
    useSorting: useSorting.useSorting,
    useConfig: useConfig.useConfig,
    useSidebar: useSidebar.useSidebar,
    useSyncEngine: useSyncEngine.useSyncEngine,
    buildSyncData: useSyncEngine.buildSyncData
} as const;

// ============ 版本信息 ============

/**
 * Hooks 包版本信息
 */
export const HOOKS_VERSION = '2.0.0';

/**
 * 获取 Hooks 版本信息
 */
export const getHooksVersion = () => ({
    version: HOOKS_VERSION,
    timestamp: Date.now(),
    hooks: Object.keys(Hooks)
});

// ============ 开发工具（仅开发环境） ============

if (process.env.NODE_ENV === 'development') {
    /**
     * 开发环境调试工具
     * @internal
     */
    const debugHooks = () => {
        console.group('🔧 Y-Nav Hooks Debug');
        console.log('Version:', HOOKS_VERSION);
        console.log('Available Hooks:', Object.keys(Hooks));
        console.groupEnd();
    };

    // 自动执行调试信息输出
    if (typeof window !== 'undefined') {
        (window as any).__YNAV_HOOKS__ = {
            version: HOOKS_VERSION,
            Hooks,
            debug: debugHooks
        };
    }
}
