// ============================================================
// AESTHETIX — AI Agent System
// File: agent.js
// Run: node agent.js
// Requires: npm install node-fetch dotenv
// ============================================================

import fetch from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();

// ─── CONFIG ─────────────────────────────────────────────────
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const GH_TOKEN     = process.env.GITHUB_TOKEN;
const GH_OWNER     = "krishsreva1-lab";
const GH_REPO      = "asthetic-prompt";
const DATA_FILE    = "data.json";
const PROMPT_SLOT  = process.env.PROMPT_SLOT || "1"; // "1", "2", or "3"

// Prompt style mix — your cinematic style + trending
const STYLE_THEMES = [
  "cinematic portrait, identity-lock, editorial fashion",
  "trending Instagram aesthetic, urban streetwear, golden hour",
  "dark moody editorial, luxury fashion, film grain",
  "surreal fantasy, cosmic, ethereal lighting",
  "minimalist editorial poster, swiss design, bold typography",
  "car meet, night scene, neon lights, cinematic masculinity",
  "vintage film look, early 2000s flash photography",
  "old money aesthetic, luxury outdoor, medium format",
];

// Tags pool (your style)
const TAG_POOL = [
  "Cinematic Presence", "Urban Legend", "Ethereal Glow", "Dark Matter",
  "Golden Hour", "Night Vision", "Silent Power", "Aesthetic Chaos",
  "Vintage Soul", "Neon Drift", "Cosmic Edit", "Editorial Grace",
  "Phantom Light", "Raw Energy", "Soft Authority", "Street Oracle",
];

// ─── UTILITIES ───────────────────────────────────────────────
const log = (agent, msg, type = "info") => {
  const icons = { info: "ℹ️", success: "✅", error: "❌", warn: "⚠️" };
  console.log(`${icons[type]} [${agent}] ${msg}`);
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── GEMINI AGENT CALL ───────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userMessage}` }
            ]
          }
        ],
        generationConfig: { temperature: 0.85, maxOutputTokens: 1200 }
      })
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── POLLINATIONS IMAGE URL ──────────────────────────────────
function buildImageUrl(prompt) {
  const encoded = encodeURIComponent(prompt.slice(0, 300));
  const seed = Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=960&seed=${seed}&nologo=true&model=flux`;
}

