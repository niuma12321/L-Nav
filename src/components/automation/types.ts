// 自动化调度类型定义
export type TaskType = 'scheduled' | 'manual' | 'webhook';
export type TaskAction = 'http' | 'notification' | 'rclone' | 'docker' | 'script';
export type TaskStatus = 'success' | 'failed' | 'running' | 'pending';

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  enabled: boolean;
  cronExpression?: string; // 定时任务专用
  action: TaskAction;
  actionConfig: Record<string, any>; // 根据动作类型变化
  webhookUrl?: string; // webhook专用
  createdAt: string;
  updatedAt: string;
}

export interface TaskExecutionLog {
  id: string;
  taskId: string;
  taskName: string;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  output?: string;
  error?: string;
}

// 智能家居类型定义
export type DeviceType = 'light' | 'switch' | 'climate' | 'sensor' | 'camera' | 'lock';
export type DeviceStatus = 'online' | 'offline' | 'unavailable';

export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  isOn: boolean;
  attributes: Record<string, any>; // 亮度、温度、湿度等
  entityId: string; // Home Assistant entity_id
  room?: string;
  lastUpdated: string;
}

export interface SmartScene {
  id: string;
  name: string;
  icon: string;
  deviceIds: string[];
  actions: Array<{
    deviceId: string;
    action: string;
    params: Record<string, any>;
  }>;
}

// 快捷控制配置
export interface QuickControl {
  id: string;
  name: string;
  icon: string;
  deviceType: DeviceType;
  action: 'turn_on' | 'turn_off' | 'toggle' | 'restart';
}
