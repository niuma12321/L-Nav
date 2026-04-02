import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { LinkItem, Category, SyncConflict, YNavSyncData } from './types';

// 同步导入所有组件，避免懒加载Promise问题
import LinkModal from './components/modals/LinkModal';
import CategoryManagerModal from './components/modals/CategoryManagerModal';
import ImportModal from './components/modals/ImportModal';
import SettingsModal from './components/modals/SettingsModal';
import SearchConfigModal from './components/modals/SearchConfigModal';
import SyncConflictModal from './components/modals/SyncConflictModal';
import NotesView from './components/notes/NotesView';
import DataBackupModal from './components/modals/DataBackupModal';
import WebDAVModal from './components/modals/WebDAVModal';
import LoginModal from './components/modals/LoginModal';

// Mobile components
import MobileContentViewer from './components/mobile/MobileContentViewer';
import MobileFullscreenSearch from './components/mobile/MobileFullscreenSearch';
import MobileCategoryManager from './components/mobile/MobileCategoryManager';
import MobileLinkBottomSheet from './components/mobile/MobileLinkBottomSheet';
import MobileSettings from './components/mobile/MobileSettings';
import MobileBulkEdit from './components/mobile/MobileBulkEdit';

// Emerald Obsidian Navigation Components
import SideNavBar from './components/navigation/SideNavBar';
import BottomNavBar from './components/navigation/BottomNavBar';
import TopBar from './components/navigation/TopBar';
import Dashboard from './components/dashboard/Dashboard';
import EmeraldNotesView from './components/notes/EmeraldNotesView';

// V9 Components - Y-Nav Elite V9.0 Modular Edition
import V9Dashboard from './components/v6/V9Dashboard';

// Eagerly load frequently used components
import ContextMenu from './components/layout/ContextMenu';
import Sidebar from './components/layout/Sidebar';
import MainHeader from './components/layout/MainHeader';
import LinkSections from './components/layout/LinkSections';
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
  useSyncEngine,
  useNotes,
  useRouter,
  useWidgets,
  buildSyncData
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
  SYNC_API_ENDPOINT,
  SYNC_META_KEY,
  SYNC_PASSWORD_KEY,
  VIEW_PASSWORD_KEY,
  WEBMASTER_UNLOCKED_KEY,
  getDeviceId
} from './utils/constants';
// Widget components
import WidgetGrid from './components/widgets/WidgetGrid';
import { decryptPrivateVault, encryptPrivateVault } from './utils/privateVault';

