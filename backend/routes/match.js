/**
 * AI-powered visual matching via Groq + Llama 4 Scout (multimodal).
 *
 * POST /api/match/ai
 *   body:    { image: "data:image/jpeg;base64,...", topN?: 3 }
 *   returns: { matches: [{ id, title, location, category, image, confidence, reason }] }
 *
 * Used by the "Accurate" toggle on the Find Items page. Falls back gracefully
 * if GROQ_API_KEY is missing (returns 503 with a helpful message).
 */
const express = require('express');
const router = express.Router();
const connectDB = require('../db');
const Item = require('../models/Item');

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
// How many inventory photos to send the model in one call. Higher = fewer
// silent misses but a slower/pricier request. Override with MATCH_MAX_CANDIDATES.
const MAX_CANDIDATES = Math.max(1, parseInt(process.env.MATCH_MAX_CANDIDATES, 10) || 8);

router.post('/ai', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'AI matching unavailable: set GROQ_API_KEY in .env to enable.'
      });
    }
    const { image, topN } = req.body || {};
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'image (data: URL) is required' });
    }

    // Pull approved candidates that have a photo attached.
    await connectDB();
    // Newest finds first — most likely to still be unclaimed — so when the
    // inventory exceeds MAX_CANDIDATES we drop the stalest items, not arbitrary ones.
    const inventory = await Item.find({ status: 'approved' })
      .sort({ createdAt: -1, created_at: -1 })
      .lean();
    const candidates = inventory
      .filter(it => it.image && it.image.startsWith('data:image/'))
      .slice(0, MAX_CANDIDATES);

    if (candidates.length === 0) {
      return res.json({ matches: [], note: 'No photo-bearing items in inventory yet.' });
    }

    // Build a multimodal message: query image first, then each candidate.
    const content = [
      {
        type: 'text',
        text:
          'Image 1 is a LOST item someone is trying to find. ' +
          'Images 2-' + (candidates.length + 1) + ' are candidates from a campus lost-and-found inventory. ' +
          'For EACH candidate, judge how likely it is to be the SAME exact item (not just the same category). ' +
          'Consider shape, color, branding, distinguishing marks, and condition. Be conservative — only score above 70 if you are confident.'
      },
      { type: 'image_url', image_url: { url: image } }
    ];

    candidates.forEach((c, i) => {
      const label = [
        `Candidate ${i + 1}:`,
        c.title ? `title="${c.title}"` : '',
        c.category ? `category="${c.category}"` : '',
        c.location ? `location="${c.location}"` : '',
        c.description ? `description="${c.description.slice(0, 140)}"` : ''
      ].filter(Boolean).join(' ');
      content.push({ type: 'text', text: '\n' + label });
      content.push({ type: 'image_url', image_url: { url: c.image } });
    });

    content.push({
      type: 'text',
      text:
        '\nReturn ONLY valid JSON, no prose, in this shape: ' +
        '{"matches":[{"index":1,"confidence":85,"reason":"short reason"}]}. ' +
        '"index" is 1-based and matches the candidate number. ' +
        'Include every candidate. Omit any markdown fencing.'
    });

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content }],
        max_tokens: 800,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return res.status(502).json({ error: 'Groq error', detail: errText.slice(0, 500) });
    }

    const data = await groqRes.json();
    const raw  = data?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return res.status(502).json({ error: 'Model returned non-JSON', raw }); }

    const limit = Math.max(1, Math.min(parseInt(topN, 10) || 3, candidates.length));
    const matches = (parsed.matches || [])
      .map(m => {
        const cand = candidates[(parseInt(m.index, 10) || 0) - 1];
        if (!cand) return null;
        return {
          id: cand._id,
          title: cand.title,
          location: cand.location,
          category: cand.category,
          image: cand.image,
          confidence: Math.max(0, Math.min(100, parseInt(m.confidence, 10) || 0)),
          reason: String(m.reason || '').slice(0, 200)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    res.json({ matches, model: GROQ_MODEL });
  } catch (err) {
    console.error('match/ai error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/describe', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'AI description unavailable: set GROQ_API_KEY in .env to enable.'
      });
    }
    const { image } = req.body || {};
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'image (data: URL) is required' });
    }

    const content = [
      {
        type: 'text',
        text: 'You are an assistant that describes items found on a school campus. ' +
              'Describe the item in the image in detail, but concisely (around 2 to 3 sentences). ' +
              'Highlight its color, brand, any key identifying features (like stickers, cracks, logos), and its condition. ' +
              'Do not include any greeting, meta-commentary, introductory phrases (like "This image shows"), or formatting. ' +
              'Just output the plain text description directly.'
      },
      { type: 'image_url', image_url: { url: image } }
    ];

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content }],
        max_tokens: 300,
        temperature: 0.3
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return res.status(502).json({ error: 'Groq error', detail: errText.slice(0, 500) });
    }

    const data = await groqRes.json();
    const description = data?.choices?.[0]?.message?.content?.trim() || '';

    res.json({ description });
  } catch (err) {
    console.error('match/describe error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
