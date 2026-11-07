import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Fallback generators
function generateStockFallback(symbols: string[]) {
  return symbols.map(s => ({
    symbol: s,
    name: `${s} Corp`,
    price: +(150 + Math.random() * 50).toFixed(2),
    change: +((Math.random() - 0.5) * 5).toFixed(2),
    changePercent: +((Math.random() - 0.5) * 2).toFixed(2),
    history: Array.from({ length: 7 }, (_, i) => ({
      date: `2024-03-${24 + i}`,
      price: +(150 + Math.random() * 10).toFixed(2),
    })),
    news: [
      { title: `${s} Announces Q1 Results`, summary: 'Strong financial performance and operational expansion.', url: '#', date: '2024-03-30' },
      { title: 'Market Trends', summary: 'Global institutional markets demonstrate consistent momentum.', url: '#', date: '2024-03-29' },
    ],
  }));
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'SGD', 'AAN', 'AYD'];
const CUSTOM_RATES: Record<string, number> = {
  'AAN': 0.5, // 1 AAN = 2 USD, so 1 USD = 0.5 AAN
  'AYD': 0.2, // 1 AYD = 5 USD, so 1 USD = 0.2 AYD
};

function generateCurrencyFallback(base: string) {
  const now = new Date().toISOString();
  const defaultRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 154.2,
    AUD: 1.52,
    CAD: 1.38,
    CHF: 0.91,
    CNY: 7.24,
    INR: 83.5,
    SGD: 1.35,
    AAN: 0.5,
    AYD: 0.2,
  };
  const baseUsdVal = base === 'AAN' ? 2 : base === 'AYD' ? 5 : (1 / (defaultRates[base] || 1));
  return CURRENCIES.filter(c => c !== base).map(c => {
    let rate = 1;
    if (c === 'USD') {
      rate = baseUsdVal;
    } else if (c === 'AAN') {
      rate = baseUsdVal * 0.5;
    } else if (c === 'AYD') {
      rate = baseUsdVal * 0.2;
    } else {
      rate = baseUsdVal * (defaultRates[c] || 1);
    }
    return {
      from: base,
      to: c,
      rate: Number(rate.toFixed(4)),
      timestamp: now,
    };
  });
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Stocks API endpoint
app.post('/api/stocks', async (req: Request, res: Response) => {
  const symbols: string[] = Array.isArray(req.body?.symbols) && req.body.symbols.length > 0
    ? req.body.symbols
    : ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured on server, returning fallback data');
      return res.json(generateStockFallback(symbols));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate realistic real-time stock market data for the following symbols: ${symbols.join(', ')}. 
      Include current price, daily change, daily change percentage, a history of 7 days (date and price), and 2 recent news items (title, summary, date).
      Return as a JSON array matching the StockData interface.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              change: { type: Type.NUMBER },
              changePercent: { type: Type.NUMBER },
              history: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                  },
                },
              },
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    url: { type: Type.STRING },
                    date: { type: Type.STRING },
                  },
                },
              },
            },
            required: ['symbol', 'name', 'price', 'change', 'changePercent', 'history', 'news'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json(parsed);
    }
    return res.json(generateStockFallback(symbols));
  } catch (error) {
    console.error('Error generating stock data on server:', error);
    return res.json(generateStockFallback(symbols));
  }
});

// Currency API endpoint
app.post('/api/currency', async (req: Request, res: Response) => {
  const base: string = req.body?.base || 'USD';
  const realCurrencies = CURRENCIES.filter(c => !CUSTOM_RATES[c] && c !== 'USD');
  const effectiveBase = CUSTOM_RATES[base] ? 'USD' : base;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured on server, returning currency fallback');
      return res.json(generateCurrencyFallback(base));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Fetch the current real-time exchange rates for ${effectiveBase} against the following currencies: ${realCurrencies.join(', ')}. 
      Use Google Search to get the most accurate and recent data. 
      Return as a JSON array matching the ExchangeRate interface: { from: string, to: string, rate: number, timestamp: string }.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              rate: { type: Type.NUMBER },
              timestamp: { type: Type.STRING },
            },
            required: ['from', 'to', 'rate', 'timestamp'],
          },
        },
      },
    });

    let rates = JSON.parse(response.text ?? '[]');
    const now = new Date().toISOString();

    if (!Array.isArray(rates) || rates.length === 0) {
      return res.json(generateCurrencyFallback(base));
    }

    // If base was a custom currency, adjust all rates
    if (CUSTOM_RATES[base]) {
      const baseValueInUsd = 1 / CUSTOM_RATES[base];
      rates = rates.map((r: any) => ({
        ...r,
        from: base,
        rate: r.rate * baseValueInUsd,
        timestamp: now,
      }));
      rates.push({ from: base, to: 'USD', rate: baseValueInUsd, timestamp: now });
    }

    // Add custom currencies to the list
    const usdRate = base === 'USD' ? 1 : (rates.find((r: any) => r.to === 'USD')?.rate || 1);

    CURRENCIES.forEach(c => {
      if (CUSTOM_RATES[c] && c !== base) {
        rates.push({
          from: base,
          to: c,
          rate: usdRate * CUSTOM_RATES[c],
          timestamp: now,
        });
      }
    });

    return res.json(rates.filter((r: any) => r.to !== base));
  } catch (error) {
    console.error('Error generating currency rates on server:', error);
    return res.json(generateCurrencyFallback(base));
  }
});

// General Gemini text generation endpoint
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  const { prompt, model, systemInstruction } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error generating content:', error);
    return res.status(500).json({ error: error?.message || 'Gemini generation error' });
  }
});

// General Gemini streaming endpoint (Server-Sent Events)
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  const { prompt, model, systemInstruction } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await ai.models.generateContentStream({
      model: model || 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error streaming content:', error);
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream error' })}\n\n`);
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
