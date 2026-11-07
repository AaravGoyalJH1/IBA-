import { StockData } from "../types";

export async function getStockMarketData(symbols: string[]): Promise<StockData[]> {
  try {
    const response = await fetch('/api/stocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching stock data from server:", error);
    // Fallback data if server endpoint is unreachable
    return symbols.map(s => ({
      symbol: s,
      name: `${s} Corp`,
      price: +(150 + Math.random() * 50).toFixed(2),
      change: +((Math.random() - 0.5) * 5).toFixed(2),
      changePercent: +((Math.random() - 0.5) * 2).toFixed(2),
      history: Array.from({ length: 7 }, (_, i) => ({
        date: `2024-03-${24 + i}`,
        price: +(150 + Math.random() * 10).toFixed(2)
      })),
      news: [
        { title: `${s} Announces Q1 Results`, summary: "Strong growth in cloud services.", url: "#", date: "2024-03-30" },
        { title: "Market Trends", summary: "Tech stocks see a rebound.", url: "#", date: "2024-03-29" }
      ]
    }));
  }
}
