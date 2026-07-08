import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content, bg = "#f6eadc") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#f3ddc8"/>
      </linearGradient>
      <radialGradient id="halo" cx="0.18" cy="0.08" r="0.9">
        <stop offset="0%" stop-color="#ffcb97" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#ffcb97" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#halo)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 34);
  return `
    <text x="72" y="104" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#b14f28">BASE FOCUS SPRINT</text>
    <text x="72" y="220" font-family="Arial, sans-serif" font-size="88" font-weight="900" fill="#351d17">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${296 + index * 42}" font-family="Arial, sans-serif" font-size="33" font-weight="700" fill="#7a5a4d">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, stroke = "#351d17", fg = "#351d17") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="${stroke}" stroke-width="3" opacity="0.95"/>
    <text x="${x + 28}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function panel(x, y, width, height, title, lines, bg = "#fff7ef", accent = "#cf6231") {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${bg}" stroke="#351d17" stroke-opacity="0.12" stroke-width="4"/>
      <circle cx="${x + 42}" cy="${y + 42}" r="10" fill="${accent}"/>
      <text x="${x + 68}" y="${y + 50}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#b14f28">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 24}" y="${y + 112 + index * 38}" font-family="Arial, sans-serif" font-size="${index === 0 ? 34 : 28}" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? "#351d17" : "#6f5144"}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function ring(x, y, minutes, label) {
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="178" fill="#fff7ef" stroke="#f1b07a" stroke-width="22"/>
      <circle cx="${x}" cy="${y}" r="128" fill="#ffe8d4" stroke="#cf6231" stroke-width="16"/>
      <text x="${x}" y="${y - 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#b14f28">${esc(label)}</text>
      <text x="${x}" y="${y + 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="98" font-weight="900" fill="#351d17">${minutes}</text>
      <text x="${x}" y="${y + 88}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#7a5a4d">minutes</text>
    </g>
  `;
}

function button(x, y, width, text, fill, fg = "#fff") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}" stroke="#351d17" stroke-opacity="0.12" stroke-width="4"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Start one sprint.", "Pick a task, choose a short timer, and stamp the focus session on Base before you begin.")}
    ${pill(72, 392, "25 minute sprint", "#ffe0c3")}
    ${pill(336, 392, "Task-first", "#fff8f1")}
    ${ring(294, 820, 25, "Focus sprint")}
    ${panel(566, 540, 646, 292, "Primary action", ["Ship the mobile connect flow", "Minutes: 25", "Note: Make the first action obvious at a glance"])}
    ${panel(72, 1164, 548, 236, "Why it helps", ["Start fast", "Visible commitment"], "#fff8f1", "#f1b07a")}
    ${panel(664, 1164, 548, 236, "How it works", ["One task", "One duration", "One onchain log"], "#fff8f1", "#cf6231")}
    ${button(72, 2522, 1140, "Log sprint on Base", "#cf6231")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("The sprint is live.", "After logging, the session becomes a compact record you can revisit by ID or share as proof of focused work.")}
    ${pill(72, 392, "Confirmed", "#ffe0c3")}
    ${pill(234, 392, "Latest sprint", "#fff8f1")}
    ${panel(72, 540, 1140, 314, "Latest sprint", ["Ship the mobile connect flow", "25 minutes", "Author: 0x9936...9652"], "#fff7ef", "#cf6231")}
    ${ring(300, 1208, 25, "Finished")}
    ${panel(566, 980, 646, 276, "Sprint note", ["Tightened the first screen.", "Reduced clutter and made the wallet action obvious."], "#fff8f1", "#f1b07a")}
    ${panel(566, 1300, 646, 206, "Board state", ["Stored on Base", "Ready for lookup"], "#fff8f1", "#cf6231")}
    ${button(72, 2522, 1140, "View latest sprint", "#351d17")}
  `;
  return frame(content, "#f7e3d0");
}

function screenshot3() {
  const content = `
    ${header("Look up any sprint.", "Pull one session by ID and see the task, minutes, note, author, and date without leaving the board.")}
    ${pill(72, 392, "Sprint #14", "#fff8f1")}
    ${pill(242, 392, "Lookup mode", "#ffe0c3")}
    ${panel(72, 540, 1140, 286, "Lookup result", ["Ship the mobile connect flow", "25 minutes", "May 14, 2026"], "#fff7ef", "#cf6231")}
    ${panel(72, 870, 1140, 302, "Focus note", ["Tightened the first screen.", "Reduced clutter and made the wallet action obvious."], "#fff8f1", "#f1b07a")}
    ${panel(72, 1216, 548, 236, "Author", ["0x9936...9652", "Public work log"], "#fff8f1", "#cf6231")}
    ${panel(664, 1216, 548, 236, "State", ["Sprint found", "Board ready"], "#fff8f1", "#cf6231")}
    ${button(72, 2522, 1140, "Log another sprint", "#cf6231")}
  `;
  return frame(content, "#f4dcc8");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#f6eadc"/>
    <circle cx="512" cy="512" r="354" fill="#fff7ef" stroke="#f1b07a" stroke-width="34"/>
    <circle cx="512" cy="512" r="248" fill="#ffe8d4" stroke="#cf6231" stroke-width="24"/>
    <circle cx="512" cy="512" r="124" fill="#fffaf5"/>
    <path d="M512 512L512 336" stroke="#351d17" stroke-width="28" stroke-linecap="round"/>
    <path d="M512 512L648 596" stroke="#351d17" stroke-width="28" stroke-linecap="round"/>
    <circle cx="512" cy="512" r="26" fill="#351d17"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f6eadc"/>
        <stop offset="100%" stop-color="#f3ddc8"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <circle cx="320" cy="210" r="240" fill="#ffcb97" opacity="0.28"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#351d17">Base Focus Sprint</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#7a5a4d">A timer-style board for focused work sessions, short starts, and visible follow-through on Base.</text>
    ${pill(100, 348, "25 minute focus", "#ffe0c3")}
    ${pill(386, 348, "Task + note", "#fff8f1")}
    ${button(100, 448, 430, "Log sprint", "#cf6231")}
    ${button(560, 448, 430, "Lookup sprint", "#351d17")}
    ${ring(1410, 294, 25, "Focus sprint")}
    ${panel(1110, 604, 700, 230, "Latest sprint", ["Ship the mobile connect flow", "25 minutes", "Ready to look up by ID"], "#fff7ef", "#cf6231")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

for (const file of files) {
  console.log(file);
}
