import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDataStore } from './useDataStore';

const API_BASE = '/api/v1/smart-home';

export interface SmartDevice {
  id: number;
  device_id: string;
  name: string;
  type: 'light' | 'switch' | 'sensor' | 'climate' | 'cover';
  state: string;
  attributes: any;
  last_updated: number;
  platform: string;
}

export interface SmartScene {
  id: number;
  scene_id: string;
  name: string;
  icon?: string;
  platform: string;
  last_triggered?: number;
}

export function useSmartHome() {
  // 从localStorage获取用户ID并使用useMemo缓存
  const userId = useMemo(() => localStorage.getItem('user_id') || 'default', []);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [scenes, setScenes] = useState<SmartScene[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        setDevices(data);
      }
    } catch (e) {
      console.error('获取设备失败', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchScenes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scenes?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        setScenes(data);
      }
    } catch (e) {
      console.error('获取场景失败', e);
    }
  }, [userId]);

  const controlDevice = useCallback(async (deviceId: string, action: string, params: any) => {
    await fetch(`${API_BASE}/devices/${encodeURIComponent(deviceId)}/control?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params })
    });
    await fetchDevices();
  }, [userId, fetchDevices]);

  const toggleDevice = useCallback(async (device: SmartDevice) => {
    const isOn = device.state === 'on' || device.state === 'heat' || device.state === 'cool';
    const newState = isOn ? 'off' : 'on';
    await controlDevice(device.device_id, device.type === 'light' ? 'light/turn_off' : 'switch/turn_off', { state: newState });
  }, [controlDevice]);

  const runScene = useCallback(async (sceneId: string) => {
    await fetch(`${API_BASE}/scenes/${encodeURIComponent(sceneId)}/run?userId=${userId}`, { method: 'POST' });
    await fetchScenes();
    await fetchDevices();
  }, [userId, fetchScenes, fetchDevices]);

  useEffect(() => {
    fetchDevices();
    fetchScenes();
    // 每30秒自动刷新
    const interval = setInterval(() => {
      fetchDevices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices, fetchScenes]);

  return {
    devices,
    scenes,
    loading,
    controlDevice,
    toggleDevice,
    runScene,
    refreshDevices: fetchDevices,
    refreshScenes: fetchScenes
  };
}
