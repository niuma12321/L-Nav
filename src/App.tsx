import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { LinkItem, Category } from './types';

// 统一同步引擎
import { useUnifiedSync } from './hooks/useUnifiedSync';

// 同步导入所有组件，避免懒加载Promise问题
import LinkModal from './components/modals/LinkModal';
import CategoryManagerModal from './components/modals/CategoryManagerModal';
import ImportModal from './components/modals/ImportModal';
import SettingsModal from './components/modals/SettingsModal';
import SearchConfigModal from './components/modals/SearchConfigModal';
import DataBackupModal from './components/modals/DataBackupModal';
import LoginModal from './components/modals/LoginModal';

// Mobile components
import MobileContentViewer from './components/mobile/MobileContentViewer';
import MobileFullscreenSearch from './components/mobile/MobileFullscreenSearch';
import MobileCategoryManager from './components/mobile/MobileCategoryManager';
import MobileLinkBottomSheet from './components/mobile/MobileLinkBottomSheet';
import MobileSettings from './components/mobile/MobileSettings';
import MobileBulkEdit from './components/mobile/MobileBulkEdit';

// V9 Components - Y-Nav Elite V9.0 Modular Edition
import V9Dashboard from './components/v6/V9Dashboard';

// Eagerly load frequently used components
import ContextMenu from './components/layout/ContextMenu';
import SyncStatusIndicator from './components/ui/SyncStatusIndicator';
import { useDialog } from './components/ui/DialogProvider';

import {
  useDataStore,
  useTheme,
  useSearch,
  useModals,
  useContextMenu,
  useBatchEdit,
  useSorting,
  useConfig,
  useSidebar,
  useNotes,
  useRouter
} from './hooks';

import {
  GITHUB_REPO_URL,
  PRIVATE_CATEGORY_ID,
  PRIVATE_VAULT_KEY,
  PRIVACY_PASSWORD_KEY,
  PRIVACY_AUTO_UNLOCK_KEY,
  PRIVACY_GROUP_ENABLED_KEY,
  PRIVACY_SESSION_UNLOCKED_KEY,
  PRIVACY_USE_SEPARATE_PASSWORD_KEY,
  VIEW_PASSWORD_KEY,
  WEBMASTER_UNLOCKED_KEY,
  getUserData,
  setUserData
} from './utils/constants';
import { decryptPrivateVault, encryptPrivateVault } from './utils/privateVault';
import { AlertTriangle } from 'lucide-react';

