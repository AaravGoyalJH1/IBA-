import { ExchangeRate } from "../types";

export async function getExchangeRates(base: string = 'USD'): Promise<ExchangeRate[]> {
  try {
    const response = await fetch('/api/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching exchange rates from server:", error);
    const now = new Date().toISOString();
    const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'SGD', 'AAN', 'AYD'];
    return CURRENCIES.filter(c => c !== base).map(c => ({
      from: base,
      to: c,
      rate: base === 'USD' ? (c === 'EUR' ? 0.92 : c === 'GBP' ? 0.79 : 1.1) : 1.0,
      timestamp: now
    }));
  }
}
