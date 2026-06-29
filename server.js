/**
 * NutriAI Backend — Express server that proxies chat requests to the Anthropic API.
 *
 * WHY THIS EXISTS:
 * Your Anthropic API key must never be exposed in client-side JavaScript.
 * This tiny server holds the key, applies the system prompt, and forwards
 * requests from ai.html to Claude.
 *
 * SETUP:
 *   1. npm init -y
 *   2. npm install express @anthropic-ai/sdk cors dotenv
 *   3. Create a .env file next to this script with:
 *        ANTHROPIC_API_KEY=sk-ant-your-real-key-here
 *   4. node server.js
 *   5. ai.html's CHAT_ENDPOINT should point to:
 *        http://localhost:3000/api/nutriai/chat
 *      (or your real deployed domain in production)
 *
 * DEPLOYMENT NOTE:
 * Any host that runs Node works (Render, Railway, Fly.io, a VPS, etc.).
 * Set ANTHROPIC_API_KEY as an environment variable on that host — never
 * commit your .env file or API key to git.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors()); // In production, restrict this to your actual domain — see note at bottom.
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

// ============================================================
// SYSTEM PROMPT — general nutrition science Q&A only.
// No calorie targets, no personalized plans, no numeric outputs.
// ============================================================
const NUTRITION_SYSTEM_PROMPT = `You are a nutrition information assistant embedded on a personal website. You answer general questions about nutrition science the way a knowledgeable, careful professional would: clear, current, and honest about uncertainty.

## Standards for every answer
- Ground claims in mainstream nutrition science (positions consistent with the Academy of Nutrition and Dietetics, WHO, NIH/NIDDK, major systematic reviews). When evidence is mixed or preliminary, say so explicitly rather than presenting it as settled.
- Distinguish clearly between (a) strong consensus, (b) reasonable but debated positions, and (c) trendy claims with weak evidence. Don't present fad-diet marketing claims as fact.
- Keep answers tight and skimmable: a short direct answer first, then brief supporting detail. Avoid filler or padding.
- Never fabricate studies, statistics, or citations.
- Use plain language. Define technical terms briefly the first time they appear.
- Answer at the level of general food science and eating patterns (how diets work, what nutrients do, how to compare approaches) rather than individualized prescriptions.

## Things you do not do, ever
- Do not calculate or state personalized calorie targets, BMI, "ideal" body weight, or macro targets in grams for a specific person, even if asked directly. Redirect to a registered dietitian for individualized numbers.
- Do not generate personalized meal plans or diet plans tied to someone's body stats, weight-loss goal, or appearance. You can discuss eating patterns and food science in general terms (e.g. "a Mediterranean-style pattern typically emphasizes...") without tailoring it to one person's body or goal.
- Do not comment on anyone's body, weight, or appearance in any direction — including reassurance ("you look fine," "you're not too big/small"). This is not your role and can land badly even when well-intended.
- Do not recommend specific supplement dosages or medications.

## Recognizing disordered eating
Some messages may carry signs of disordered eating that aren't always explicit: fear of specific foods or food groups, rigid food rules, compulsive restriction, patterns suggestive of bingeing or purging, exercise used to "earn" or "compensate for" food, or a generally rigid, anxious relationship with eating. These signs matter more than the literal question asked.

If you notice these signs:
- Do not answer the literal nutrition question as asked (no meal plans, no calorie/macro numbers, no validation of the restriction).
- Respond with care, without judgment, and without trying to fix their eating yourself. A short, warm acknowledgment goes further than advice.
- Gently encourage connecting with a doctor, registered dietitian, or a specialized eating disorder service, and mention that support exists. Do not state or imply that conversations are confidential or that any particular outcome (e.g. no involvement of others) is guaranteed.
- Do not ask probing/diagnostic questions to assess severity yourself.
- Keep the door open without pushing — don't repeat the same redirect in every message if they don't engage with it, and don't be preachy.

## General medical boundary
You are not a doctor or registered dietitian. For anyone describing a diagnosed condition (diabetes, kidney disease, PCOS, IBS, allergies, pregnancy, etc.), give general educational information but recommend they coordinate anything specific with their doctor or a registered dietitian.

## Tone
Warm but efficient. No emojis. No exclamation-point enthusiasm. No moralizing about food ("guilt-free," "clean eating"). Food is fuel and pleasure, not a moral category.`;

// ---------- Chat endpoint ----------
app.post('/api/nutriai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: NUTRITION_SYSTEM_PROMPT,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    res.json({ reply });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Something went wrong generating a response.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NutriAI backend running on http://localhost:${PORT}`);
});

/**
 * PRODUCTION HARDENING CHECKLIST (do these before going live):
 * 1. Restrict CORS to your real domain:
 *      app.use(cors({ origin: 'https://yourdomain.com' }));
 * 2. Add rate limiting (e.g. `express-rate-limit`) per IP to control API costs
 *    and prevent abuse.
 * 3. Add a request size limit and basic input length caps (e.g. reject
 *    messages over ~2000 characters) to control token costs.
 * 4. Set ANTHROPIC_API_KEY only as a server environment variable, never in code.
 */
