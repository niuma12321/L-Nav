/**
 * Y-Nav V4.0 金融数据服务
 * 集成腾讯财经、新浪财经 API
 */

export interface StockData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface IndexData {
  name: string;
  code: string;
  value: number;
  change: number;
  changePercent: number;
}

// A 股主要指数代码映射
const INDEX_CODES: Record<string, string> = {
  'sh': 's_sh000001',      // 上证指数
  'sz': 's_sz399001',      // 深证成指
  'cy': 's_sz399006',      // 创业板指
  'hs300': 's_sh000300',   // 沪深300
  'kc50': 's_sh000688',    // 科创50
};

/**
 * 从腾讯财经获取股票数据
 * API: http://qt.gtimg.cn/q=sh000001,sz399001
 */
export async function fetchStockData(codes: string[]): Promise<StockData[]> {
  try {
    const codeString = codes.join(',');
    const response = await fetch(`https://qt.gtimg.cn/q=${codeString}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    const text = await response.text();
    return parseTencentData(text);
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    return getMockStockData(codes);
  }
}

/**
 * 获取 A 股主要指数数据
 */
export async function fetchMarketIndices(): Promise<IndexData[]> {
  try {
    const codes = Object.values(INDEX_CODES);
    const response = await fetch(`https://qt.gtimg.cn/q=${codes.join(',')}`);
    const text = await response.text();
    
    const data = parseTencentIndexData(text);
    return [
      { name: '上证指数', code: 'sh000001', ...data['sh000001'] },
      { name: '深证成指', code: 'sz399001', ...data['sz399001'] },
      { name: '创业板指', code: 'sz399006', ...data['sz399006'] },
      { name: '沪深300', code: 'sh000300', ...data['sh000300'] },
    ];
  } catch (error) {
    console.error('Failed to fetch indices:', error);
    return getMockIndexData();
  }
}

/**
 * 解析腾讯财经返回数据
 * 格式: v_sh000001="1~上证指数~3050.23~12.5~0.41~1234567~";
 */
function parseTencentData(data: string): StockData[] {
  const stocks: StockData[] = [];
  const lines = data.split(';');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const match = line.match(/v_([szh][^=]+)="([^"]+)"/);
    if (match) {
      const code = match[1];
      const values = match[2].split('~');
      
      stocks.push({
        code: code.replace(/^s_/, ''),
        name: values[1] || '',
        price: parseFloat(values[2]) || 0,
        change: parseFloat(values[3]) || 0,
        changePercent: parseFloat(values[4]) || 0,
        volume: values[5] || '0',
        high: parseFloat(values[6]) || 0,
        low: parseFloat(values[7]) || 0,
        open: parseFloat(values[8]) || 0,
        prevClose: parseFloat(values[9]) || 0,
      });
    }
  }
  
  return stocks;
}

function parseTencentIndexData(data: string): Record<string, { value: number; change: number; changePercent: number }> {
  const indices: Record<string, { value: number; change: number; changePercent: number }> = {};
  const lines = data.split(';');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const match = line.match(/v_([szh][^=]+)="([^"]+)"/);
    if (match) {
      const code = match[1].replace(/^s_/, '');
      const values = match[2].split('~');
      
      indices[code] = {
        value: parseFloat(values[2]) || 0,
        change: parseFloat(values[3]) || 0,
        changePercent: parseFloat(values[4]) || 0,
      };
    }
  }
  
  return indices;
}

// Mock 数据 - 用于 API 失败时回退
function getMockStockData(codes: string[]): StockData[] {
  const mockData: Record<string, Partial<StockData>> = {
    'sh600519': { name: '贵州茅台', price: 1752.00, changePercent: 0.85 },
    'sh601318': { name: '中国平安', price: 45.80, changePercent: -0.65 },
    'sz000858': { name: '五粮液', price: 138.50, changePercent: 1.20 },
    'sz002594': { name: '比亚迪', price: 258.40, changePercent: 2.45 },
  };
  
  return codes.map(code => ({
    code,
    name: mockData[code]?.name || code,
    price: mockData[code]?.price || 100,
    change: mockData[code]?.change || 0,
    changePercent: mockData[code]?.changePercent || 0,
    volume: '1000万',
    high: 100,
    low: 90,
    open: 95,
    prevClose: 98,
  }));
}

function getMockIndexData(): IndexData[] {
  return [
    { name: '上证指数', code: 'sh000001', value: 3052.12, change: 12.5, changePercent: 0.41 },
    { name: '深证成指', code: 'sz399001', value: 9414.05, change: -28.3, changePercent: -0.30 },
    { name: '创业板指', code: 'sz399006', value: 1823.45, change: 8.2, changePercent: 0.45 },
    { name: '沪深300', code: 'sh000300', value: 3521.89, change: -5.2, changePercent: -0.15 },
  ];
}

/**
 * 加密货币数据 - 使用 CoinGecko API (免费)
 */
export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
}

export async function fetchCryptoData(): Promise<CryptoData[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=cny&include_24hr_change=true'
    );
    const data = await response.json();
    
    return [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin.cny, changePercent24h: data.bitcoin.cny_24h_change || 0 } as CryptoData,
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: data.ethereum.cny, changePercent24h: data.ethereum.cny_24h_change || 0 } as CryptoData,
      { id: 'solana', symbol: 'SOL', name: 'Solana', price: data.solana?.cny || 0, changePercent24h: data.solana?.cny_24h_change || 0 } as CryptoData,
    ];
  } catch (error) {
    console.error('Failed to fetch crypto:', error);
    return getMockCryptoData();
  }
}

function getMockCryptoData(): CryptoData[] {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 425680, change24h: 5200, changePercent24h: 1.23, marketCap: 8400000000000, volume24h: 280000000000 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 22450, change24h: -320, changePercent24h: -1.42, marketCap: 2700000000000, volume24h: 120000000000 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', price: 985, change24h: 45, changePercent24h: 4.78, marketCap: 430000000000, volume24h: 28000000000 },
  ];
}
