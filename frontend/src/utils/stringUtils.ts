/**
 * 安全的字符串 trim 工具函数
 * 无论输入什么类型，都返回字符串
 */
export const safeTrim = (value: unknown): string => {
  try {
    return String(value ?? '').trim();
  } catch {
    return '';
  }
};

/**
 * 检查值是否为非空字符串
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};