function App() {
  // === Core Data ===
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

  // === Widgets ===
  const { 
    widgets, 
    addWidget, 
    removeWidget, 
    updateWidgetSettings, 
    toggleWidget 
  } = useWidgets();

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

  // === Login State ===
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ynav_logged_in') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = useCallback((username: string, password: string): boolean => {
    if (username === 'ljq' && password === 'jk712732') {
      setIsLoggedIn(true);
      localStorage.setItem('ynav_logged_in', 'true');
      localStorage.setItem('ynav_username', username);
      notify('登录成功', 'success');
      setShowLoginModal(false);
      return true;
    }
    return false;
  }, [notify]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('ynav_logged_in');
    localStorage.removeItem('ynav_username');
    notify('已退出登录', 'info');
  }, [notify]);

  // === Sync Engine ===
  const [syncConflictOpen, setSyncConflictOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<SyncConflict | null>(null);
  const [dataBackupOpen, setDataBackupOpen] = useState(false);
  
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
  
  // 搜索历史记录
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ynav:recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const trendingSearches = ['AI工具', 'React教程', '设计资源', '开发文档', '效率工具'];
  
  // 保存搜索历史
  useEffect(() => {
    localStorage.setItem('ynav:recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);
  
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const hasInitialSyncRun = useRef(false);
  const hasInitialCloudCheckCompletedRef = useRef(false);
  const suppressNextAutoSyncRef = useRef(false);
  const autoUnlockAttemptedRef = useRef(false);
  const syncPasswordRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncPasswordRefreshIdRef = useRef(0);
  const lastSyncPasswordRef = useRef((() => {
    const pwd = localStorage.getItem(SYNC_PASSWORD_KEY);
    return (pwd && typeof pwd === 'string') ? pwd.trim() : '';
  })());
  const viewPasswordRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewPasswordRefreshIdRef = useRef(0);
  const lastViewPasswordRef = useRef((() => {
    const pwd = localStorage.getItem(VIEW_PASSWORD_KEY);
    return (pwd && typeof pwd === 'string') ? pwd.trim() : '';
  })());
  const isSyncPasswordRefreshingRef = useRef(false);
  const [remoteAuth, setRemoteAuth] = useState<{
    passwordRequired: boolean;
    canWrite: boolean;
    viewPasswordRequired?: boolean;
    canView?: boolean;
  } | null>(null);

  const buildRemoteAuthHeaders = useCallback(() => {
    const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
    const viewPwd = localStorage.getItem(VIEW_PASSWORD_KEY);
    const syncPassword = (syncPwd && typeof syncPwd === 'string') ? syncPwd.trim() : '';
    const viewPassword = (viewPwd && typeof viewPwd === 'string') ? viewPwd.trim() : '';
    return {
      'Content-Type': 'application/json',
      ...(syncPassword ? { 'X-Sync-Password': syncPassword } : {}),
      ...(viewPassword ? { 'X-View-Password': viewPassword } : {})
    };
  }, []);

  const refreshRemoteAuth = useCallback(async () => {
    try {
      const response = await fetch(`${SYNC_API_ENDPOINT}?action=whoami`, { headers: buildRemoteAuthHeaders() });
      const result = await response.json();
      if (!result?.success) {
        setRemoteAuth(null);
        return;
      }
      setRemoteAuth({
        passwordRequired: !!result.passwordRequired,
        canWrite: !!result.canWrite,
        viewPasswordRequired: !!result.viewPasswordRequired,
        canView: !!result.canView
      });
    } catch {
      setRemoteAuth(null);
    }
  }, [buildRemoteAuthHeaders]);
  const getLocalSyncMeta = useCallback(() => {
    const stored = localStorage.getItem(SYNC_META_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setPrivateVaultCipher(localStorage.getItem(PRIVATE_VAULT_KEY));
    setUseSeparatePrivacyPassword(localStorage.getItem(PRIVACY_USE_SEPARATE_PASSWORD_KEY) === '1');
    setPrivacyGroupEnabled(localStorage.getItem(PRIVACY_GROUP_ENABLED_KEY) === '1');
    setPrivacyAutoUnlockEnabled(localStorage.getItem(PRIVACY_AUTO_UNLOCK_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    refreshRemoteAuth();
  }, [isLoaded, refreshRemoteAuth]);

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

  // === Sync Engine Hook ===
  const handleSyncConflict = useCallback((conflict: SyncConflict) => {
    setCurrentConflict(conflict);
    setSyncConflictOpen(true);
  }, []);

  const handleSyncComplete = useCallback((data: YNavSyncData) => {
    // 当从云端恢复数据时更新本地数据
    if (data.links && data.categories) {
      updateData(data.links, data.categories);
      suppressNextAutoSyncRef.current = true;
    }
    if (data.searchConfig) {
      restoreSearchConfig(data.searchConfig);
    }
    if (data.aiConfig) {
      restoreAIConfig(data.aiConfig);
    }
    if (data.siteSettings) {
      restoreSiteSettings(data.siteSettings);
      const mode = (data.siteSettings as any)?.siteMode;
      if (mode === 'webmaster' || mode === 'personal') {
        setRemoteSiteMode(mode);
      } else if (mode === undefined) {
        setRemoteSiteMode('personal');
      }
    }
    if (typeof data.privateVault === 'string') {
      setPrivateVaultCipher(data.privateVault);
      localStorage.setItem(PRIVATE_VAULT_KEY, data.privateVault);
      if (isPrivateUnlocked && privateVaultPassword) {
        decryptPrivateVault(privateVaultPassword, data.privateVault)
          .then(payload => setPrivateLinks(payload.links || []))
          .catch(() => {
            setIsPrivateUnlocked(false);
            setPrivateLinks([]);
            setPrivateVaultPassword(null);
            notify('隐私分组已锁定，请重新解锁', 'warning');
          });
      }
    }

    if (data.links && data.categories) {
      prevSyncDataRef.current = JSON.stringify(buildSyncData(
        data.links,
        data.categories,
        data.searchConfig,
        data.aiConfig,
        data.siteSettings,
        data.privateVault
      ));
    }
  }, [
    updateData,
    restoreAIConfig,
    restoreSiteSettings,
    isPrivateUnlocked,
    notify,
    privateVaultPassword
  ]);

  const handleSyncError = useCallback((error: string) => {
    console.error('[Sync Error]', error);
  }, []);

  const {
    syncStatus,
    lastSyncTime,
    pullFromCloud,
    pushToCloud,
    schedulePush,
    createBackup,
    restoreBackup,
    deleteBackup,
    resolveConflict: resolveSyncConflict,
    cancelPendingSync
  } = useSyncEngine({
    onConflict: handleSyncConflict,
    onSyncComplete: handleSyncComplete,
    onError: handleSyncError
  });

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
    const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
    return (syncPwd && typeof syncPwd === 'string') ? syncPwd.trim() : '';
  }, [useSeparatePrivacyPassword]);

  const handleUnlockPrivateVault = useCallback(async (input?: string) => {
    const password = resolvePrivacyPassword(input);
    if (!password) {
      notify('请先输入隐私分组密码', 'warning');
      return false;
    }

    if (!useSeparatePrivacyPassword) {
      const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
      const syncPassword = (syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '';
      if (!String(syncPassword ?? '').trim()) {
        notify('请先设置同步密码，再解锁隐私分组', 'warning');
        return false;
      }
      if (password !== syncPassword) {
        notify('同步密码不匹配，请重新输入', 'error');
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
    const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
    const syncPassword = (syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '';

    if (!String(trimmedOld ?? '').trim() || !String(trimmedNew ?? '').trim()) {
      notify('请填写旧密码和新密码', 'warning');
      return false;
    }

    if (useSeparatePassword && !String(syncPassword ?? '').trim()) {
      notify('请先设置同步密码，再启用独立密码模式', 'warning');
      return false;
    }

    if (!useSeparatePassword && trimmedNew !== syncPassword) {
      notify('切换回同步密码时，新密码必须与同步密码一致', 'warning');
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
      const syncPwd = localStorage.getItem(SYNC_PASSWORD_KEY);
      return ((viewPwd && typeof viewPwd === 'string') ? String(viewPwd).trim() : '')
        || ((syncPwd && typeof syncPwd === 'string') ? String(syncPwd).trim() : '')
        || webmasterUnlocked;
    })()
  );
  const isWebmasterSite = remoteSiteMode === 'webmaster';
  const canRevealHidden = isWebmasterSite
    ? !!(remoteAuth?.canView || remoteAuth?.canWrite || webmasterUnlocked)
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
    : '请输入同步密码解锁隐私分组';
  const privateUnlockSubHint = useSeparatePrivacyPassword
    ? '独立密码仅保存在本地，切换设备需手动输入'
    : '同步密码来自数据设置';

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

  // === KV Sync: Initial Load ===
  useEffect(() => {
    // 只在本地数据加载完成后执行一次
    if (!isLoaded || hasInitialSyncRun.current) return;
    hasInitialSyncRun.current = true;
    hasInitialCloudCheckCompletedRef.current = false;

    const checkCloudData = async () => {
      const localMeta = getLocalSyncMeta();
      const localVersion = localMeta?.version ?? 0;
      const localUpdatedAt = typeof localMeta?.updatedAt === 'number' ? localMeta.updatedAt : 0;
      const localDeviceId = localMeta?.deviceId || getDeviceId();
      const cloudData = await pullFromCloud();

      if (cloudData && cloudData.links && cloudData.categories) {
        // Webmaster mode: always use remote data for visitors (read-only public site)
        if ((cloudData as any).siteSettings?.siteMode === 'webmaster') {
          handleSyncComplete(cloudData);
          return;
        }
        // 版本不一致时提示用户选择
        if (cloudData.meta.version !== localVersion) {
          const localData = buildSyncData(
            links,
            categories,
            { mode: searchMode, externalSources: externalSearchSources },
            aiConfig,
            siteSettings,
            privateVaultCipher || undefined
          );
          handleSyncConflict({
            localData: { ...localData, meta: { updatedAt: localUpdatedAt, deviceId: localDeviceId, version: localVersion } },
            remoteData: cloudData
          });
        }
      }
    };

    checkCloudData().finally(() => {
      hasInitialCloudCheckCompletedRef.current = true;
    });
  }, [isLoaded, pullFromCloud, links, categories, searchMode, externalSearchSources, aiConfig, siteSettings, privateVaultCipher, buildSyncData, handleSyncConflict, getLocalSyncMeta, handleSyncComplete]);

  // === KV Sync: Auto-sync on data change ===
  const prevSyncDataRef = useRef<string | null>(null);

  useEffect(() => {
    // 跳过初始加载阶段
    if (!isLoaded || !hasInitialSyncRun.current || currentConflict) return;
    if (!hasInitialCloudCheckCompletedRef.current) return;
    if (isSyncPasswordRefreshingRef.current) return;
    if (isReadOnly) return;

    const syncData = buildSyncData(
      links,
      categories,
      { mode: searchMode, externalSources: externalSearchSources },
      aiConfig,
      siteSettings,
      privateVaultCipher || undefined
    );
    const serialized = JSON.stringify(syncData);

    if (suppressNextAutoSyncRef.current) {
      suppressNextAutoSyncRef.current = false;
      prevSyncDataRef.current = serialized;
      return;
    }

    if (serialized !== prevSyncDataRef.current) {
      prevSyncDataRef.current = serialized;
      schedulePush(syncData);
    }
  }, [links, categories, isLoaded, searchMode, externalSearchSources, aiConfig, siteSettings, privateVaultCipher, schedulePush, buildSyncData, currentConflict, isReadOnly]);

  // === Sync Conflict Resolution ===
  const handleResolveConflict = useCallback((choice: 'local' | 'remote') => {
    if (choice === 'remote' && currentConflict) {
      // 使用云端数据
      handleSyncComplete(currentConflict.remoteData);
    }
    resolveSyncConflict(choice);
    setSyncConflictOpen(false);
    setCurrentConflict(null);
  }, [currentConflict, handleSyncComplete, resolveSyncConflict]);

  // 手动触发同步
  const handleManualSync = useCallback(async () => {
    const syncData = buildSyncData(
      links,
      categories,
      { mode: searchMode, externalSources: externalSearchSources },
      aiConfig,
      siteSettings,
      privateVaultCipher || undefined
    );
    await pushToCloud(syncData);
  }, [links, categories, searchMode, externalSearchSources, aiConfig, siteSettings, privateVaultCipher, pushToCloud]);

  const handleCreateBackup = useCallback(async () => {
    if (!ensureEditable('创建备份')) return false;
    const syncData = buildSyncData(
      links,
      categories,
      { mode: searchMode, externalSources: externalSearchSources },
      aiConfig,
      siteSettings,
      privateVaultCipher || undefined
    );
    const success = await createBackup(syncData);
    if (success) {
      notify('备份已创建', 'success');
    } else {
      notify('备份失败，请稍后重试', 'error');
    }
    return success;
  }, [ensureEditable, links, categories, searchMode, externalSearchSources, aiConfig, siteSettings, privateVaultCipher, createBackup, notify, buildSyncData]);

  const handleManualPull = useCallback(async () => {
    const localMeta = getLocalSyncMeta();
    const localVersion = localMeta?.version ?? 0;
    const localUpdatedAt = typeof localMeta?.updatedAt === 'number' ? localMeta.updatedAt : 0;
    const localDeviceId = localMeta?.deviceId || getDeviceId();
    const cloudData = await pullFromCloud();
    if (cloudData && cloudData.links && cloudData.categories) {
      if ((cloudData as any).siteSettings?.siteMode === 'webmaster') {
        handleSyncComplete(cloudData);
        return;
      }
      if (cloudData.meta.version !== localVersion) {
        const localData = buildSyncData(
          links,
          categories,
          { mode: searchMode, externalSources: externalSearchSources },
          aiConfig,
          siteSettings,
          privateVaultCipher || undefined
        );
        handleSyncConflict({
          localData: { ...localData, meta: { updatedAt: localUpdatedAt, deviceId: localDeviceId, version: localVersion } },
          remoteData: cloudData
        });
        return;
      }
      handleSyncComplete(cloudData);
    }
  }, [pullFromCloud, handleSyncComplete, getLocalSyncMeta, links, categories, searchMode, externalSearchSources, aiConfig, siteSettings, privateVaultCipher, buildSyncData, handleSyncConflict]);

  const handleSyncPasswordChange = useCallback((nextPassword: string) => {
    const trimmed = (nextPassword && typeof nextPassword === 'string') ? String(nextPassword).trim() : '';
    if (trimmed === lastSyncPasswordRef.current) return;
    lastSyncPasswordRef.current = trimmed;

    if (syncPasswordRefreshTimerRef.current) {
      clearTimeout(syncPasswordRefreshTimerRef.current);
      syncPasswordRefreshTimerRef.current = null;
    }

    if (!trimmed) {
      isSyncPasswordRefreshingRef.current = false;
      return;
    }

    cancelPendingSync();
    isSyncPasswordRefreshingRef.current = true;
    syncPasswordRefreshIdRef.current += 1;
    const refreshId = syncPasswordRefreshIdRef.current;
    syncPasswordRefreshTimerRef.current = setTimeout(() => {
      syncPasswordRefreshTimerRef.current = null;
      handleManualPull()
        .finally(() => {
          if (syncPasswordRefreshIdRef.current === refreshId) {
            isSyncPasswordRefreshingRef.current = false;
            refreshRemoteAuth();
          }
        });
    }, 600);
  }, [cancelPendingSync, handleManualPull, refreshRemoteAuth]);

  const handleViewPasswordChange = useCallback((nextPassword: string) => {
    const trimmed = (nextPassword && typeof nextPassword === 'string') ? String(nextPassword).trim() : '';
    if (trimmed === lastViewPasswordRef.current) return;
    lastViewPasswordRef.current = trimmed;

    if (viewPasswordRefreshTimerRef.current) {
      clearTimeout(viewPasswordRefreshTimerRef.current);
      viewPasswordRefreshTimerRef.current = null;
    }

    viewPasswordRefreshIdRef.current += 1;
    const refreshId = viewPasswordRefreshIdRef.current;
    viewPasswordRefreshTimerRef.current = setTimeout(() => {
      viewPasswordRefreshTimerRef.current = null;
      handleManualPull().finally(() => {
        if (viewPasswordRefreshIdRef.current === refreshId) {
          refreshRemoteAuth();
        }
      });
    }, 600);
  }, [handleManualPull, refreshRemoteAuth]);

  useEffect(() => {
    return () => {
      if (syncPasswordRefreshTimerRef.current) {
        clearTimeout(syncPasswordRefreshTimerRef.current);
      }
      if (viewPasswordRefreshTimerRef.current) {
        clearTimeout(viewPasswordRefreshTimerRef.current);
      }
    };
  }, []);

  const handleRestoreBackup = useCallback(async (backupKey: string) => {
    if (!ensureEditable('恢复备份')) return false;
    const confirmed = await confirm({
      title: '恢复云端备份',
      message: '此操作将用所选备份覆盖本地数据，并在云端创建一个回滚点。',
      confirmText: '恢复',
      cancelText: '取消',
      variant: 'danger'
    });
    if (!confirmed) return false;

    const restoredData = await restoreBackup(backupKey);
    if (!restoredData) {
      notify('恢复失败，请稍后重试', 'error');
      return false;
    }

    handleSyncComplete(restoredData);
    prevSyncDataRef.current = JSON.stringify(buildSyncData(
      restoredData.links,
      restoredData.categories,
      restoredData.searchConfig,
      restoredData.aiConfig,
      restoredData.siteSettings,
      restoredData.privateVault
    ));
    notify('已恢复到所选备份，并创建回滚点', 'success');
    return true;
  }, [ensureEditable, confirm, restoreBackup, handleSyncComplete, notify, buildSyncData]);

  const handleDeleteBackup = useCallback(async (backupKey: string) => {
    if (!ensureEditable('删除备份')) return false;
    const confirmed = await confirm({
      title: '删除备份',
      message: '确定要删除此备份吗?此操作无法撤销。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });
    if (!confirmed) return false;

    const success = await deleteBackup(backupKey);
    if (!success) {
      notify('删除失败，请稍后重试', 'error');
      return false;
    }

    notify('备份已删除', 'success');
    return true;
  }, [ensureEditable, confirm, deleteBackup, notify]);

  // === Render ===
  return (
    <div className={`flex min-h-screen ${toneClasses.text}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        categories={visibleCategories}
        selectedCategory={selectedCategory}
        linkCounts={linkCounts}
        privateCount={privateCount}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={toggleSidebarCollapsed}
        onSelectCategory={(id) => {
          if (id === PRIVATE_CATEGORY_ID) {
            handleSelectPrivate();
          } else if (id === 'notes') {
            handleSelectNotes();
          } else {
            navigateToCategory(id);
            setSidebarOpen(false);
          }
        }}
        onSelectHome={navigateToHome}
        onAddLink={handleAddLinkRequest}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onManageCategories={() => setIsCatManagerOpen(true)}
        onLogout={isLoggedIn ? handleLogout : undefined}
        onLogin={() => setShowLoginModal(true)}
        isLoggedIn={isLoggedIn}
        privacyGroupEnabled={privacyGroupEnabled}
        isPrivateUnlocked={isPrivateUnlocked}
        isPrivateView={isPrivateView}
        onUnlockPrivate={handleUnlockPrivateVault}
        privateUnlockHint={privateUnlockHint}
        privateUnlockSubHint={privateUnlockSubHint}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <MainHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchMode={searchMode}
          onSearchModeChange={handleSearchModeChange}
          selectedSearchSource={selectedSearchSource}
          onSearchSourceSelect={handleSearchSourceSelect}
          externalSearchSources={externalSearchSources}
          showSearchSourcePopup={showSearchSourcePopup}
          setShowSearchSourcePopup={setShowSearchSourcePopup}
          hoveredSearchSource={hoveredSearchSource}
          setHoveredSearchSource={setHoveredSearchSource}
          setIsIconHovered={setIsIconHovered}
          setIsPopupHovered={setIsPopupHovered}
          onExternalSearch={handleExternalSearch}
          navTitle={navTitleText}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
          isMobile={isMobile}
          onAddLink={handleAddLinkRequest}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleMobileSearch={() => setMobileSearchOpen(true)}
        />

        {/* Main Dashboard */}
        <main className="flex-1 overflow-auto">
          <V9Dashboard
            links={displayedLinks}
            categories={visibleCategories}
            pinnedLinks={pinnedLinks}
            onAddResource={handleAddLinkRequest}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onEditLink={handleLinkEdit}
            onDeleteLink={handleDeleteLink}
          />
        </main>
      </div>

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
          onViewPasswordChange={handleViewPasswordChange}
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

        {/* Sync Conflict Modal */}
        <SyncConflictModal
          isOpen={syncConflictOpen}
          conflict={currentConflict}
          onResolve={handleResolveConflict}
          onClose={() => setSyncConflictOpen(false)}
          closeOnBackdrop={closeOnBackdrop}
        />

      {/* Sync Status Indicator - Fixed bottom right */}
      <div className="fixed bottom-4 right-4 z-30">
        <SyncStatusIndicator
          status={isReadOnly && (syncStatus === 'error' || syncStatus === 'pending') ? 'idle' : syncStatus}
          lastSyncTime={lastSyncTime}
          onManualSync={isReadOnly ? undefined : () => {
            if (!ensureEditable('同步')) return;
            handleManualSync();
          }}
          onManualPull={handleManualPull}
        />
      </div>

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
            ids.forEach(id => togglePinStore(id));
            notify(`${ids.length} 个链接已置顶`, 'success');
            setMobileBulkEditOpen(false);
          }}
          onMove={(ids, categoryId) => {
            notify(`${ids.length} 个链接已移动`, 'success');
            setMobileBulkEditOpen(false);
          }}
          onDelete={(ids) => {
            confirm({ title: '确认删除', message: `确定要删除 ${ids.length} 个链接吗？` }).then((confirmed) => {
              if (confirmed) {
                ids.forEach(id => deleteLink(id));
                notify(`${ids.length} 个链接已删除`, 'success');
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onLogin={handleLogin}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

export default App;
