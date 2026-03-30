/**
 * 批量编辑 Hook - 高性能、功能完整的链接批量操作管理器
 * @version 2.0.0
 * @description 支持多选、批量删除、移动、置顶、取消置顶、范围选择等功能
 * 
 * @example
 * ```tsx
 * const {
 *   isBatchEditMode,
 *   selectedLinks,
 *   selectedCount,
 *   toggleBatchEditMode,
 *   toggleLinkSelection,
 *   handleRangeSelect,
 *   handleBatchDelete,
 *   handleBatchMove,
 *   handleBatchPin,
 *   handleBatchUnpin,
 *   handleBatchEdit,
 *   handleSelectAll,
 *   handleSelectNone,
 *   handleInvertSelection,
 *   exitBatchEdit
 * } = useBatchEdit({ links, categories, displayedLinks, updateData });
 * ```
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { LinkItem, Category } from '../types';
import { useDialog } from '../components/ui/DialogProvider';

// ============ 类型定义 ============

export interface UseBatchEditProps {
    links: LinkItem[];
    categories: Category[];
    displayedLinks: LinkItem[];
    updateData: (links: LinkItem[], categories: Category[]) => void;
    onBatchEditStart?: () => void;
    onBatchEditEnd?: () => void;
}

export interface BatchEditState {
    isBatchEditMode: boolean;
    selectedLinks: Set<string>;
    lastSelectedId: string | null;
    operationHistory: BatchOperation[];
}

export interface BatchOperation {
    type: 'delete' | 'move' | 'pin' | 'unpin' | 'edit';
    timestamp: number;
    previousLinks: LinkItem[];
    description: string;
}

export interface BatchEditOptions {
    skipConfirm?: boolean;
    silent?: boolean;
}

// ============ Hook 实现 ============

export function useBatchEdit({
    links,
    categories,
    displayedLinks,
    updateData,
    onBatchEditStart,
    onBatchEditEnd
}: UseBatchEditProps) {
    const { notify, confirm } = useDialog();
    
    // 状态管理
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);
    const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [operationHistory, setOperationHistory] = useState<BatchOperation[]>([]);
    
    // Refs 用于性能优化
    const linksRef = useRef(links);
    const displayedLinksRef = useRef(displayedLinks);
    
    // 更新 refs
    useEffect(() => {
        linksRef.current = links;
        displayedLinksRef.current = displayedLinks;
    }, [links, displayedLinks]);

    // ============ 计算属性 (useMemo 优化) ============

    /**
     * 选中的链接数量
     */
    const selectedCount = useMemo(() => selectedLinks.size, [selectedLinks.size]);

    /**
     * 选中的链接对象列表
     */
    const selectedLinkItems = useMemo(() => {
        return links.filter(link => selectedLinks.has(link.id));
    }, [links, selectedLinks]);

    /**
     * 是否全选
     */
    const isAllSelected = useMemo(() => {
        return displayedLinks.length > 0 && 
               selectedLinks.size === displayedLinks.length && 
               displayedLinks.every(link => selectedLinks.has(link.id));
    }, [displayedLinks, selectedLinks]);

    /**
     * 是否部分选中
     */
    const isPartiallySelected = useMemo(() => {
        return selectedLinks.size > 0 && !isAllSelected;
    }, [selectedLinks.size, isAllSelected]);

    /**
     * 选中链接的分类统计
     */
    const selectedCategoryStats = useMemo(() => {
        const stats = new Map<string, number>();
        selectedLinkItems.forEach(link => {
            const count = stats.get(link.categoryId) || 0;
            stats.set(link.categoryId, count + 1);
        });
        return stats;
    }, [selectedLinkItems]);

    // ============ 基础操作 ============

    /**
     * 进入批量编辑模式
     */
    const enterBatchEditMode = useCallback(() => {
        setIsBatchEditMode(true);
        setSelectedLinks(new Set());
        setLastSelectedId(null);
        onBatchEditStart?.();
    }, [onBatchEditStart]);

    /**
     * 退出批量编辑模式
     */
    const exitBatchEdit = useCallback(() => {
        setIsBatchEditMode(false);
        setSelectedLinks(new Set());
        setLastSelectedId(null);
        onBatchEditEnd?.();
    }, [onBatchEditEnd]);

    /**
     * 切换批量编辑模式
     */
    const toggleBatchEditMode = useCallback(() => {
        if (isBatchEditMode) {
            exitBatchEdit();
        } else {
            enterBatchEditMode();
        }
    }, [isBatchEditMode, enterBatchEditMode, exitBatchEdit]);

    /**
     * 切换单个链接选择
     */
    const toggleLinkSelection = useCallback((linkId: string, event?: React.MouseEvent) => {
        // Shift+点击：范围选择
        if (event?.shiftKey && lastSelectedId) {
            handleRangeSelect(lastSelectedId, linkId);
            return;
        }

        // Ctrl/Cmd+点击：添加到选择
        const shouldToggle = event ? (event.ctrlKey || event.metaKey) : true;
        
        setSelectedLinks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(linkId)) {
                if (shouldToggle) {
                    newSet.delete(linkId);
                }
            } else {
                newSet.add(linkId);
            }
            return newSet;
        });
        
        setLastSelectedId(linkId);
    }, [lastSelectedId]);

    /**
     * 范围选择（Shift+点击）
     */
    const handleRangeSelect = useCallback((startId: string, endId: string) => {
        const displayed = displayedLinksRef.current;
        const startIndex = displayed.findIndex(link => link.id === startId);
        const endIndex = displayed.findIndex(link => link.id === endId);
        
        if (startIndex === -1 || endIndex === -1) {
            toggleLinkSelection(endId);
            return;
        }

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        const rangeIds = displayed
            .slice(minIndex, maxIndex + 1)
            .map(link => link.id);
        
        setSelectedLinks(new Set(rangeIds));
        setLastSelectedId(endId);
    }, [toggleLinkSelection]);

    /**
     * 全选
     */
    const handleSelectAll = useCallback(() => {
        const allIds = displayedLinksRef.current.map(link => link.id);
        setSelectedLinks(new Set(allIds));
    }, []);

    /**
     * 取消全选
     */
    const handleSelectNone = useCallback(() => {
        setSelectedLinks(new Set());
    }, []);

    /**
     * 反选
     */
    const handleInvertSelection = useCallback(() => {
        const displayedIds = new Set(displayedLinksRef.current.map(link => link.id));
        setSelectedLinks(prev => {
            const newSet = new Set<string>();
            displayedIds.forEach(id => {
                if (!prev.has(id)) {
                    newSet.add(id);
                }
            });
            return newSet;
        });
    }, []);

    // ============ 批量操作辅助函数 ============

    /**
     * 保存操作历史（用于撤销）
     */
    const saveOperationHistory = useCallback((
        type: BatchOperation['type'],
        description: string,
        previousLinks: LinkItem[]
    ) => {
        setOperationHistory(prev => [{
            type,
            timestamp: Date.now(),
            previousLinks: [...previousLinks],
            description
        }, ...prev].slice(0, 10)); // 只保留最近 10 条
    }, []);

    /**
     * 执行批量操作的通用函数
     */
    const executeBatchOperation = useCallback(async (
        operation: {
            type: BatchOperation['type'];
            description: string;
            transform: (links: LinkItem[]) => LinkItem[];
            confirmMessage?: string;
            successMessage?: string;
        },
        options: BatchEditOptions = {}
    ): Promise<boolean> => {
        if (selectedLinks.size === 0) {
            if (!options.silent) {
                notify('请先选择要操作的链接', 'warning');
            }
            return false;
        }

        // 确认对话框
        if (!options.skipConfirm && operation.confirmMessage) {
            const shouldProceed = await confirm({
                title: operation.description,
                message: operation.confirmMessage,
                confirmText: '确认',
                cancelText: '取消',
                variant: operation.type === 'delete' ? 'danger' : 'default'
            });

            if (!shouldProceed) return false;
        }

        // 执行操作
        const previousLinks = [...linksRef.current];
        const newLinks = operation.transform(previousLinks);
        
        // 保存历史
        saveOperationHistory(operation.type, operation.description, previousLinks);
        
        // 更新数据
        updateData(newLinks, categories);
        
        // 清空选择
        setSelectedLinks(new Set());
        setLastSelectedId(null);
        
        // 成功通知
        if (!options.silent && operation.successMessage) {
            notify(operation.successMessage, 'success');
        }

        return true;
    }, [selectedLinks, categories, updateData, notify, confirm, saveOperationHistory]);

    // ============ 批量操作 ============

    /**
     * 批量删除
     */
    const handleBatchDelete = useCallback(async (options: BatchEditOptions = {}) => {
        return await executeBatchOperation({
            type: 'delete',
            description: '批量删除',
            confirmMessage: `确定要删除选中的 ${selectedLinks.size} 个链接吗？此操作可以撤销。`,
            successMessage: `已删除 ${selectedLinks.size} 个链接`,
            transform: (links) => links.filter(link => !selectedLinks.has(link.id))
        }, options);
    }, [selectedLinks, executeBatchOperation]);

    /**
     * 批量移动
     */
    const handleBatchMove = useCallback(async (
        targetCategoryId: string,
        options: BatchEditOptions = {}
    ) => {
        const targetCategory = categories.find(c => c.id === targetCategoryId);
        if (!targetCategory) {
            notify('目标分类不存在', 'error');
            return false;
        }

        return await executeBatchOperation({
            type: 'move',
            description: '批量移动',
            confirmMessage: `确定要将选中的 ${selectedLinks.size} 个链接移动到「${targetCategory.name}」吗？`,
            successMessage: `已将 ${selectedLinks.size} 个链接移动到「${targetCategory.name}」`,
            transform: (links) => links.map(link =>
                selectedLinks.has(link.id) ? { ...link, categoryId: targetCategoryId } : link
            )
        }, options);
    }, [selectedLinks, categories, executeBatchOperation, notify]);

    /**
     * 批量置顶
     */
    const handleBatchPin = useCallback(async (options: BatchEditOptions = {}) => {
        const linksToPin = selectedLinkItems.filter(link => !link.pinned);
        
        if (linksToPin.length === 0) {
            notify('所选链接已全部置顶', 'info');
            return false;
        }

        return await executeBatchOperation({
            type: 'pin',
            description: '批量置顶',
            confirmMessage: `确定要置顶选中的 ${linksToPin.length} 个链接吗？`,
            successMessage: `已置顶 ${linksToPin.length} 个链接`,
            transform: (links) => {
                const maxPinnedOrder = links.reduce((max, link) => {
                    if (!link.pinned || link.pinnedOrder === undefined) return max;
                    return Math.max(max, link.pinnedOrder);
                }, -1);

                let nextOrder = maxPinnedOrder + 1;
                const orderMap = new Map<string, number>();
                
                // 按显示顺序分配置顶顺序
                displayedLinksRef.current
                    .filter(link => selectedLinks.has(link.id) && !link.pinned)
                    .forEach(link => {
                        orderMap.set(link.id, nextOrder++);
                    });

                return links.map(link => {
                    const order = orderMap.get(link.id);
                    if (order === undefined) return link;
                    return { ...link, pinned: true, pinnedOrder: order };
                });
            }
        }, options);
    }, [selectedLinks, selectedLinkItems, executeBatchOperation, notify]);

    /**
     * 批量取消置顶
     */
    const handleBatchUnpin = useCallback(async (options: BatchEditOptions = {}) => {
        const linksToUnpin = selectedLinkItems.filter(link => link.pinned);
        
        if (linksToUnpin.length === 0) {
            notify('所选链接都没有置顶', 'info');
            return false;
        }

        return await executeBatchOperation({
            type: 'unpin',
            description: '批量取消置顶',
            confirmMessage: `确定要取消置顶选中的 ${linksToUnpin.length} 个链接吗？`,
            successMessage: `已取消置顶 ${linksToUnpin.length} 个链接`,
            transform: (links) => links.map(link =>
                selectedLinks.has(link.id) ? { ...link, pinned: false, pinnedOrder: undefined } : link
            )
        }, options);
    }, [selectedLinks, selectedLinkItems, executeBatchOperation, notify]);

    /**
     * 批量编辑属性
     */
    const handleBatchEdit = useCallback(async (
        updates: Partial<Omit<LinkItem, 'id' | 'createdAt'>>,
        options: BatchEditOptions = {}
    ) => {
        const safeUpdates = { ...updates };
        delete safeUpdates.id;
        delete safeUpdates.createdAt;

        if (Object.keys(safeUpdates).length === 0) {
            notify('没有要更新的属性', 'warning');
            return false;
        }

        const updateDescription = Object.entries(safeUpdates)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return await executeBatchOperation({
            type: 'edit',
            description: '批量编辑',
            confirmMessage: `确定要更新选中的 ${selectedLinks.size} 个链接吗？\n更新: ${updateDescription}`,
            successMessage: `已更新 ${selectedLinks.size} 个链接`,
            transform: (links) => links.map(link =>
                selectedLinks.has(link.id) ? { ...link, ...safeUpdates } : link
            )
        }, options);
    }, [selectedLinks, executeBatchOperation, notify]);

    /**
     * 撤销操作
     */
    const handleUndo = useCallback(async () => {
        if (operationHistory.length === 0) {
            notify('没有可撤销的操作', 'info');
            return false;
        }

        const lastOperation = operationHistory[0];
        
        const shouldUndo = await confirm({
            title: '撤销操作',
            message: `确定要撤销「${lastOperation.description}」吗？`,
            confirmText: '撤销',
            cancelText: '取消'
        });

        if (!shouldUndo) return false;

        updateData(lastOperation.previousLinks, categories);
        setOperationHistory(prev => prev.slice(1));
        setSelectedLinks(new Set());
        
        notify('已撤销操作', 'success');
        return true;
    }, [operationHistory, categories, updateData, notify, confirm]);

    // ============ 键盘快捷键支持 ============

    useEffect(() => {
        if (!isBatchEditMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape: 退出批量编辑
            if (e.key === 'Escape') {
                exitBatchEdit();
                return;
            }

            // Ctrl+A: 全选
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSelectAll();
                return;
            }

            // Ctrl+Z: 撤销
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleUndo();
                return;
            }

            // Delete/Backspace: 删除选中
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLinks.size > 0) {
                e.preventDefault();
                handleBatchDelete({ skipConfirm: e.shiftKey });
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isBatchEditMode,
        selectedLinks,
        exitBatchEdit,
        handleSelectAll,
        handleBatchDelete,
        handleUndo
    ]);

    // ============ 返回值 ============

    return {
        // 状态
        isBatchEditMode,
        selectedLinks,
        selectedCount,
        selectedLinkItems,
        isAllSelected,
        isPartiallySelected,
        selectedCategoryStats,
        operationHistory,
        canUndo: operationHistory.length > 0,
        
        // 模式切换
        enterBatchEditMode,
        exitBatchEdit,
        toggleBatchEditMode,
        
        // 选择操作
        toggleLinkSelection,
        handleRangeSelect,
        handleSelectAll,
        handleSelectNone,
        handleInvertSelection,
        
        // 批量操作
        handleBatchDelete,
        handleBatchMove,
        handleBatchPin,
        handleBatchUnpin,
        handleBatchEdit,
        handleUndo
    };
}

// ============ 便捷导出 ============

export type UseBatchEditReturn = ReturnType<typeof useBatchEdit>;
