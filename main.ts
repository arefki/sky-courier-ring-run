// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { buildDossier, canonicalJson } from './vendor/makefun-game.ts';

// Notes I compute from the files being handed in, so the dossier the judge
// reads carries facts about this game instead of only the kit's generic block.
function listFiles(root: string, prefix = ''): { path: string; bytes: number }[] {
  const found: { path: string; bytes: number }[] = [];
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) found.push(...listFiles(root, rel));
    else if (entry.isFile()) found.push({ path: rel, bytes: statSync(join(root, rel)).size });
  }
  return found.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function textAfter(haystack: string, pattern: RegExp): string | null {
  const hit = haystack.match(pattern);
  return hit === null || hit[1] === undefined ? null : hit[1];
}

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, with a plain reason, when the hand-in is incomplete: the game
// folder must hold the entry page and its script, and screenshots/ must hold
// at least one PNG or JPEG render (the first by name is the cover).
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(gameDir)) throw new Error('main.ts: game/ is missing beside main.ts: the entry hands in the game it built');
const gameFiles = listFiles(gameDir);
if (gameFiles.length === 0) throw new Error('main.ts: game/ holds no files: nothing to hand in');
if (!gameFiles.some((f) => f.path === 'index.html')) throw new Error('main.ts: game/index.html is missing: a desktop browser needs the entry page');
if (!gameFiles.some((f) => f.path === 'game.js')) throw new Error('main.ts: game/game.js is missing: the entry page loads its game script from there');
if (!existsSync(shotsDir)) throw new Error('main.ts: screenshots/ is missing beside main.ts: an entry hands in 3 or 4 renders of its game');
const shotFiles = listFiles(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f.path));
if (shotFiles.length === 0) throw new Error('main.ts: screenshots/ holds no PNG or JPEG render: the first by name is the cover');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Enrich the dossier with facts read off the real files: the title from
// game/index.html, the ring count from game/game.js, and both file lists
// with sizes, so the summary describes this game and not just the kit.
const dossierPath = join(out, 'dossier.json');
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8')) as { text: string };
const indexHtml = readFileSync(join(gameDir, 'index.html'), 'utf8');
const gameJs = readFileSync(join(gameDir, 'game.js'), 'utf8');
const title = textAfter(indexHtml, /<title>([^<]*)<\/title>/i) ?? 'unknown';
const rings = textAfter(gameJs, /const RING_COUNT = (\d+);/);
const gameBytes = gameFiles.reduce((sum, f) => sum + f.bytes, 0);
const shotBytes = shotFiles.reduce((sum, f) => sum + f.bytes, 0);
const notes = [
  '',
  '## Hand-in notes',
  '',
  `- Title: ${title}`,
  `- Rings on the course: ${rings ?? 'unknown'}`,
  `- Game files (${gameFiles.length}, ${gameBytes} bytes): ${gameFiles.map((f) => `${f.path} (${f.bytes} B)`).join(', ')}`,
  `- Screenshots (${shotFiles.length}, ${shotBytes} bytes): ${shotFiles.map((f) => `${f.path} (${f.bytes} B)`).join(', ')}`,
  '',
].join('\n');
dossier.text = `${dossier.text.replace(/\n+$/, '\n')}${notes}`;
writeFileSync(dossierPath, canonicalJson(dossier));