// ─── GITHUB: READ data.json ──────────────────────────────────
async function readDataJson() {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${DATA_FILE}`,
    { headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  const file = await res.json();
  const content = Buffer.from(file.content, "base64").toString("utf8");
  return { data: JSON.parse(content), sha: file.sha };
}

// ─── GITHUB: WRITE data.json ─────────────────────────────────
async function writeDataJson(newData, sha) {
  const content = Buffer.from(JSON.stringify(newData, null, 4)).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${DATA_FILE}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({
        message: `🤖 Agent: Added new draft prompt [Slot ${PROMPT_SLOT}]`,
        content,
        sha
      })
    }
  );
  return res.ok;
}

// ─── AGENT 1: TREND SCOUT ────────────────────────────────────
async function trendScoutAgent() {
  log("🔍 Trend Scout", "Detecting trending visual themes...");
  const theme = randomItem(STYLE_THEMES);
  const tag   = randomItem(TAG_POOL);
  log("🔍 Trend Scout", `Theme selected: "${theme}"`, "success");
  return { theme, tag };
}

// ─── AGENT 2: PROMPT WRITER ──────────────────────────────────
async function promptWriterAgent(theme, tag) {
  log("✍️ Prompt Writer", "Generating Gemini-optimized prompt...");

  const system = `You are an expert AI image prompt writer for AESTHETIX — a premium AI prompt website.
Your prompts are optimized for Gemini image generation and also work on ChatGPT/DALL-E.
You write in two styles:
1. CINEMATIC / EDITORIAL: Ultra-detailed identity-lock prompts with lighting, camera, outfit, pose details (like Midjourney professionals).
2. TRENDING INSTAGRAM: Aesthetic, visually viral prompts that match current social media trends.
You mix both styles naturally.
RULES:
- Always include: pose, lighting, camera details, outfit, background, mood, realism notes.
- End prompts with Midjourney parameters if cinematic: --ar 4:5 --v 6 --style raw --q 2 --s 100
- Be specific, detailed, professional. No generic prompts.
- Output ONLY the prompt text. Nothing else.`;

  const user = `Write a premium AI image generation prompt.
Theme: ${theme}
Tag name: ${tag}
Make it detailed, professional, and mix cinematic + trending Instagram aesthetic styles.`;

  const prompt = await callGemini(system, user);
  log("✍️ Prompt Writer", "Prompt generated successfully.", "success");
  return prompt.trim();
}

// ─── AGENT 3: QUALITY CHECKER (LEADER REVIEW) ────────────────
async function qualityCheckerAgent(prompt, tag) {
  log("👑 Leader", "Reviewing prompt quality...");

  const system = `You are the LEADER AGENT reviewing an AI image prompt for AESTHETIX — a premium prompt website.
Evaluate strictly. Respond ONLY in this exact JSON format (no markdown, no extra text):
{"verdict":"APPROVED" or "NEEDS_REVISION","score":1-10,"reason":"one line"}`;

  const user = `Tag: ${tag}\nPrompt:\n${prompt}`;
  const raw  = await callGemini(system, user);

  try {
    const clean   = raw.replace(/```json|```/g, "").trim();
    const review  = JSON.parse(clean);
    log("👑 Leader", `Verdict: ${review.verdict} | Score: ${review.score}/10 | ${review.reason}`,
        review.verdict === "APPROVED" ? "success" : "warn");
    return review;
  } catch {
    log("👑 Leader", "Review parse failed, defaulting to APPROVED", "warn");
    return { verdict: "APPROVED", score: 7, reason: "Auto-approved" };
  }
}

// ─── AGENT 4: IMAGE GENERATOR ────────────────────────────────
async function imageGeneratorAgent(prompt) {
  log("🖼️ Image Gen", "Building Pollinations.ai image URL...");
  const url = buildImageUrl(prompt);
  log("🖼️ Image Gen", "Image URL ready.", "success");
  return url;
}

// ─── AGENT 5: PUBLISHER ──────────────────────────────────────
async function publisherAgent(tag, prompt, imageUrl) {
  log("📤 Publisher", "Reading current data.json from GitHub...");
  const { data, sha } = await readDataJson();

  // Generate new unique ID
  const maxId = data.reduce((m, p) => Math.max(m, parseInt(p.id) || 0), 0);
  const newId  = String(maxId + 1);

  const newPrompt = {
    tag,
    image: imageUrl,
    prompt,
    status: "draft",   // You manually approve in dashboard
    id: newId,
    slot: PROMPT_SLOT,
    generated_at: new Date().toISOString()
  };

  data.push(newPrompt);

  log("📤 Publisher", `Publishing prompt #${newId} as DRAFT to GitHub...`);
  const ok = await writeDataJson(data, sha);

  if (ok) {
    log("📤 Publisher", `Prompt #${newId} added to data.json. Vercel will auto-deploy!`, "success");
  } else {
    log("📤 Publisher", "GitHub write failed.", "error");
  }
  return ok;
}

// ─── MAIN ORCHESTRATOR (LEADER AGENT) ───────────────────────
async function runAgents() {
  console.log("\n" + "═".repeat(55));
  console.log(`  🤖 AESTHETIX AI AGENTS — Slot ${PROMPT_SLOT}`);
  console.log("  " + new Date().toLocaleString());
  console.log("═".repeat(55) + "\n");

  try {
    // Step 1: Trend Scout
    const { theme, tag } = await trendScoutAgent();
    await delay(500);

    // Step 2: Prompt Writer
    let prompt = await promptWriterAgent(theme, tag);
    await delay(500);

    // Step 3: Quality Check — retry once if rejected
    let review = await qualityCheckerAgent(prompt, tag);
    if (review.verdict === "NEEDS_REVISION") {
      log("👑 Leader", "Sending back for revision...", "warn");
      prompt = await promptWriterAgent(theme + " (revised, higher quality)", tag);
      review = await qualityCheckerAgent(prompt, tag);
    }

    // Step 4: Generate Image
    const imageUrl = await imageGeneratorAgent(prompt);
    await delay(500);

    // Step 5: Publish as draft
    const published = await publisherAgent(tag, prompt, imageUrl);

    console.log("\n" + "═".repeat(55));
    if (published) {
      console.log(`  ✅ DONE — Draft prompt added. Go approve it in your site!`);
    } else {
      console.log(`  ❌ FAILED — Check GitHub token and repo name.`);
    }
    console.log("═".repeat(55) + "\n");

  } catch (err) {
    log("❌ System", err.message, "error");
    process.exit(1);
  }
}

runAgents();
