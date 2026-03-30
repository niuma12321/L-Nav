import { useState, useEffect, useCallback, useMemo } from 'react';
import { LinkItem, Category } from '../types';
import { useDialog } from '../components/ui/DialogProvider';

interface UseBatchEditProps {
    links: LinkItem[];
    categories: Category[];
    displayedLinks: LinkItem[];
    updateData: (links: LinkItem[], categories: Category[]) => void;
}

export function useBatchEdit({
    links,
    categories,
    displayedLinks,
    updateData
}: UseBatchEditProps) {
    const { notify, confirm } = useDialog();

    const [isBatchEditMode, setIsBatchEditMode] = useState(false);
    const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());

    // 选择数量
    const selectedCount = useMemo(() => selectedLinks.size, [selectedLinks]);
    const isAllSelected = useMemo(() => {
        return displayedLinks.length > 0 && selectedLinks.size === displayedLinks.length;
    }, [displayedLinks, selectedLinks]);

    // 切换批量模式
    const toggleBatchEditMode = useCallback(() => {
        setIsBatchEditMode(prev => !prev);
        setSelectedLinks(new Set());
    }, []);

    // 切换单个选择
    const toggleLinkSelection = useCallback((linkId: string) => {
        setSelectedLinks(prev => {
            const newSet = new Set(prev);
            newSet.has(linkId) ? newSet.delete(linkId) : newSet.add(linkId);
            return newSet;
        });
    }, []);

    // 全选 / 取消全选
    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedLinks(new Set());
        } else {
            setSelectedLinks(new Set(displayedLinks.map(link => link.id)));
        }
    }, [isAllSelected, displayedLinks]);

    // 批量删除
    const handleBatchDelete = useCallback(async () => {
        if (selectedLinks.size === 0) {
            notify('请先选择要删除的链接', 'warning');
            return;
        }

        const ok = await confirm({
            title: '删除链接',
            message: `确定删除选中的 ${selectedLinks.size} 个链接？`,
            confirmText: '删除',
            cancelText: '取消',
            variant: 'danger'
        });

        if (!ok) return;

        const newLinks = links.filter(link => !selectedLinks.has(link.id));
        updateData(newLinks, categories);
        setSelectedLinks(new Set());
        setIsBatchEditMode(false);
        notify(`已删除 ${selectedLinks.size} 个链接`, 'success');
    }, [selectedLinks, links, categories, updateData, notify, confirm]);

    // 批量移动分类
    const handleBatchMove = useCallback((targetCategoryId: string) => {
        if (selectedLinks.size === 0) {
            notify('请先选择要移动的链接', 'warning');
            return;
        }

        const newLinks = links.map(link =>
            selectedLinks.has(link.id) ? { ...link, categoryId: targetCategoryId } : link
        );
        updateData(newLinks, categories);
        setSelectedLinks(new Set());
        setIsBatchEditMode(false);
        notify(`已移动 ${selectedLinks.size} 个链接`, 'success');
    }, [selectedLinks, links, categories, updateData, notify]);

    // 批量置顶
    const handleBatchPin = useCallback(() => {
        if (selectedLinks.size === 0) {
            notify('请先选择要置顶的链接', 'warning');
            return;
        }

        const maxOrder = links.reduce((max, link) =>
            link.pinned ? Math.max(max, link.pinnedOrder ?? -1) : max, -1
        );

        let next = maxOrder + 1;
        const newLinks = links.map(link => {
            if (!selectedLinks.has(link.id) || link.pinned) return link;
            return { ...link, pinned: true, pinnedOrder: next++ };
        });

        updateData(newLinks, categories);
        notify(`已置顶 ${selectedLinks.size} 个链接`, 'success');
    }, [selectedLinks, links, categories, updateData, notify]);

    // 快捷键支持
    useEffect(() => {
        if (!isBatchEditMode) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsBatchEditMode(false);
                setSelectedLinks(new Set());
            }
            if (e.key === 'Delete' && selectedLinks.size > 0) {
                handleBatchDelete();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isBatchEditMode, selectedLinks, handleBatchDelete]);

    return {
        isBatchEditMode,
        selectedLinks,
        selectedCount,
        isAllSelected,
        toggleBatchEditMode,
        toggleLinkSelection,
        handleSelectAll,
        handleBatchDelete,
        handleBatchMove,
        handleBatchPin
    };
}
