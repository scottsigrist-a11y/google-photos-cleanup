import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const VALID_CATEGORY_IDS = new Set([
  'exact-duplicates',
  'burst-near-duplicates',
  'oversized-raw',
  'screenshots',
  'blurry-out-of-focus',
  'corrupted-broken',
  'receipts-documents',
  'dark-pocket-shots',
  'overexposed-washed',
  'memes-chat-forwards',
  'large-unedited-videos',
  'live-photo-clips',
  'qr-wifi-ephemera',
  'tiny-thumbnails',
  'old-edited-exports',
]);

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-media', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Set it in Settings > Secrets.',
        });
      }

      const { items } = req.body as {
        items?: Array<{
          id: string;
          name: string;
          mimeType: string;
          sizeBytes: number;
          width: number;
          height: number;
          imageBase64?: string;
        }>;
      };

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Provide at least one media item to analyze.' });
      }

      const batch = items.slice(0, 8);
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        {
          text:
            'You are a photo library curator. Inspect each media item below and classify which of these 15 cleanup categories apply (only assign categories that genuinely fit): ' +
            Array.from(VALID_CATEGORY_IDS).join(', ') +
            '. Return JSON with one entry per item id, a concise 1-sentence deletion or compression rationale, and recommendedAction ("delete", "compress", or "keep").',
        },
      ];

      for (const item of batch) {
        parts.push({
          text: `Item ID: ${item.id} | Name: ${item.name} | Type: ${item.mimeType} | Size: ${item.sizeBytes} bytes | Dimensions: ${item.width}x${item.height}`,
        });
        if (item.imageBase64 && item.imageBase64.length > 0) {
          const cleanBase64 = item.imageBase64.replace(/^data:[^;]+;base64,/, '');
          const safeMime = item.mimeType.startsWith('image/') ? item.mimeType : 'image/jpeg';
          if (safeMime === 'image/jpeg' || safeMime === 'image/png' || safeMime === 'image/webp') {
            parts.push({
              inlineData: {
                mimeType: safeMime,
                data: cleanBase64,
              },
            });
          }
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                suggestedCategories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                rationale: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
              },
              required: ['id', 'suggestedCategories', 'rationale', 'recommendedAction'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
        id: string;
        suggestedCategories: string[];
        rationale: string;
        recommendedAction: string;
      }>;

      const sanitized = parsed.map((entry) => ({
        ...entry,
        suggestedCategories: (entry.suggestedCategories ?? []).filter((c) =>
          VALID_CATEGORY_IDS.has(c)
        ),
      }));

      res.json({ results: sanitized });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze media with Gemini API';
      console.error('Gemini analyze-media error:', err);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FrameTrim server listening on http://localhost:${PORT}`);
  });
}

createServer();