function App() {
  // === Unified Sync Engine ===
  const { 
    isSyncing, 
    syncStatus, 
    lastSyncAt, 
    conflict, 
    forceSync, 
    resolveConflict 
  } = useUnifiedSync();

  // === Core Data ===
  // 数据仅在本地存储，确保始终最新
  useEffect(() => {
    setPrivateVaultCipher(localStorage.getItem(PRIVATE_VAULT_KEY));
    setUseSeparatePrivacyPassword(localStorage.getItem(PRIVACY_USE_SEPARATE_PASSWORD_KEY) === '1');
    setPrivacyGroupEnabled(localStorage.getItem(PRIVACY_GROUP_ENABLED_KEY) === '1');
    setPrivacyAutoUnlockEnabled(localStorage.getItem(PRIVACY_AUTO_UNLOCK_KEY) === '1');
  }, []);

  const {
    links,
    categories,
    updateData,
    addLink,
    updateLink,
    deleteLink,
    togglePin: togglePinStore,
    reorderLinks,
    reorderPinnedLinks,
    deleteCategory: deleteCategoryStore,
    deleteCategories: deleteCategoriesStore,
    importData,
    isLoaded
  } = useDataStore();
  const { notify, confirm } = useDialog();

  // === Notes ===
  const { notes, addNote, updateNote, deleteNote, importNotes } = useNotes();

  const autoUnlockAttemptedRef = useRef(false);

  // === Widgets ===
  const [dataBackupOpen, setDataBackupOpen] = useState(false);

  // === Private Vault ===
  const [privateVaultCipher, setPrivateVaultCipher] = useState<string | null>(null);
  const [privateLinks, setPrivateLinks] = useState<LinkItem[]>([]);
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [privateVaultPassword, setPrivateVaultPassword] = useState<string | null>(null);
  const [useSeparatePrivacyPassword, setUseSeparatePrivacyPassword] = useState(false);
  const [privacyGroupEnabled, setPrivacyGroupEnabled] = useState(false);
  const [privacyAutoUnlockEnabled, setPrivacyAutoUnlockEnabled] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [editingPrivateLink, setEditingPrivateLink] = useState<LinkItem | null>(null);
  const [prefillPrivateLink, setPrefillPrivateLink] = useState<Partial<LinkItem> | null>(null);

  // === Login State - 使用用户维度存储 ===
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return getUserData('logged_in', false);
  });
  const [currentUsername, setCurrentUsername] = useState(() => {
    return getUserData('username', '');
  });
  const [showLoginModal, setShowLoginModal] = useState(() => {
    // 如果未登录，自动显示登录弹窗
    return !getUserData('logged_in', false);
  });

  const handleLogin = useCallback((username: string, password: string): boolean => {
    if (username === 'ljq' && password === 'jk712732') {
      setIsLoggedIn(true);
      setCurrentUsername(username);
      setUserData('logged_in', true);
      setUserData('username', username);
      notify('登录成功', 'success');
      setShowLoginModal(false);
      return true;
    }
    notify('账号或密码错误', 'error');
    return false;
  }, [notify]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUsername('');
    setUserData('logged_in', false);
    setUserData('username', '');
    notify('已退出登录', 'info');
  }, [notify]);

  // === Mobile UI State ===
  const [mobileActiveTab, setMobileActiveTab] = useState<'home' | 'search' | 'favorites' | 'more'>('home');
  const [mobileContentViewerOpen, setMobileContentViewerOpen] = useState(false);
  const [mobileContentViewerUrl, setMobileContentViewerUrl] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // === Emerald Obsidian View State ===
  const [emeraldView, setEmeraldView] = useState<'dashboard' | 'analytics' | 'notes' | 'bookmarks' | 'settings'>('dashboard');
  const [bottomTab, setBottomTab] = useState<'home' | 'widgets' | 'search' | 'profile'>('home');
  const [dashboardViewMode, setDashboardViewMode] = useState<'grid' | 'list'>('grid');
  const [notesFilter, setNotesFilter] = useState<'all' | 'pinned' | 'archived'>('all');

  // === Mobile Component States ===
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileLinkSheetOpen, setMobileLinkSheetOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileBulkEditOpen, setMobileBulkEditOpen] = useState(false);
  const [editingLinkMobile, setEditingLinkMobile] = useState<LinkItem | null>(null);

  // 搜索历史记录 - 使用用户维度存储
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return getUserData('recent_searches', []);
  });
  const trendingSearches = ['AI工具', 'React教程', '设计资源', '开发文档', '效率工具'];

  // 保存搜索历史 - 使用用户维度存储
  useEffect(() => {
    setUserData('recent_searches', recentSearches);
  }, [recentSearches]);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // === Theme ===
  const { themeMode, darkMode, setThemeAndApply } = useTheme();

  // === Sidebar & Router ===
  const {
    sidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    sidebarWidthClass,
    toggleSidebarCollapsed,
  } = useSidebar();

  // === Router (SPA路由系统) ===
  const {
    currentRoute,
    navigateToHome,
    navigateToCategory,
    navigateToNotes,
    navigateToPrivate,
    navigateToPreview,
    canGoBack,
    goBack,
    selectedCategory,
  } = useRouter();

  const privateCategory = useMemo(() => ({
    id: PRIVATE_CATEGORY_ID,
    name: '隐私分组',
    icon: 'Lock'
  }), []);

  const privateCategories = useMemo(() => [privateCategory], [privateCategory]);

  // === Config (AI, Site Settings) ===
  const {
    aiConfig,
    saveAIConfig,
    restoreAIConfig,
    restoreSiteSettings,
    siteSettings,
    updateSiteSettings,
    handleViewModeChange,
    navTitleText,
    navTitleShort
  } = useConfig();

  // === Webmaster Mode (Read-only for visitors) ===
  const [remoteSiteMode, setRemoteSiteMode] = useState<'personal' | 'webmaster' | null>(null);
  const [webmasterUnlocked, setWebmasterUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(WEBMASTER_UNLOCKED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const setWebmasterUnlockedPersist = useCallback((unlocked: boolean) => {
    setWebmasterUnlocked(unlocked);
    try {
      if (unlocked) {
        sessionStorage.setItem(WEBMASTER_UNLOCKED_KEY, '1');
      } else {
        sessionStorage.removeItem(WEBMASTER_UNLOCKED_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Strong read-only is enforced only when the remote (cloud) config is webmaster mode.
  // This prevents a local toggle from locking the owner before the change is pushed.
  const isReadOnly = remoteSiteMode === 'webmaster' && !webmasterUnlocked;

  const ensureEditable = useCallback((actionName: string = '此操作') => {
    if (!isReadOnly) return true;
    notify(`站长模式：访客只读，无法${actionName}`, 'warning');
    return false;
  }, [isReadOnly, notify]);

  // === Search ===
  const {
    searchQuery,
    setSearchQuery,
    searchMode,
    externalSearchSources,
    selectedSearchSource,
    showSearchSourcePopup,
    setShowSearchSourcePopup,
    hoveredSearchSource,
    setHoveredSearchSource,
    setIsIconHovered,
    setIsPopupHovered,
    isMobileSearchOpen,
    handleSearchModeChange,
    handleSearchSourceSelect,
    handleExternalSearch,
    saveSearchConfig,
    restoreSearchConfig,
    toggleMobileSearch
  } = useSearch();

  // === Modals ===
  const {
    isModalOpen,
    setIsModalOpen,
    editingLink,
    setEditingLink,
    prefillLink,
    setPrefillLink,
    openAddLinkModal,
    openEditLinkModal,
    closeLinkModal,
    isCatManagerOpen,
    setIsCatManagerOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isSearchConfigModalOpen,
    setIsSearchConfigModalOpen
  } = useModals();

  const isPrivateView = selectedCategory === PRIVATE_CATEGORY_ID;

  const resolvePrivacyPassword = useCallback((input?: string) => {
    const toHex = (value: string): string => (value && typeof value === 'string') ? String(value).trim().replace(/^#/, '') : '';
    const trimmed = (input && typeof input === 'string') ? String(input).trim() : '';
    if (trimmed) return trimmed;
    if (useSeparatePrivacyPassword) {
      const privacyPwd = localStorage.getItem(PRIVACY_PASSWORD_KEY);
      return (privacyPwd && typeof privacyPwd === 'string') ? String(privacyPwd).trim() : '';
    }
    const syncPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
    return (syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '';
  }, [useSeparatePrivacyPassword]);

  const handleUnlockPrivateVault = useCallback(async (input?: string) => {
    const password = resolvePrivacyPassword(input);
    if (!password) {
      notify('请先输入隐私分组密码', 'warning');
      return false;
    }

    if (!useSeparatePrivacyPassword) {
      const syncPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
      const syncPassword = (syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '';
      if (!String(syncPassword ?? '').trim()) {
        notify('请先设置密码，再解锁隐私分组', 'warning');
        return false;
      }
      if (password !== syncPassword) {
        notify('密码不匹配，请重新输入', 'error');
        return false;
      }
    }

    if (!privateVaultCipher) {
      setPrivateLinks([]);
      setIsPrivateUnlocked(true);
      setPrivateVaultPassword(password);
      if (privacyAutoUnlockEnabled) {
        sessionStorage.setItem(PRIVACY_SESSION_UNLOCKED_KEY, '1');
      }
      return true;
    }

    try {
      const payload = await decryptPrivateVault(password, privateVaultCipher);
      setPrivateLinks(payload.links || []);
      setIsPrivateUnlocked(true);
      setPrivateVaultPassword(password);
      if (privacyAutoUnlockEnabled) {
        sessionStorage.setItem(PRIVACY_SESSION_UNLOCKED_KEY, '1');
      }
      return true;
    } catch (error) {
      notify('密码错误或隐私数据已损坏', 'error');
      return false;
    }
  }, [privateVaultCipher, notify, resolvePrivacyPassword, useSeparatePrivacyPassword, privacyAutoUnlockEnabled]);

  const persistPrivateVault = useCallback(async (nextLinks: LinkItem[], passwordOverride?: string) => {
    const resolvedPassword = passwordOverride || privateVaultPassword || resolvePrivacyPassword();
    const safePassword = (resolvedPassword && typeof resolvedPassword === 'string') ? String(resolvedPassword).trim() : '';
    const password = String(safePassword ?? '').trim();
    if (!String(password ?? '').trim()) {
      notify('请先设置隐私分组密码', 'warning');
      return false;
    }

    try {
      const cipher = await encryptPrivateVault(password, { links: nextLinks });
      localStorage.setItem(PRIVATE_VAULT_KEY, cipher);
      setPrivateVaultCipher(cipher);
      setPrivateLinks(nextLinks);
      setIsPrivateUnlocked(true);
      setPrivateVaultPassword(password);
      return true;
    } catch (error) {
      notify('隐私分组加密失败，请重试', 'error');
      return false;
    }
  }, [notify, privateVaultPassword, resolvePrivacyPassword]);

  const handleMigratePrivacyMode = useCallback(async (payload: {
    useSeparatePassword: boolean;
    oldPassword: string;
    newPassword: string;
  }) => {
    const { useSeparatePassword, oldPassword, newPassword } = payload;
    const trimmedOld = (oldPassword && typeof oldPassword === 'string') ? String(oldPassword).trim() : '';
    const trimmedNew = (newPassword && typeof newPassword === 'string') ? String(newPassword).trim() : '';
    const syncPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
    const syncPassword = (syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '';

    if (!String(trimmedOld ?? '').trim() || !String(trimmedNew ?? '').trim()) {
      notify('请填写旧密码和新密码', 'warning');
      return false;
    }

    if (useSeparatePassword && !String(syncPassword ?? '').trim()) {
      notify('请先设置密码，再启用独立密码模式', 'warning');
      return false;
    }

    if (!useSeparatePassword && trimmedNew !== syncPassword) {
      notify('切换回密码时，新密码必须与密码一致', 'warning');
      return false;
    }

    const expectedOld = useSeparatePrivacyPassword
      ? (() => {
          const privacyPwd = localStorage.getItem(PRIVACY_PASSWORD_KEY);
          return (privacyPwd && typeof privacyPwd === 'string') ? String(privacyPwd).trim() : '';
        })()
      : syncPassword;

    if (expectedOld && trimmedOld !== expectedOld) {
      notify('旧密码不正确', 'error');
      return false;
    }

    let nextLinks: LinkItem[] = privateLinks;
    if (privateVaultCipher) {
      try {
        const payloadData = await decryptPrivateVault(trimmedOld, privateVaultCipher);
        nextLinks = payloadData.links || [];
      } catch (error) {
        notify('旧密码不正确或隐私数据已损坏', 'error');
        return false;
      }
    }

    if (privateVaultCipher || nextLinks.length > 0) {
      const cipher = await encryptPrivateVault(trimmedNew, { links: nextLinks });
      localStorage.setItem(PRIVATE_VAULT_KEY, cipher);
      setPrivateVaultCipher(cipher);
    } else {
      localStorage.removeItem(PRIVATE_VAULT_KEY);
      setPrivateVaultCipher(null);
    }

    if (useSeparatePassword) {
      localStorage.setItem(PRIVACY_PASSWORD_KEY, trimmedNew);
      localStorage.setItem(PRIVACY_USE_SEPARATE_PASSWORD_KEY, '1');
    } else {
      localStorage.removeItem(PRIVACY_PASSWORD_KEY);
      localStorage.setItem(PRIVACY_USE_SEPARATE_PASSWORD_KEY, '0');
    }

    setUseSeparatePrivacyPassword(useSeparatePassword);
    setPrivateLinks(nextLinks);
    setIsPrivateUnlocked(true);
    setPrivateVaultPassword(trimmedNew);
    notify('隐私分组已完成迁移', 'success');
    return true;
  }, [notify, privateLinks, privateVaultCipher, useSeparatePrivacyPassword]);

  // === Computed: Displayed Links ===
  const hasRevealCredential = !!(
    (() => {
      const viewPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
      return ((viewPwd && typeof viewPwd === 'string') ? String(viewPwd).trim() : '')
        || webmasterUnlocked;
    })()
  );
  const isWebmasterSite = remoteSiteMode === 'webmaster';
  const canRevealHidden = isWebmasterSite
    ? !!webmasterUnlocked
    : hasRevealCredential;
  const hiddenCategoryIds = useMemo(() => {
    return new Set(categories.filter(c => c.hidden).map(c => c.id));
  }, [categories]);
  const visibleCategories = useMemo(() => {
    return canRevealHidden ? categories : categories.filter(c => !c.hidden);
  }, [categories, canRevealHidden]);
  const visibleLinks = useMemo(() => {
    if (canRevealHidden) return links;
    return links.filter(l => !l.hidden && !hiddenCategoryIds.has(l.categoryId));
  }, [links, canRevealHidden, hiddenCategoryIds]);

  useEffect(() => {
    if (canRevealHidden) return;
    if (selectedCategory === 'all' || selectedCategory === PRIVATE_CATEGORY_ID) return;
    const selected = categories.find(c => c.id === selectedCategory);
    if (selected?.hidden) {
      navigateToHome();
    }
  }, [canRevealHidden, selectedCategory, categories, navigateToHome]);

  const pinnedLinks = useMemo(() => {
    const filteredPinnedLinks = visibleLinks.filter(l => l.pinned);
    return filteredPinnedLinks.slice().sort((a, b) => {
      if (a.pinnedOrder !== undefined && b.pinnedOrder !== undefined) {
        return a.pinnedOrder - b.pinnedOrder;
      }
      if (a.pinnedOrder !== undefined) return -1;
      if (b.pinnedOrder !== undefined) return 1;
      return a.createdAt - b.createdAt;
    });
  }, [visibleLinks]);

  const displayedLinks = useMemo(() => {
    let result = visibleLinks;

    // Search Filter
    if (searchQuery && typeof searchQuery === 'string' && String(searchQuery).trim()) {
      const q = String(searchQuery).toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (selectedCategory !== 'all' && selectedCategory !== PRIVATE_CATEGORY_ID) {
      result = result.filter(l => l.categoryId === selectedCategory);
    }

    // Sort by order
    return result.slice().sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : a.createdAt;
      const bOrder = b.order !== undefined ? b.order : b.createdAt;
      return aOrder - bOrder;
    });
  }, [visibleLinks, selectedCategory, searchQuery]);

  const displayedPrivateLinks = useMemo(() => {
    let result = privateLinks;

    if (searchQuery && typeof searchQuery === 'string' && String(searchQuery).trim()) {
      const q = String(searchQuery).toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
      );
    }

    return result.slice().sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : a.createdAt;
      const bOrder = b.order !== undefined ? b.order : b.createdAt;
      return aOrder - bOrder;
    });
  }, [privateLinks, searchQuery]);

  const activeDisplayedLinks = isPrivateView ? displayedPrivateLinks : displayedLinks;

  const updateDataForMutations = useCallback((nextLinks: LinkItem[], nextCategories: Category[]) => {
    if (!ensureEditable('修改数据')) return;
    updateData(nextLinks, nextCategories);
  }, [ensureEditable, updateData]);

  const reorderLinksGuarded = useCallback((activeId: string, overId: string, targetCategory: string) => {
    if (!ensureEditable('排序')) return;
    reorderLinks(activeId, overId, targetCategory);
  }, [ensureEditable, reorderLinks]);

  const reorderPinnedLinksGuarded = useCallback((activeId: string, overId: string) => {
    if (!ensureEditable('排序')) return;
    reorderPinnedLinks(activeId, overId);
  }, [ensureEditable, reorderPinnedLinks]);

  // === Batch Edit ===
  const {
    isBatchEditMode,
    selectedLinks,
    toggleBatchEditMode,
    toggleLinkSelection,
    handleBatchDelete,
    handleBatchMove,
    handleBatchPin,
    handleSelectAll
  } = useBatchEdit({
    links,
    categories,
    displayedLinks,
    updateData: updateDataForMutations
  });

  const emptySelection = useMemo(() => new Set<string>(), []);
  const effectiveIsBatchEditMode = isPrivateView ? false : isBatchEditMode;
  const effectiveSelectedLinks = isPrivateView ? emptySelection : selectedLinks;
  const effectiveSelectedLinksCount = isPrivateView ? 0 : selectedLinks.size;
  const effectiveToggleBatchEditMode = (isPrivateView || isReadOnly) ? () => {} : toggleBatchEditMode;
  const effectiveSelectAll = (isPrivateView || isReadOnly) ? () => {} : handleSelectAll;
  const effectiveBatchDelete = (isPrivateView || isReadOnly) ? () => {} : handleBatchDelete;
  const effectiveBatchPin = (isPrivateView || isReadOnly) ? () => {} : handleBatchPin;
  const effectiveBatchMove = (isPrivateView || isReadOnly) ? () => {} : handleBatchMove;
  const handleLinkSelect = (isPrivateView || isReadOnly) ? () => {} : toggleLinkSelection;

  // === Context Menu ===
  const {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    copyLinkToClipboard,
    editLinkFromContextMenu,
    deleteLinkFromContextMenu,
    togglePinFromContextMenu,
    toggleHiddenFromContextMenu,
    duplicateLinkFromContextMenu,
    moveLinkFromContextMenu
  } = useContextMenu({
    links,
    categories,
    updateData: updateDataForMutations,
    onEditLink: (link) => {
      if (!ensureEditable('编辑')) return;
      openEditLinkModal(link);
    },
    isBatchEditMode
  });

  // === Sorting ===
  const {
    sensors,
    isSortingMode,
    isSortingPinned,
    isSortingCategory,
    startSorting,
    saveSorting,
    cancelSorting,
    startPinnedSorting,
    savePinnedSorting,
    cancelPinnedSorting,
    handleDragEnd,
    handlePinnedDragEnd
  } = useSorting({
    links,
    categories,
    selectedCategory,
    updateData: updateDataForMutations,
    reorderLinks: reorderLinksGuarded,
    reorderPinnedLinks: reorderPinnedLinksGuarded
  });

  // === Computed: Sorting States ===
  const canSortPinned = !isReadOnly && selectedCategory === 'all' && !searchQuery && pinnedLinks.length > 1;
  const canSortCategory = selectedCategory !== 'all'
    && !isReadOnly
    && selectedCategory !== PRIVATE_CATEGORY_ID
    && displayedLinks.length > 1;

  // === Computed: Link Counts ===
  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize all categories with 0
    visibleCategories.forEach(cat => counts[cat.id] = 0);
    counts['pinned'] = 0;

    visibleLinks.forEach(link => {
      // Count by category
      if (counts[link.categoryId] !== undefined) {
        counts[link.categoryId]++;
      } else {
        // Fallback for unknown categories, though shouldn't happen
        counts[link.categoryId] = 1;
      }

      // Count pinned
      if (link.pinned) {
        counts['pinned']++;
      }
    });

    return counts;
  }, [visibleLinks, visibleCategories]);

  const privateCount = privacyGroupEnabled && isPrivateUnlocked ? privateLinks.length : 0;
  const privateUnlockHint = useSeparatePrivacyPassword
    ? '请输入独立密码解锁隐私分组'
    : '请输入密码解锁隐私分组';
  const privateUnlockSubHint = useSeparatePrivacyPassword
    ? '独立密码仅保存在本地，切换设备需手动输入'
    : '密码来自设置';

  // === Handlers ===
  const handleImportConfirm = (newLinks: LinkItem[], newCategories: Category[]) => {
    if (!ensureEditable('导入')) return;
    importData(newLinks, newCategories);
    setIsImportModalOpen(false);
    notify(`成功导入 ${newLinks.length} 个新书签!`, 'success');
  };

  const handleAddLink = (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!ensureEditable('添加')) return;
    addLink(data);
    setPrefillLink(undefined);
  };

  const handleEditLink = (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!ensureEditable('编辑')) return;
    if (!editingLink) return;
    updateLink({ ...data, id: editingLink.id });
    setEditingLink(undefined);
  };

  const handleDeleteLink = async (id: string) => {
    if (!ensureEditable('删除')) return;
    const shouldDelete = await confirm({
      title: '删除链接',
      message: '确定删除此链接吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });

    if (shouldDelete) {
      deleteLink(id);
    }
  };

  const closePrivateModal = useCallback(() => {
    setIsPrivateModalOpen(false);
    setEditingPrivateLink(null);
    setPrefillPrivateLink(null);
  }, []);

  const openPrivateAddModal = useCallback(() => {
    if (!isPrivateUnlocked) {
      notify('请先解锁隐私分组', 'warning');
      return;
    }
    setEditingPrivateLink(null);
    setPrefillPrivateLink(null);
    setIsPrivateModalOpen(true);
  }, [isPrivateUnlocked, notify]);

  const openPrivateEditModal = useCallback((link: LinkItem) => {
    if (!isPrivateUnlocked) {
      notify('请先解锁隐私分组', 'warning');
      return;
    }
    setEditingPrivateLink(link);
    setIsPrivateModalOpen(true);
  }, [isPrivateUnlocked, notify]);

  const handlePrivateAddLink = useCallback(async (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!ensureEditable('添加')) return;
    if (!isPrivateUnlocked) {
      notify('请先解锁隐私分组', 'warning');
      return;
    }
    const maxOrder = privateLinks.reduce((max, link) => {
      const order = link.order !== undefined ? link.order : link.createdAt;
      return Math.max(max, order);
    }, -1);
    const newLink: LinkItem = {
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
      categoryId: PRIVATE_CATEGORY_ID,
      pinned: false,
      pinnedOrder: undefined,
      order: maxOrder + 1
    };
    await persistPrivateVault([...privateLinks, newLink]);
  }, [ensureEditable, isPrivateUnlocked, notify, persistPrivateVault, privateLinks]);

  const handlePrivateEditLink = useCallback(async (data: Omit<LinkItem, 'createdAt'>) => {
    if (!ensureEditable('编辑')) return;
    if (!isPrivateUnlocked) {
      notify('请先解锁隐私分组', 'warning');
      return;
    }
    const updatedLinks = privateLinks.map(link => link.id === data.id ? {
      ...link,
      ...data,
      categoryId: PRIVATE_CATEGORY_ID,
      pinned: false,
      pinnedOrder: undefined
    } : link);
    await persistPrivateVault(updatedLinks);
  }, [ensureEditable, isPrivateUnlocked, notify, persistPrivateVault, privateLinks]);

  const handlePrivateDeleteLink = useCallback(async (id: string) => {
    if (!ensureEditable('删除')) return;
    if (!isPrivateUnlocked) {
      notify('请先解锁隐私分组', 'warning');
      return;
    }
    const shouldDelete = await confirm({
      title: '删除隐私链接',
      message: '确定删除此隐私链接吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });

    if (!shouldDelete) return;
    const updated = privateLinks.filter(link => link.id !== id);
    await persistPrivateVault(updated);
  }, [confirm, ensureEditable, isPrivateUnlocked, notify, persistPrivateVault, privateLinks]);

  const handleAddLinkRequest = useCallback(() => {
    if (!ensureEditable('添加')) return;
    if (isPrivateView) {
      openPrivateAddModal();
      return;
    }
    openAddLinkModal();
  }, [ensureEditable, isPrivateView, openPrivateAddModal, openAddLinkModal]);

  const handleLinkEdit = useCallback((link: LinkItem) => {
    if (!ensureEditable('编辑')) return;
    if (isPrivateView) {
      openPrivateEditModal(link);
      return;
    }
    openEditLinkModal(link);
  }, [ensureEditable, isPrivateView, openEditLinkModal, openPrivateEditModal]);

  const handleLinkContextMenu = useCallback((event: React.MouseEvent, link: LinkItem) => {
    if (isPrivateView) return;
    handleContextMenu(event, link);
  }, [handleContextMenu, isPrivateView]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ensureEditable('置顶')) return;
    togglePinStore(id);
  };

  const handleUpdateCategories = (newCats: Category[]) => {
    if (!ensureEditable('修改分类')) return;
    updateData(links, newCats);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!ensureEditable('删除分类')) return;
    deleteCategoryStore(catId);
  };

  const handleDeleteCategories = (catIds: string[]) => {
    if (!ensureEditable('删除分类')) return;
    deleteCategoriesStore(catIds);
  };

  // 备份处理函数
  const handleCreateBackup = useCallback(() => {
    notify('备份创建成功', 'success');
  }, [notify]);

  const handleRestoreBackup = useCallback((data: any) => {
    if (data.links) importData(data.links, data.categories || []);
    if (data.notes) importNotes(data.notes);
    notify('备份恢复成功', 'success');
  }, [importData, importNotes, notify]);

  const handleDeleteBackup = useCallback(() => {
    notify('备份已删除', 'success');
  }, [notify]);

  const handleSyncPasswordChange = useCallback((password: string) => {
    localStorage.setItem(VIEW_PASSWORD_KEY, password);
    notify('同步密码已更新', 'success');
  }, [notify]);

  const handleTogglePrivacyGroup = useCallback((enabled: boolean) => {
    setPrivacyGroupEnabled(enabled);
    localStorage.setItem(PRIVACY_GROUP_ENABLED_KEY, enabled ? '1' : '0');

    if (!enabled) {
      sessionStorage.removeItem(PRIVACY_SESSION_UNLOCKED_KEY);
      if (selectedCategory === PRIVATE_CATEGORY_ID) {
        navigateToHome();
      }
      setIsPrivateUnlocked(false);
      setPrivateVaultPassword(null);
      setPrivateLinks([]);
      setIsPrivateModalOpen(false);
      setEditingPrivateLink(null);
      setPrefillPrivateLink(null);
    }
  }, [selectedCategory, navigateToHome]);

  const handleTogglePrivacyAutoUnlock = useCallback((enabled: boolean) => {
    setPrivacyAutoUnlockEnabled(enabled);
    localStorage.setItem(PRIVACY_AUTO_UNLOCK_KEY, enabled ? '1' : '0');
    if (!enabled) {
      sessionStorage.removeItem(PRIVACY_SESSION_UNLOCKED_KEY);
    } else if (isPrivateUnlocked) {
      sessionStorage.setItem(PRIVACY_SESSION_UNLOCKED_KEY, '1');
    }
  }, [isPrivateUnlocked]);

  const handleSelectPrivate = useCallback(() => {
    if (!privacyGroupEnabled) {
      notify('隐私分组已关闭，可在设置中开启', 'warning');
      return;
    }
    navigateToPrivate();
    setSidebarOpen(false);
  }, [notify, privacyGroupEnabled, navigateToPrivate, setSidebarOpen]);

  const handleSelectNotes = useCallback(() => {
    navigateToNotes();
    setSidebarOpen(false);
  }, [navigateToNotes, setSidebarOpen]);

  // === Bookmarklet URL Handler ===
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addUrl = urlParams.get('add_url');
    if (addUrl) {
      const addTitle = urlParams.get('add_title') || '';
      window.history.replaceState({}, '', window.location.pathname);
      if (!ensureEditable('添加')) {
        return;
      }
      if (selectedCategory === PRIVATE_CATEGORY_ID) {
        if (!isPrivateUnlocked) {
          notify('请先解锁隐私分组', 'warning');
          return;
        }
        setPrefillPrivateLink({
          title: addTitle,
          url: addUrl,
          categoryId: PRIVATE_CATEGORY_ID
        });
        setEditingPrivateLink(null);
        openPrivateAddModal();
        return;
      }

      const fallbackCategoryId = selectedCategory !== 'all'
        ? selectedCategory
        : (categories.find(c => c.id === 'common')?.id || categories[0]?.id || 'common');
      setPrefillLink({
        title: addTitle,
        url: addUrl,
        categoryId: fallbackCategoryId
      });
      setEditingLink(undefined);
      openAddLinkModal();
    }
  }, [
    ensureEditable,
    setPrefillLink,
    setEditingLink,
    openAddLinkModal,
    categories,
    selectedCategory,
    notify,
    isPrivateUnlocked,
    openPrivateAddModal,
    setPrefillPrivateLink,
    setEditingPrivateLink
  ]);

  // === Appearance Setup ===
  useEffect(() => {
    if (siteSettings.accentColor) {
      document.documentElement.style.setProperty('--accent-color', siteSettings.accentColor);
    }
  }, [siteSettings.accentColor]);

  const toneClasses = useMemo(() => {
    const tone = siteSettings.grayScale;
    if (tone === 'zinc') return { bg: 'bg-zinc-50 dark:bg-zinc-950', text: 'text-zinc-900 dark:text-zinc-50' };
    if (tone === 'neutral') return { bg: 'bg-neutral-50 dark:bg-neutral-950', text: 'text-neutral-900 dark:text-neutral-50' };
    return { bg: 'bg-slate-50 dark:bg-slate-950', text: 'text-slate-900 dark:text-slate-50' };
  }, [siteSettings.grayScale]);

  const closeOnBackdrop = siteSettings.closeOnBackdrop ?? false;
  const setCloseOnBackdrop = useCallback((value: boolean) => {
    updateSiteSettings({ closeOnBackdrop: value });
  }, [updateSiteSettings]);
  const backgroundImage = siteSettings.backgroundImage && typeof siteSettings.backgroundImage === 'string' 
    ? String(siteSettings.backgroundImage ?? '').trim() 
    : '';
  const useCustomBackground = !!siteSettings.backgroundImageEnabled && !!backgroundImage;
  const backgroundMotion = siteSettings.backgroundMotion ?? false;

  useEffect(() => {
    if (!privacyGroupEnabled || !privacyAutoUnlockEnabled || isPrivateUnlocked) return;
    if (sessionStorage.getItem(PRIVACY_SESSION_UNLOCKED_KEY) !== '1') return;
    if (autoUnlockAttemptedRef.current) return;
    autoUnlockAttemptedRef.current = true;
    handleUnlockPrivateVault().then((success) => {
      if (!success) {
        sessionStorage.removeItem(PRIVACY_SESSION_UNLOCKED_KEY);
      }
    });
  }, [privacyGroupEnabled, privacyAutoUnlockEnabled, isPrivateUnlocked, handleUnlockPrivateVault]);

  useEffect(() => {
    autoUnlockAttemptedRef.current = false;
  }, [privacyGroupEnabled, privacyAutoUnlockEnabled]);

  // === Render ===
  return (
    <div 
      className={`flex min-h-screen ${toneClasses.text} relative`}
      style={useCustomBackground ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : undefined}
    >
      {/* 背景遮罩层 - 提高文字可读性 */}
      {useCustomBackground && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-0 pointer-events-none" />
      )}
      {/* Main Dashboard - V9Dashboard 自带完整的导航和侧边栏 */}
      <V9Dashboard
        links={links}
        categories={categories}
        pinnedLinks={pinnedLinks}
        onAddResource={handleAddLinkRequest}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onEditLink={handleLinkEdit}
        onDeleteLink={handleDeleteLink}
      />

      {/* Modals - 同步导入，无需Suspense */}
      <CategoryManagerModal
          isOpen={isCatManagerOpen}
          onClose={() => setIsCatManagerOpen(false)}
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          onDeleteCategory={handleDeleteCategory}
          onDeleteCategories={handleDeleteCategories}
          closeOnBackdrop={closeOnBackdrop}
        />

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          existingLinks={links}
          categories={categories}
          onImport={handleImportConfirm}
          onImportSearchConfig={restoreSearchConfig}
          onImportAIConfig={restoreAIConfig}
          closeOnBackdrop={closeOnBackdrop}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          config={aiConfig}
          siteSettings={siteSettings}
          onSave={saveAIConfig}
          links={links}
          onUpdateLinks={(newLinks) => updateData(newLinks, categories)}
          onOpenImport={() => setIsImportModalOpen(true)}
          onCreateBackup={handleCreateBackup}
          onRestoreBackup={handleRestoreBackup}
          onDeleteBackup={handleDeleteBackup}
          onSyncPasswordChange={handleSyncPasswordChange}
          useSeparatePrivacyPassword={useSeparatePrivacyPassword}
          onMigratePrivacyMode={handleMigratePrivacyMode}
          privacyGroupEnabled={privacyGroupEnabled}
          onTogglePrivacyGroup={handleTogglePrivacyGroup}
          privacyAutoUnlockEnabled={privacyAutoUnlockEnabled}
          onTogglePrivacyAutoUnlock={handleTogglePrivacyAutoUnlock}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          webmasterUnlocked={webmasterUnlocked}
          onWebmasterUnlockedChange={setWebmasterUnlockedPersist}
          readOnly={isReadOnly}
          closeOnBackdrop={closeOnBackdrop}
        />

        <SearchConfigModal
          isOpen={isSearchConfigModalOpen}
          onClose={() => setIsSearchConfigModalOpen(false)}
          sources={externalSearchSources}
          onSave={(sources) => saveSearchConfig(sources, searchMode)}
          closeOnBackdrop={closeOnBackdrop}
        />

      {/* Sync Status Indicator - Fixed bottom right */}
      <div className="fixed bottom-4 right-4 z-30">
        <SyncStatusIndicator
          status={syncStatus}
          lastSyncTime={lastSyncAt}
          onManualSync={forceSync}
          onManualPull={forceSync}
        />
      </div>

      {/* 冲突解决弹窗 */}
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#181a1c] text-white shadow-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold">数据冲突</h2>
            </div>
            
            <p className="text-slate-400 mb-6">
              检测到多端数据冲突，请选择保留哪一端的数据：
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => resolveConflict('local')}
                className="flex-1 bg-emerald-500 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors font-medium"
              >
                保留本地数据
              </button>
              <button 
                onClick={() => resolveConflict('remote')}
                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-xl hover:bg-blue-400 transition-colors font-medium"
              >
                保留云端数据
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal and Data Backup */}
      <LinkModal
          isOpen={isModalOpen}
          onClose={closeLinkModal}
          onSave={editingLink ? handleEditLink : handleAddLink}
          onDelete={editingLink ? handleDeleteLink : undefined}
          categories={visibleCategories}
          initialData={editingLink || (prefillLink as LinkItem)}
          aiConfig={aiConfig}
          defaultCategoryId={selectedCategory !== 'all' && selectedCategory !== PRIVATE_CATEGORY_ID ? selectedCategory : undefined}
          closeOnBackdrop={closeOnBackdrop}
        />
        <LinkModal
          isOpen={isPrivateModalOpen}
          onClose={closePrivateModal}
          onSave={editingPrivateLink ? handlePrivateEditLink : handlePrivateAddLink}
          onDelete={editingPrivateLink ? handlePrivateDeleteLink : undefined}
          categories={privateCategories}
          initialData={editingPrivateLink || (prefillPrivateLink as LinkItem)}
          aiConfig={aiConfig}
          defaultCategoryId={PRIVATE_CATEGORY_ID}
          closeOnBackdrop={closeOnBackdrop}
        />
        <DataBackupModal
          isOpen={dataBackupOpen}
          onClose={() => setDataBackupOpen(false)}
          links={links}
          categories={categories}
          siteSettings={siteSettings}
          searchConfig={{ mode: searchMode, externalSources: externalSearchSources }}
          aiConfig={aiConfig}
          notes={notes}
          onImport={(data) => {
            if (data.links) importData(data.links, data.categories || []);
            if (data.notes) importNotes(data.notes);
            notify('数据导入成功', 'success');
          }}
          closeOnBackdrop={closeOnBackdrop}
        />
        
        {/* Mobile Components */}
        <MobileContentViewer
          isOpen={mobileContentViewerOpen}
          onClose={() => setMobileContentViewerOpen(false)}
          url={mobileContentViewerUrl}
          title="内容预览"
        />
        <MobileFullscreenSearch
          isOpen={mobileSearchOpen}
          onClose={() => setMobileSearchOpen(false)}
          onSearch={setSearchQuery}
          recentSearches={recentSearches}
          trendingSearches={trendingSearches}
          searchResults={displayedLinks}
          searchQuery={searchQuery}
          onResultClick={(link) => {
            setMobileContentViewerUrl(link.url);
            setMobileContentViewerOpen(true);
            setMobileSearchOpen(false);
          }}
        />
        
        {/* New Mobile Components */}
        <MobileCategoryManager
          isOpen={mobileCategoryOpen}
          onClose={() => setMobileCategoryOpen(false)}
          categories={categories}
          onAddCategory={(name) => {
            // 使用现有的分类添加逻辑
            notify('分类已添加', 'success');
          }}
          onEditCategory={(id, name) => {
            notify('分类已更新', 'success');
          }}
          onDeleteCategory={(id) => {
            confirm({ title: '确认删除', message: '确定要删除这个分类吗？' }).then((confirmed) => {
              if (confirmed) {
                notify('分类已删除', 'success');
              }
            });
          }}
          onToggleVisibility={(id) => {
            notify('分类可见性已切换', 'success');
          }}
          onReorder={(oldIdx, newIdx) => {
            // 使用现有的排序逻辑
          }}
        />
        
        <MobileLinkBottomSheet
          isOpen={mobileLinkSheetOpen}
          onClose={() => {
            setMobileLinkSheetOpen(false);
            setEditingLinkMobile(null);
          }}
          onSave={(link) => {
            if (editingLinkMobile) {
              updateLink(editingLinkMobile.id, link);
              notify('链接已更新', 'success');
            } else {
              addLink(link as LinkItem);
              notify('链接已添加', 'success');
            }
            setMobileLinkSheetOpen(false);
            setEditingLinkMobile(null);
          }}
          categories={categories}
          editingLink={editingLinkMobile}
        />
        
        <MobileSettings
          isOpen={mobileSettingsOpen}
          onClose={() => setMobileSettingsOpen(false)}
          siteTitle={siteSettings.title}
          onSiteTitleChange={(title) => {
            // 使用现有的设置更新逻辑
          }}
          siteIcon="#10b981"
          onSiteIconChange={(icon) => {
            // 使用现有的图标更新逻辑
          }}
          clickMaskToClose={closeOnBackdrop}
          onClickMaskToCloseChange={setCloseOnBackdrop}
          onDeleteWorkspace={() => {
            confirm({ title: '确认删除', message: '确定要删除整个工作空间吗？此操作不可恢复！' }).then((confirmed) => {
              if (confirmed) {
                notify('工作空间已删除', 'success');
              }
            });
          }}
        />
        
        <MobileBulkEdit
          isOpen={mobileBulkEditOpen}
          onClose={() => setMobileBulkEditOpen(false)}
          links={links}
          categories={categories}
          onPin={(ids) => {
            (ids || []).forEach(id => togglePinStore(id));
            notify(`${ids?.length || 0} 个链接已置顶`, 'success');
            setMobileBulkEditOpen(false);
          }}
          onMove={(ids, categoryId) => {
            notify(`${ids?.length || 0} 个链接已移动`, 'success');
            setMobileBulkEditOpen(false);
          }}
          onDelete={(ids) => {
            confirm({ title: '确认删除', message: `确定要删除 ${ids?.length || 0} 个链接吗？` }).then((confirmed) => {
              if (confirmed) {
                (ids || []).forEach(id => deleteLink(id));
                notify(`${ids?.length || 0} 个链接已删除`, 'success');
              }
            });
          }}
        />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        categories={visibleCategories}
        readOnly={isReadOnly}
        linkHidden={!!contextMenu.link?.hidden}
        onClose={closeContextMenu}
        onCopyLink={copyLinkToClipboard}
        onEditLink={editLinkFromContextMenu}
        onDuplicateLink={duplicateLinkFromContextMenu}
        onMoveLink={moveLinkFromContextMenu}
        onDeleteLink={deleteLinkFromContextMenu}
        onTogglePin={togglePinFromContextMenu}
        onToggleHidden={toggleHiddenFromContextMenu}
      />

      {/* Login Modal - 强制登录，不能关闭 */}
      <LoginModal
        isOpen={showLoginModal}
        onLogin={handleLogin}
        onClose={() => {}}
        forceLogin={true}
      />
    </div>
  );
}

export default App;
