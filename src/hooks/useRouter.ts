import { useState, useEffect, useCallback, useRef } from 'react';

// 路由状态类型
type RouteView = 'home' | 'category' | 'notes' | 'private' | 'search';

interface RouteState {
  view: RouteView;
  categoryId?: string;
  searchQuery?: string;
}

interface UseRouterReturn {
  // 当前路由状态
  currentRoute: RouteState;
  
  // 导航方法
  navigateToHome: () => void;
  navigateToCategory: (categoryId: string) => void;
  navigateToNotes: () => void;
  navigateToPrivate: () => void;
  navigateToSearch: (query: string) => void;
  
  // 历史管理
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  
  // 当前选中的分类ID（兼容现有代码）
  selectedCategory: string;
}

// 从URL解析路由状态
const parseRouteFromUrl = (): RouteState => {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // 默认首页
  if (path === '/' || path === '') {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      return { view: 'search', searchQuery };
    }
    return { view: 'home' };
  }
  
  // /notes 路径
  if (path === '/notes') {
    return { view: 'notes' };
  }
  
  // /private 路径
  if (path === '/private') {
    return { view: 'private' };
  }
  
  // /category/:id 路径
  const categoryMatch = path.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    return { view: 'category', categoryId: categoryMatch[1] };
  }
  
  // 默认回首页
  return { view: 'home' };
};

// 将路由状态转换为URL
const routeToUrl = (route: RouteState): string => {
  switch (route.view) {
    case 'home':
      return '/';
    case 'notes':
      return '/notes';
    case 'private':
      return '/private';
    case 'category':
      return `/category/${route.categoryId}`;
    case 'search':
      return `/?search=${encodeURIComponent(route.searchQuery || '')}`;
    default:
      return '/';
  }
};

// 路由状态转换为selectedCategory字符串（兼容现有代码）
const routeToSelectedCategory = (route: RouteState): string => {
  switch (route.view) {
    case 'home':
      return 'all';
    case 'notes':
      return 'notes';
    case 'private':
      return 'private';
    case 'category':
      return route.categoryId || 'all';
    default:
      return 'all';
  }
};

/**
 * SPA路由管理Hook
 * 使用History API实现无刷新导航
 */
export function useRouter(): UseRouterReturn {
  // 当前路由状态
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() => parseRouteFromUrl());
  
  // 历史记录栈位置（用于判断能否前进/后退）
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyLengthRef = useRef(1);
  
  // 监听浏览器popstate事件（后退/前进按钮）
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const newRoute = parseRouteFromUrl();
      setCurrentRoute(newRoute);
      
      // 更新历史索引
      if (event.state && typeof event.state.index === 'number') {
        setHistoryIndex(event.state.index);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // 更新history.length引用
  useEffect(() => {
    historyLengthRef.current = window.history.length;
  });
  
  // 导航到首页
  const navigateToHome = useCallback(() => {
    const newRoute: RouteState = { view: 'home' };
    const url = routeToUrl(newRoute);
    
    if (window.location.pathname !== url) {
      const nextIndex = historyIndex + 1;
      window.history.pushState({ index: nextIndex }, '', url);
      setHistoryIndex(nextIndex);
    }
    
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [historyIndex]);
  
  // 导航到分类
  const navigateToCategory = useCallback((categoryId: string) => {
    const newRoute: RouteState = { view: 'category', categoryId };
    const url = routeToUrl(newRoute);
    
    if (window.location.pathname !== url) {
      const nextIndex = historyIndex + 1;
      window.history.pushState({ index: nextIndex }, '', url);
      setHistoryIndex(nextIndex);
    }
    
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [historyIndex]);
  
  // 导航到便签
  const navigateToNotes = useCallback(() => {
    const newRoute: RouteState = { view: 'notes' };
    const url = routeToUrl(newRoute);
    
    if (window.location.pathname !== url) {
      const nextIndex = historyIndex + 1;
      window.history.pushState({ index: nextIndex }, '', url);
      setHistoryIndex(nextIndex);
    }
    
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [historyIndex]);
  
  // 导航到隐私分组
  const navigateToPrivate = useCallback(() => {
    const newRoute: RouteState = { view: 'private' };
    const url = routeToUrl(newRoute);
    
    if (window.location.pathname !== url) {
      const nextIndex = historyIndex + 1;
      window.history.pushState({ index: nextIndex }, '', url);
      setHistoryIndex(nextIndex);
    }
    
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [historyIndex]);
  
  // 导航到搜索结果
  const navigateToSearch = useCallback((query: string) => {
    const newRoute: RouteState = { view: 'search', searchQuery: query };
    const url = routeToUrl(newRoute);
    
    // 搜索使用replaceState，不加入历史栈
    window.history.replaceState({ index: historyIndex }, '', url);
    setCurrentRoute(newRoute);
  }, [historyIndex]);
  
  // 后退
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      window.history.back();
    }
  }, [historyIndex]);
  
  // 前进
  const goForward = useCallback(() => {
    window.history.forward();
  }, []);
  
  // 计算能否前进/后退
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyLengthRef.current - 1;
  
  // 兼容现有代码：转换为selectedCategory格式
  const selectedCategory = routeToSelectedCategory(currentRoute);
  
  return {
    currentRoute,
    navigateToHome,
    navigateToCategory,
    navigateToNotes,
    navigateToPrivate,
    navigateToSearch,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    selectedCategory,
  };
}

export default useRouter;
