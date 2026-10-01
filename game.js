// =====================================================================
//  Rupee Rogue Platformer  -  3스테이지 순환 (일반 → 중간보스 → 보스)
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ---------- 물리 상수 ----------
const GRAVITY = 0.7;
const HOLD_GRAVITY = 0.22;
const MAX_HOLD_FRAMES = 18;
const MOVE_SPEED = 4;
const JUMP_POWER = 10;
const TILE = 40;

// ---------- 타일 종류 ----------
const T_EMPTY = 0, T_SOLID = 1, T_SPIKE = 2, T_CRUMBLE = 3;

// ---------- 스프라이트 생성 (코드로 직접 그림, 외부 이미지 없음) ----------
// 오프스크린 캔버스에 한 번 그려두고 매 프레임 drawImage 로 찍는다.
function makeSprite(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  return { canvas: c, w, h, ready: true };
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function fs(g, fill, stroke = '#2a1a22', lw = 2) { g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }

// 주인공: 은발 + 뿔 + 빨간 눈 + 검은 전투복 + 붉은 망토 + 황금 대검 (오른쪽을 봄)
const SPR_PLAYER = makeSprite(84, 96, g => {
  const cx = 40;
  // 망토
  g.beginPath(); g.moveTo(cx - 14, 46); g.quadraticCurveTo(cx - 30, 70, cx - 22, 90); g.lineTo(cx + 6, 86); g.quadraticCurveTo(cx + 2, 64, cx + 10, 48); g.closePath(); fs(g, '#c62828', '#5a0f0f');
  g.beginPath(); g.moveTo(cx - 12, 50); g.quadraticCurveTo(cx - 22, 70, cx - 16, 84); g.lineTo(cx - 4, 82); g.closePath(); g.fillStyle = 'rgba(255,120,120,0.35)'; g.fill();
  // 대검 (뒤쪽, 대각선)
  g.save(); g.translate(cx + 16, 60); g.rotate(-0.75);
  rr(g, -3, -30, 6, 62, 3); fs(g, '#5a3a1a', '#2a1a0a');
  rr(g, -8, -36, 16, 8, 3); fs(g, '#e6b422', '#7a5a10');
  g.beginPath(); g.moveTo(-6, -36); g.lineTo(6, -36); g.lineTo(4, -78); g.lineTo(0, -86); g.lineTo(-4, -78); g.closePath(); fs(g, '#f3e7b8', '#8a7a40');
  g.beginPath(); g.moveTo(0, -38); g.lineTo(0, -80); g.strokeStyle = 'rgba(120,100,50,0.6)'; g.lineWidth = 1.5; g.stroke();
  g.restore();
  // 다리 / 부츠
  rr(g, cx - 10, 68, 9, 16, 4); fs(g, '#f6d7bd', '#6a4a3a');
  rr(g, cx + 1, 68, 9, 16, 4); fs(g, '#f6d7bd', '#6a4a3a');
  rr(g, cx - 12, 80, 12, 9, 4); fs(g, '#3a2a4a');
  rr(g, cx + 0, 80, 12, 9, 4); fs(g, '#3a2a4a');
  // 몸통 (전투복)
  rr(g, cx - 12, 48, 24, 24, 7); fs(g, '#2b2d4a', '#15162a');
  g.beginPath(); g.moveTo(cx - 8, 50); g.lineTo(cx + 8, 50); g.lineTo(cx, 60); g.closePath(); fs(g, '#f6d7bd', null);
  rr(g, cx - 12, 62, 24, 5, 2); fs(g, '#c62828', '#5a0f0f', 1.5);
  g.fillStyle = '#e6b422'; g.beginPath(); g.arc(cx, 64.5, 2.5, 0, Math.PI * 2); g.fill();
  // 팔
  rr(g, cx - 18, 50, 8, 14, 4); fs(g, '#f6d7bd', '#6a4a3a');
  rr(g, cx + 10, 50, 8, 14, 4); fs(g, '#f6d7bd', '#6a4a3a');
  rr(g, cx - 19, 60, 10, 6, 3); fs(g, '#3a2a4a');
  rr(g, cx + 9, 60, 10, 6, 3); fs(g, '#3a2a4a');
  // 머리
  g.beginPath(); g.arc(cx, 30, 21, 0, Math.PI * 2); fs(g, '#f9e0c8', '#6a4a3a');
  // 머리카락 (은발)
  g.beginPath();
  g.moveTo(cx - 22, 34); g.quadraticCurveTo(cx - 24, 6, cx, 6); g.quadraticCurveTo(cx + 24, 6, cx + 22, 34);
  g.lineTo(cx + 16, 24); g.quadraticCurveTo(cx + 10, 30, cx + 6, 22); g.quadraticCurveTo(cx, 30, cx - 6, 22); g.quadraticCurveTo(cx - 12, 30, cx - 16, 22); g.closePath();
  fs(g, '#e8e8f0', '#8a8aa0');
  g.beginPath(); g.moveTo(cx - 22, 34); g.quadraticCurveTo(cx - 28, 48, cx - 18, 52); g.quadraticCurveTo(cx - 20, 42, cx - 18, 36); g.closePath(); fs(g, '#e8e8f0', '#8a8aa0');
  g.beginPath(); g.moveTo(cx + 22, 34); g.quadraticCurveTo(cx + 28, 48, cx + 18, 52); g.quadraticCurveTo(cx + 20, 42, cx + 18, 36); g.closePath(); fs(g, '#e8e8f0', '#8a8aa0');
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(cx - 8, 13, 6, 2.5, -0.3, 0, Math.PI * 2); g.fill();
  // 뿔
  g.beginPath(); g.moveTo(cx - 14, 12); g.quadraticCurveTo(cx - 24, 0, cx - 12, -2); g.quadraticCurveTo(cx - 10, 6, cx - 6, 10); g.closePath(); fs(g, '#3a2a4a', '#1a1020');
  g.beginPath(); g.moveTo(cx + 14, 12); g.quadraticCurveTo(cx + 24, 0, cx + 12, -2); g.quadraticCurveTo(cx + 10, 6, cx + 6, 10); g.closePath(); fs(g, '#3a2a4a', '#1a1020');
  // 눈 (빨강, 오른쪽 응시)
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx + 2, 32, 4.5, 6, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 14, 32, 4, 6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e53935'; g.beginPath(); g.ellipse(cx + 3.5, 33, 3, 4.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 15, 33, 2.6, 4.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a0a0a'; g.beginPath(); g.ellipse(cx + 4, 34, 1.4, 2.4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 15.5, 34, 1.2, 2.4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + 2, 30, 1.2, 0, Math.PI * 2); g.arc(cx + 13.5, 30, 1, 0, Math.PI * 2); g.fill();
  // 볼터치, 입
  g.fillStyle = 'rgba(255,120,120,0.45)'; g.beginPath(); g.arc(cx - 4, 40, 3, 0, Math.PI * 2); g.arc(cx + 18, 40, 2.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7a3a3a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + 6, 42); g.quadraticCurveTo(cx + 9, 44, cx + 12, 42); g.stroke();
});

// 고블린: 초록 피부, 큰 귀, 뾰족 코, 파란 모히칸, 가죽 허리띠 (왼쪽을 봄)
const SPR_GOBLIN = makeSprite(64, 64, g => {
  const cx = 32;
  // 다리
  rr(g, cx - 12, 46, 10, 14, 4); fs(g, '#3f8f3d', '#1e4a1e');
  rr(g, cx + 2, 46, 10, 14, 4); fs(g, '#3f8f3d', '#1e4a1e');
  // 몸
  rr(g, cx - 13, 30, 26, 20, 8); fs(g, '#5fb85c', '#1e4a1e');
  rr(g, cx - 13, 40, 26, 7, 3); fs(g, '#8b5a2b', '#3a2210', 1.5);
  g.fillStyle = '#e6b422'; g.fillRect(cx - 2, 41, 4, 5);
  // 팔
  rr(g, cx - 20, 32, 8, 14, 4); fs(g, '#5fb85c', '#1e4a1e');
  rr(g, cx + 12, 32, 8, 14, 4); fs(g, '#5fb85c', '#1e4a1e');
  // 귀
  g.beginPath(); g.moveTo(cx - 12, 20); g.lineTo(cx - 30, 10); g.lineTo(cx - 14, 28); g.closePath(); fs(g, '#5fb85c', '#1e4a1e');
  g.beginPath(); g.moveTo(cx + 12, 20); g.lineTo(cx + 30, 10); g.lineTo(cx + 14, 28); g.closePath(); fs(g, '#5fb85c', '#1e4a1e');
  g.fillStyle = '#9fd99a'; g.beginPath(); g.moveTo(cx - 15, 20); g.lineTo(cx - 24, 14); g.lineTo(cx - 15, 25); g.closePath(); g.fill();
  // 머리
  g.beginPath(); g.ellipse(cx, 20, 17, 15, 0, 0, Math.PI * 2); fs(g, '#6cc75f', '#1e4a1e');
  g.fillStyle = '#9fd99a'; g.beginPath(); g.ellipse(cx - 4, 12, 7, 4, -0.3, 0, Math.PI * 2); g.fill();
  // 모히칸
  g.beginPath(); g.moveTo(cx - 10, 8); g.lineTo(cx - 6, -2); g.lineTo(cx - 2, 7); g.lineTo(cx + 2, -3); g.lineTo(cx + 6, 7); g.lineTo(cx + 10, 0); g.lineTo(cx + 12, 10); g.closePath(); fs(g, '#2962ff', '#0d2a7a');
  // 코 (왼쪽으로 뾰족)
  g.beginPath(); g.moveTo(cx - 10, 22); g.lineTo(cx - 26, 26); g.lineTo(cx - 10, 29); g.closePath(); fs(g, '#5fb85c', '#1e4a1e');
  // 눈
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - 7, 19, 4, 4.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 5, 19, 3.5, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(cx - 8.5, 20, 2, 3, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 3.5, 20, 1.8, 2.8, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1e4a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 12, 13); g.lineTo(cx - 3, 15); g.moveTo(cx + 1, 15); g.lineTo(cx + 9, 13); g.stroke();
  // 입 (송곳니)
  g.strokeStyle = '#1e4a1e'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - 8, 30); g.quadraticCurveTo(cx - 2, 34, cx + 6, 30); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 6, 30); g.lineTo(cx - 4, 34); g.lineTo(cx - 2, 30); g.closePath(); g.fill();
});

const fx = document.createElement('canvas');
const fxc = fx.getContext('2d');

function drawSprite(sp, bx, by, w, h, o = {}) {
  if (!sp.ready) return;
  ctx.save();
  ctx.translate(bx, by);
  if (o.flip) ctx.scale(-1, 1);
  ctx.rotate(o.rot || 0);
  ctx.scale(o.sx || 1, o.sy || 1);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.drawImage(sp.canvas, -w / 2 + (o.ox || 0), -h + (o.oy || 0), w, h);
  const tints = [o.tint, o.flash].filter(Boolean);
  for (const t of tints) {
    fx.width = Math.ceil(w); fx.height = Math.ceil(h);
    fxc.clearRect(0, 0, fx.width, fx.height);
    fxc.drawImage(sp.canvas, 0, 0, w, h);
    fxc.globalCompositeOperation = 'source-atop';
    fxc.fillStyle = t;
    fxc.fillRect(0, 0, fx.width, fx.height);
    fxc.globalCompositeOperation = 'source-over';
    ctx.drawImage(fx, -w / 2 + (o.ox || 0), -h + (o.oy || 0));
  }
  ctx.restore();
}

// ---------- 유틸 ----------
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const chance = p => Math.random() < p;
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function outlined(fill, lw = 2, stroke = '#2b1d0e') { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }

// =====================================================================
//  스테이지 / 난이도
// =====================================================================
let stage = 1;                       // 1부터 증가
const stageKind = () => ['normal', 'midboss', 'boss'][(stage - 1) % 3];
const cycle = () => Math.floor((stage - 1) / 3);   // 0,1,2... 3스테이지마다 한 바퀴
const KIND_LABEL = { normal: '일반', midboss: '중간보스', boss: '보스' };

// 난이도 파라미터
function diff() {
  const cy = cycle(), st = (stage - 1) % 3;
  const d = cy * 3 + st;             // 스테이지가 오를수록 선형 증가
  return {
    d,
    enemyChance: Math.min(0.95, 0.5 + d * 0.06),
    enemyHp: 3 + Math.floor(d / 2),
    enemySpeed: 1 + d * 0.08,
    enemyDmg: 20 + Math.floor(d / 3) * 5,
    spikeChance: Math.min(0.8, 0.35 + d * 0.06),
    gapMax: d >= 2 ? 4 : 3,
    crumbleTime: Math.max(28, 55 - d * 4),
    chargerRate: d >= 1 ? Math.min(0.6, 0.2 + d * 0.06) : 0,
    jumperRate: d >= 2 ? Math.min(0.5, 0.15 + d * 0.05) : 0,
    length: Math.min(200, 120 + d * 8),
  };
}

// =====================================================================
//  월드 상태
// =====================================================================
let grid = [], COLS = 0, ROWS = 11, LEVEL_W = 0, LEVEL_H = 0;
let crumbles = new Map();
let rupees = [];
let enemies = [];
let particles = [];
let portal = null;
let spawn = { x: 0, y: 0 };
let decor = [];
let bgBushes = [];
let arena = null;   // 보스 구역 {x0,x1}

const player = {
  x: 0, y: 0, w: 28, h: 44, vx: 0, vy: 0,
  onGround: false, facing: 1, jumping: false, holdFrames: 0,
  walkT: 0, hp: 100, maxHp: 100, invuln: 0, hurtT: 0, attackT: 0, attackHitDone: false,
  deaths: 0, kills: 0,
};

let score = 0, rupeeCount = 0, state = 'play', cameraX = 0, time = 0, shake = 0, seedLabel = 0;
let stateT = 0, banner = null;   // banner: {text, sub, t}

function tileAt(c, r) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return T_EMPTY;
  const t = grid[r][c];
  if (t === T_CRUMBLE) { const cr = crumbles.get(c + ',' + r); if (cr && cr.fallen) return T_EMPTY; }
  return t;
}
const isSolidTile = t => t === T_SOLID || t === T_CRUMBLE;
const portalLocked = () => enemies.some(e => e.alive && e.guard);

// =====================================================================
//  적 생성
// =====================================================================
function makeEnemy(type, x, top, minX, maxX) {
  const D = diff();
  const base = {
    type, x, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: chance(0.5) ? 1 : -1, speed: rand(0.8, 1.4) * D.enemySpeed,
    minX, maxX, hp: D.enemyHp, maxHp: D.enemyHp, dmg: D.enemyDmg, hitT: 0, dead: false, deathT: 0, walkT: 0, alive: true,
    scale: 1, cd: randi(30, 90), dashT: 0, jumpCd: randi(40, 100), guard: false, tint: null, slam: false, summoned: false, name: '고블린',
  };
  if (type === 'charger') { base.tint = 'rgba(255,140,0,0.35)'; base.name = '돌격 고블린'; }
  if (type === 'jumper') { base.tint = 'rgba(80,140,255,0.4)'; base.name = '점프 고블린'; base.speed *= 1.2; }
  if (type === 'midboss') {
    base.scale = 1.6; base.w = 46; base.h = 62; base.hp = base.maxHp = 8 + cycle() * 4; base.dmg = 30 + cycle() * 5;
    base.tint = 'rgba(255,60,60,0.45)'; base.guard = true; base.speed = 1.3 * D.enemySpeed; base.name = '고블린 대장';
  }
  if (type === 'boss') {
    base.scale = 2.4; base.w = 66; base.h = 92; base.hp = base.maxHp = 16 + cycle() * 8; base.dmg = 35 + cycle() * 5;
    base.tint = 'rgba(150,0,255,0.5)'; base.guard = true; base.speed = 1.1 * D.enemySpeed; base.name = '고블린 왕';
  }
  base.y = top * TILE - base.h;
  return base;
}
function addEnemy(c0, c1, top, forcedType) {
  const D = diff();
  let type = forcedType;
  if (!type) {
    const r = Math.random();
    if (r < D.jumperRate) type = 'jumper';
    else if (r < D.jumperRate + D.chargerRate) type = 'charger';
    else type = 'goblin';
  }
  enemies.push(makeEnemy(type, c0 * TILE + 4, top, c0 * TILE, (c1 + 1) * TILE));
}

// =====================================================================
//  절차 생성 맵
// =====================================================================
function fillGround(c0, len, top) {
  for (let c = c0; c < c0 + len && c < COLS; c++) for (let r = top; r < ROWS; r++) grid[r][c] = T_SOLID;
}
function addRupee(c, r, val = 1) { rupees.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, vx: 0, vy: 0, val, t: Math.random() * 100, alive: true, settled: true }); }

function generateLevel() {
  const D = diff();
  const kind = stageKind();
  COLS = D.length + randi(0, 20);
  grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(T_EMPTY));
  crumbles = new Map(); rupees = []; enemies = []; particles = []; decor = []; bgBushes = []; arena = null;
  LEVEL_W = COLS * TILE; LEVEL_H = ROWS * TILE;
  seedLabel = randi(1000, 9999);

  let h = 7, c = 0;
  fillGround(0, 6, h);
  spawn = { x: 2 * TILE, y: h * TILE - 60 };
  c = 6;

  const endLen = kind === 'boss' ? 16 : kind === 'midboss' ? 11 : 6;
  while (c < COLS - endLen - 2) {
    const roll = Math.random();
    if (roll < 0.28) {
      const len = randi(4, 9);
      fillGround(c, len, h);
      if (len >= 5 && chance(D.enemyChance)) addEnemy(c + 1, c + len - 2, h);
      if (len >= 8 && chance(D.enemyChance * 0.5)) addEnemy(c + 1, c + len - 2, h);
      if (len >= 6 && chance(D.spikeChance)) { const s = c + randi(2, len - 3); grid[h - 1][s] = T_SPIKE; if (chance(0.5 + D.d * 0.05) && s + 1 < c + len - 1) grid[h - 1][s + 1] = T_SPIKE; }
      if (chance(0.6)) for (let i = 0; i < randi(1, 3); i++) addRupee(c + randi(0, len - 1), h - 2);
      if (chance(0.45)) {
        const pw = randi(2, 3), pc = c + randi(0, Math.max(0, len - pw)), pr = h - randi(3, 4);
        if (pr >= 1) { for (let i = 0; i < pw; i++) grid[pr][pc + i] = T_SOLID; for (let i = 0; i < pw; i++) if (chance(0.7)) addRupee(pc + i, pr - 1, 2); }
      }
      c += len;
    } else if (roll < 0.48) {
      c += randi(2, D.gapMax);
      const len = randi(3, 5);
      fillGround(c, len, h);
      if (chance(0.5)) addRupee(c + 1, h - 2);
      c += len;
    } else if (roll < 0.63) {
      const dh = chance(0.5) ? -randi(1, 2) : randi(1, 2);
      h = Math.max(4, Math.min(8, h + dh));
      const len = randi(3, 6);
      fillGround(c, len, h);
      if (dh < 0 && chance(0.5)) addRupee(c + 1, h - 2, 2);
      c += len;
    } else if (roll < 0.82) {
      const gap = randi(3, 6 + Math.min(2, D.d));
      for (let i = 0; i < gap; i++) grid[h][c + i] = T_CRUMBLE;
      if (chance(0.6)) addRupee(c + Math.floor(gap / 2), h - 2, 3);
      c += gap;
      const len = randi(3, 5);
      fillGround(c, len, h);
      c += len;
    } else {
      const gap = randi(4, 6);
      const pr = h - randi(1, 2);
      const pc = c + Math.floor(gap / 2) - 1;
      grid[pr][pc] = T_SOLID; grid[pr][pc + 1] = T_SOLID;
      addRupee(pc, pr - 1, 2); addRupee(pc + 1, pr - 1, 2);
      c += gap;
      const len = randi(3, 5);
      fillGround(c, len, h);
      if (len >= 4 && chance(D.enemyChance)) addEnemy(c, c + len - 1, h);
      c += len;
    }
  }
  // ---- 도착 구역 ----
  fillGround(c, COLS - c, h);
  portal = { x: (COLS - 3) * TILE - 10, y: (h - 2) * TILE, w: TILE + 20, h: TILE * 2 };
  arena = { x0: c * TILE, x1: (COLS - 1) * TILE };
  if (kind === 'normal') {
    addEnemy(c + 1, COLS - 5, h);
  } else if (kind === 'midboss') {
    // 중간보스가 포탈 앞을 지킴
    enemies.push(makeEnemy('midboss', (COLS - 7) * TILE, h, arena.x0, arena.x1));
    if (cycle() >= 1) addEnemy(c + 1, COLS - 6, h, 'charger');
  } else {
    // 보스전: 넓은 아레나 + 보스
    enemies.push(makeEnemy('boss', (COLS - 9) * TILE, h, arena.x0, arena.x1));
    // 아레나 위 발판(회피용)
    for (let i = 0; i < 2; i++) { const pc = c + 3 + i * 6; if (h - 3 >= 1) { grid[h - 3][pc] = T_SOLID; grid[h - 3][pc + 1] = T_SOLID; addRupee(pc, h - 4, 2); } }
  }
  enemies = enemies.filter(e => e.x > spawn.x + 200);

  for (let cc = 0; cc < COLS; cc++) for (let r = 1; r < ROWS; r++) {
    if (tileAt(cc, r) === T_SOLID && tileAt(cc, r - 1) === T_EMPTY) {
      const v = hash(cc, r + seedLabel);
      if (v < 0.18) decor.push({ c: cc, r: r - 1, kind: 'grass', v });
      else if (v < 0.30) decor.push({ c: cc, r: r - 1, kind: 'flower', v });
      else if (v < 0.36) decor.push({ c: cc, r: r - 1, kind: 'rock', v });
      else if (v < 0.42) decor.push({ c: cc, r: r - 1, kind: 'mushroom', v });
      else if (v < 0.47) decor.push({ c: cc, r: r - 1, kind: 'fence', v });
    }
  }
  for (let i = 0; i < 40; i++) bgBushes.push({ x: rand(0, LEVEL_W), s: rand(0.6, 1.2), v: Math.random() });
}

// =====================================================================
//  리셋 / 스테이지 전환
// =====================================================================
function resetPlayer() {
  player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0;
  player.onGround = false; player.jumping = false; player.holdFrames = 0;
  player.hp = player.maxHp; player.invuln = 45; player.hurtT = 0; player.attackT = 0;
  for (const cr of crumbles.values()) { cr.fallen = false; cr.timer = 0; cr.respawn = 0; }
}
function startStage() {
  generateLevel();
  state = 'play'; stateT = 0; cameraX = 0;
  resetPlayer();
  const k = stageKind();
  banner = { text: `STAGE ${stage}  ·  ${KIND_LABEL[k]}`, sub: k === 'normal' ? '포탈까지 도달하세요' : k === 'midboss' ? '고블린 대장이 포탈을 봉인했다!' : '고블린 왕을 쓰러뜨려라!', t: 150 };
}
function newGame() {
  stage = 1; score = 0; rupeeCount = 0; player.deaths = 0; player.kills = 0;
  startStage();
}
function nextStage() { stage++; startStage(); }

// =====================================================================
//  입력
// =====================================================================
const keys = {};
let attackPressed = false, confirmPressed = false;
addEventListener('keydown', e => {
  if (!keys[e.code] && ['KeyZ', 'KeyJ', 'KeyX'].includes(e.code)) attackPressed = true;
  if (!keys[e.code] && ['Space', 'Enter'].includes(e.code)) confirmPressed = true;
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR') newGame();
});
addEventListener('keyup', e => keys[e.code] = false);
const left = () => keys.ArrowLeft || keys.KeyA;
const right = () => keys.ArrowRight || keys.KeyD;
const jumpHeld = () => keys.Space || keys.ArrowUp || keys.KeyW;

// =====================================================================
//  파티클
// =====================================================================
function burst(x, y, color, n = 10, spd = 4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(1, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: randi(20, 40), color, size: rand(2, 5) });
  }
}
function floatText(x, y, text, color = '#fff', size = 14) { particles.push({ x, y, vx: 0, vy: -1.2, life: 45, text, color, size }); }

// =====================================================================
//  충돌 이동
// =====================================================================
function moveWithTiles(ent) {
  const EPS = 0.01;
  ent.x += ent.vx;
  let c0 = Math.floor(ent.x / TILE), c1 = Math.floor((ent.x + ent.w - EPS) / TILE);
  let r0 = Math.floor(ent.y / TILE), r1 = Math.floor((ent.y + ent.h - EPS) / TILE);
  ent.hitWall = false;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (isSolidTile(tileAt(c, r))) {
      if (ent.vx > 0) ent.x = c * TILE - ent.w; else if (ent.vx < 0) ent.x = (c + 1) * TILE;
      ent.hitWall = true;
    }
  }
  ent.y += ent.vy;
  const wasGround = ent.onGround;
  ent.onGround = false;
  c0 = Math.floor(ent.x / TILE); c1 = Math.floor((ent.x + ent.w - EPS) / TILE);
  r0 = Math.floor(ent.y / TILE); r1 = Math.floor((ent.y + ent.h - EPS) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const t = tileAt(c, r);
    if (isSolidTile(t)) {
      if (ent.vy > 0) { ent.y = r * TILE - ent.h; ent.vy = 0; ent.onGround = true; ent.groundTile = { c, r, t }; }
      else if (ent.vy < 0) { ent.y = (r + 1) * TILE; ent.vy = 0; }
    }
  }
  ent.landed = !wasGround && ent.onGround;
}

// =====================================================================
//  플레이어 피격 / 사망
// =====================================================================
function hurtPlayer(dmg, fromX) {
  if (player.invuln > 0) return;
  player.hp -= dmg;
  player.invuln = 50; player.hurtT = 18;
  player.vy = -6; player.vx = (player.x + player.w / 2 < fromX ? -1 : 1) * 6;
  shake = 10;
  burst(player.x + player.w / 2, player.y + player.h / 2, '#ff4d4d', 12);
  floatText(player.x + player.w / 2, player.y - 10, `-${dmg}`, '#ff6b6b');
  if (player.hp <= 0) killPlayer('전투 불능');
}
function killPlayer(reason) {
  player.deaths++;
  shake = 14;
  burst(player.x + player.w / 2, player.y + player.h / 2, '#ff4d4d', 25, 6);
  floatText(spawn.x + 14, spawn.y - 20, reason, '#ff9f9f');
  resetPlayer();
}

// =====================================================================
//  적 AI
// =====================================================================
function updateEnemy(e) {
  const pcx = player.x + player.w / 2, ecx = e.x + e.w / 2;
  const dx = pcx - ecx, dy = (player.y + player.h) - (e.y + e.h);
  const near = (rangeX, rangeY = 80) => Math.abs(dx) < rangeX && Math.abs(dy) < rangeY;

  if (e.dead) {
    e.deathT--;
    if (e.deathT <= 0) {
      e.alive = false;
      const pts = e.type === 'boss' ? 500 : e.type === 'midboss' ? 200 : 50;
      burst(ecx, e.y + e.h / 2, '#8be07a', 16 + e.scale * 10, 5 + e.scale);
      score += pts; player.kills++;
      floatText(ecx, e.y, `+${pts}`, '#ffd966', 14 + e.scale * 4);
      const drops = e.type === 'boss' ? 8 : e.type === 'midboss' ? 4 : randi(1, 3);
      for (let i = 0; i < drops; i++) rupees.push({ x: ecx, y: e.y + 10, vx: rand(-3, 3), vy: rand(-8, -4), val: e.guard ? randi(1, 3) : 1, t: 0, alive: true, settled: false });
      if (e.guard) { banner = { text: '포탈 봉인 해제!', sub: '포탈로 이동하세요', t: 120 }; shake = 16; }
    }
    return;
  }

  if (e.hitT > 0) {
    e.hitT--; e.vx *= 0.85;
    if (e.knockY) { e.vy = e.knockY; e.knockY = 0; }
  } else if (e.dashT > 0) {
    // 돌격 중
    e.dashT--;
    e.vx = e.dir * e.speed * 3.5;
    if (e.hitWall) e.dashT = 0;
    if (e.dashT % 3 === 0) particles.push({ x: ecx - e.dir * e.w / 2, y: e.y + e.h - 4, vx: -e.dir * 1.5, vy: -0.5, life: 15, color: 'rgba(200,180,150,0.8)', size: 4 });
  } else {
    // 기본 순찰
    const aheadX = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
    const footC = Math.floor(aheadX / TILE), footR = Math.floor((e.y + e.h + 2) / TILE);
    const wallR = Math.floor((e.y + e.h / 2) / TILE);
    if (e.onGround && (!isSolidTile(tileAt(footC, footR)) || isSolidTile(tileAt(footC, wallR)) || aheadX < e.minX || aheadX > e.maxX)) e.dir *= -1;
    e.vx = e.dir * e.speed;
    e.walkT += 0.2;
    if (e.cd > 0) e.cd--;

    // ---- 타입별 패턴 ----
    if ((e.type === 'charger' || e.type === 'midboss') && e.cd === 0 && near(e.type === 'midboss' ? 300 : 220, 60)) {
      e.dir = dx > 0 ? 1 : -1; e.dashT = e.type === 'midboss' ? 32 : 24; e.cd = e.type === 'midboss' ? 70 : 100;
      floatText(ecx, e.y - 10, '!', '#ffb347', 18);
    }
    if (e.type === 'jumper' && e.onGround && e.cd === 0) {
      e.vy = -9.5; e.dir = dx > 0 ? 1 : -1; e.vx = e.dir * e.speed * 2; e.cd = randi(50, 90);
    }
    if (e.type === 'boss') {
      // 패턴 1: 돌격 / 패턴 2: 점프 내려찍기 / 패턴 3: 반피 이하 소환
      if (e.cd === 0 && near(320, 120)) {
        if (chance(0.5) && e.onGround) { e.slam = true; e.vy = -14; e.dir = dx > 0 ? 1 : -1; e.vx = e.dir * Math.min(6, Math.abs(dx) / 28); e.cd = 110; floatText(ecx, e.y - 20, '내려찍기!', '#e0b0ff', 16); }
        else { e.dir = dx > 0 ? 1 : -1; e.dashT = 36; e.cd = 90; floatText(ecx, e.y - 20, '돌격!', '#ffb347', 16); }
      }
      if (!e.summoned && e.hp <= e.maxHp / 2) {
        e.summoned = true;
        const top = Math.floor((e.y + e.h) / TILE);
        for (let i = -1; i <= 1; i += 2) enemies.push(makeEnemy(cycle() >= 1 ? 'charger' : 'goblin', ecx + i * 90, top, arena.x0, arena.x1));
        banner = { text: '고블린 왕이 부하를 소환했다!', sub: '', t: 90 };
        shake = 10;
      }
    }
  }
  if (e.slam && e.vy > 0 && !e.onGround) e.vy += 0.4;   // 내려찍기 가속
  e.vy += 0.7;
  if (e.vy > 16) e.vy = 16;
  const prevVy = e.vy;
  moveWithTiles(e);
  if (e.slam && e.landed) {
    e.slam = false; e.vx = 0;
    shake = 14;
    for (let i = 0; i < 18; i++) particles.push({ x: ecx + rand(-60, 60), y: e.y + e.h, vx: rand(-3, 3), vy: rand(-5, -1), life: 30, color: '#9a8a7a', size: rand(3, 7) });
    // 충격파: 땅에 서 있는 플레이어가 가까우면 피해
    if (player.onGround && Math.abs(dx) < 150) hurtPlayer(e.dmg, ecx);
    particles.push({ x: ecx, y: e.y + e.h, ring: true, life: 20, color: 'rgba(220,180,255,0.8)', size: 0 });
  }
  if (e.y > LEVEL_H + 60) e.alive = false;
  // 구역 밖으로 못 나가게 (보스류)
  if (e.guard) { if (e.x < e.minX) e.x = e.minX; if (e.x + e.w > e.maxX) e.x = e.maxX - e.w; }
  if (overlap(player, e) && player.hurtT === 0) hurtPlayer(e.dmg, ecx);
}

// =====================================================================
//  업데이트
// =====================================================================
function update() {
  time++;
  if (shake > 0) shake--;
  if (banner) { banner.t--; if (banner.t <= 0) banner = null; }
  particles = particles.filter(p => { if (p.ring) { p.size += 8; p.life--; return p.life > 0; } p.x += p.vx; p.y += p.vy; if (!p.text) p.vy += 0.15; p.life--; return p.life > 0; });

  if (state === 'win') {
    stateT++;
    if (confirmPressed && stateT > 40) { confirmPressed = false; nextStage(); }
    confirmPressed = false;
    return;
  }
  confirmPressed = false;

  const D = diff();

  // ---- 플레이어 ----
  if (player.invuln > 0) player.invuln--;
  if (player.hurtT > 0) player.hurtT--;
  const controllable = player.hurtT < 10;
  if (controllable) {
    player.vx = 0;
    if (left()) { player.vx = -MOVE_SPEED; player.facing = -1; }
    if (right()) { player.vx = MOVE_SPEED; player.facing = 1; }
  } else { player.vx *= 0.9; }
  if (player.vx !== 0 && player.onGround) player.walkT += 0.25;

  if (controllable && jumpHeld() && player.onGround && !player.jumping) {
    player.vy = -JUMP_POWER; player.onGround = false; player.jumping = true; player.holdFrames = 0;
    burst(player.x + player.w / 2, player.y + player.h, '#ffffff', 5, 2);
  }
  if (!jumpHeld() && player.onGround) player.jumping = false;

  let g = GRAVITY;
  if (player.jumping && jumpHeld() && player.vy < 0 && player.holdFrames < MAX_HOLD_FRAMES) { g = HOLD_GRAVITY; player.holdFrames++; }
  else if (player.jumping && !jumpHeld() && player.vy < 0) { player.vy *= 0.85; player.holdFrames = MAX_HOLD_FRAMES; }
  player.vy += g;
  if (player.vy > 15) player.vy = 15;

  // ---- 공격 ----
  if (attackPressed && player.attackT === 0 && controllable) { player.attackT = 20; player.attackHitDone = false; }
  attackPressed = false;
  if (player.attackT > 0) {
    player.attackT--;
    const active = player.attackT <= 15 && player.attackT >= 8;
    if (active && !player.attackHitDone) {
      const hb = { x: player.facing > 0 ? player.x + player.w - 6 : player.x - 46, y: player.y - 6, w: 52, h: player.h + 10 };
      for (const e of enemies) {
        if (e.alive && !e.dead && overlap(hb, e)) {
          e.hp--; e.hitT = 16; e.vx = player.facing * (e.guard ? 2 : 5); e.knockY = e.guard ? -1 : -3; e.dashT = 0;
          burst(e.x + e.w / 2, e.y + e.h / 2, '#ffe680', 10, 5);
          floatText(e.x + e.w / 2, e.y - 6, e.hp > 0 ? '-1' : 'KO!', '#ffe680');
          player.attackHitDone = true;
          shake = Math.max(shake, 3);
          if (e.hp <= 0) { e.dead = true; e.deathT = e.guard ? 60 : 30; }
        }
      }
    }
  }

  // ---- 이동 ----
  moveWithTiles(player);
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > LEVEL_W) player.x = LEVEL_W - player.w;

  // ---- 무너지는 발판 ----
  for (const cr of crumbles.values()) {
    if (cr.fallen) { cr.respawn++; if (cr.respawn > 240) { cr.fallen = false; cr.timer = 0; cr.respawn = 0; } }
    else if (cr.timer > 0 && !cr.standing) cr.timer = Math.max(0, cr.timer - 1);
    cr.standing = false;
  }
  if (player.onGround && player.groundTile && player.groundTile.t === T_CRUMBLE) {
    const c0 = Math.floor(player.x / TILE), c1 = Math.floor((player.x + player.w - 0.01) / TILE);
    const r = player.groundTile.r;
    for (let c = c0; c <= c1; c++) if (grid[r] && grid[r][c] === T_CRUMBLE) {
      const key = c + ',' + r;
      let cr = crumbles.get(key);
      if (!cr) { cr = { timer: 0, fallen: false, respawn: 0, standing: false }; crumbles.set(key, cr); }
      cr.standing = true;
      cr.timer++;
      if (cr.timer > D.crumbleTime && !cr.fallen) {
        cr.fallen = true;
        for (let i = 0; i < 6; i++) particles.push({ x: c * TILE + rand(0, TILE), y: r * TILE + rand(0, 20), vx: rand(-1, 1), vy: rand(0, 2), life: 40, color: '#9a8a7a', size: rand(3, 7) });
        shake = Math.max(shake, 4);
      }
    }
  }

  // ---- 가시 / 낙사 ----
  {
    const c0 = Math.floor(player.x / TILE), c1 = Math.floor((player.x + player.w - 0.01) / TILE);
    const r0 = Math.floor(player.y / TILE), r1 = Math.floor((player.y + player.h - 0.01) / TILE);
    let spiked = false;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (tileAt(c, r) === T_SPIKE) {
      const sb = { x: c * TILE + 6, y: r * TILE + 14, w: TILE - 12, h: TILE - 14 };
      if (overlap(player, sb)) spiked = true;
    }
    if (spiked) killPlayer('가시!');
    else if (player.y > LEVEL_H + 60) killPlayer('추락!');
  }

  // ---- 적 ----
  for (const e of [...enemies]) if (e.alive) updateEnemy(e);

  // ---- 루피 ----
  for (const r of rupees) {
    if (!r.alive) continue;
    r.t++;
    if (!r.settled) {
      r.vy += 0.5; r.x += r.vx; r.y += r.vy;
      const c = Math.floor(r.x / TILE), rr = Math.floor((r.y + 10) / TILE);
      if (r.vy > 0 && isSolidTile(tileAt(c, rr))) { r.y = rr * TILE - 10; r.vy *= -0.4; r.vx *= 0.7; if (Math.abs(r.vy) < 1) { r.settled = true; r.vy = 0; } }
      if (r.y > LEVEL_H + 60) r.alive = false;
    }
    const dx = player.x + player.w / 2 - r.x, dy = player.y + player.h / 2 - r.y;
    if (dx * dx + dy * dy < 30 * 30) {
      r.alive = false; rupeeCount += r.val; score += 10 * r.val;
      burst(r.x, r.y, r.val >= 3 ? '#ff5fa2' : r.val === 2 ? '#4da3ff' : '#4ce07a', 8, 3);
      floatText(r.x, r.y - 10, `+${10 * r.val}`, '#c6ffd4');
    }
  }

  // ---- 골인 ----
  if (portal && overlap(player, portal)) {
    if (portalLocked()) {
      if (time % 30 === 0) floatText(portal.x + portal.w / 2, portal.y - 10, '봉인됨 - 수호자를 처치하라', '#ff8080', 12);
    } else {
      state = 'win'; stateT = 0;
      const bonus = Math.max(0, 300 + stage * 50 - player.deaths * 40);
      score += bonus;
      floatText(player.x, player.y - 20, `클리어 보너스 +${bonus}`, '#ffd966');
    }
  }

  // ---- 카메라 ----
  const target = player.x + player.w / 2 - W / 2;
  cameraX += (target - cameraX) * 0.1;
  cameraX = Math.max(0, Math.min(cameraX, LEVEL_W - W));
}

// =====================================================================
//  배경
// =====================================================================
function skyColors() {
  const k = stageKind();
  if (k === 'boss') return ['#4a2a6a', '#8a4a8a', '#e8b07a'];
  if (k === 'midboss') return ['#5a7ac0', '#b8c8f0', '#ffe4c0'];
  return ['#8ed3ff', '#d3f0ff', '#fff2cf'];
}
function drawBackground() {
  const [s0, s1, s2] = skyColors();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, s0); g.addColorStop(0.55, s1); g.addColorStop(1, s2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = stageKind() === 'boss' ? 'rgba(255,200,120,0.95)' : 'rgba(255,245,180,0.95)';
  ctx.beginPath(); ctx.arc(W - 110, 70, 38, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < 7; i++) {
    const cx = (((i * 270 + time * 0.25) - cameraX * 0.35) % (W + 260) + W + 260) % (W + 260) - 130;
    const cy = 50 + (i % 3) * 36;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.arc(cx + 26, cy - 12, 26, 0, Math.PI * 2); ctx.arc(cx + 56, cy, 20, 0, Math.PI * 2); ctx.arc(cx + 28, cy + 8, 22, 0, Math.PI * 2);
    ctx.closePath(); ctx.fillStyle = 'rgba(160,200,235,0.9)'; ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 18, 0, Math.PI * 2); ctx.arc(cx + 26, cy - 15, 24, 0, Math.PI * 2); ctx.arc(cx + 56, cy - 3, 18, 0, Math.PI * 2);
    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
  }

  ctx.fillStyle = '#b9e6a0';
  for (let i = -1; i < 5; i++) { const bx = i * 520 - (cameraX * 0.2) % 520; ctx.beginPath(); ctx.moveTo(bx, H); ctx.quadraticCurveTo(bx + 260, H - 280, bx + 520, H); ctx.fill(); }
  ctx.fillStyle = '#9ad884';
  for (let i = -1; i < 5; i++) { const bx = i * 380 + 150 - (cameraX * 0.35) % 380; ctx.beginPath(); ctx.moveTo(bx, H); ctx.quadraticCurveTo(bx + 190, H - 190, bx + 380, H); ctx.fill(); }

  for (let i = -1; i < 8; i++) { const tx = i * 240 + 60 - (cameraX * 0.55) % 240; drawTree(tx, 8 * TILE - 10, 0.85); }
  for (const b of bgBushes) {
    const bx = b.x - cameraX * 0.7;
    if (bx < -80 || bx > W + 80) continue;
    const by = 8 * TILE;
    ctx.beginPath();
    ctx.arc(bx, by - 14 * b.s, 16 * b.s, 0, Math.PI * 2); ctx.arc(bx - 16 * b.s, by - 8 * b.s, 13 * b.s, 0, Math.PI * 2); ctx.arc(bx + 16 * b.s, by - 8 * b.s, 13 * b.s, 0, Math.PI * 2);
    ctx.closePath(); ctx.fillStyle = b.v < 0.5 ? '#5aa74f' : '#69b85c'; ctx.fill();
  }
}
function drawTree(x, baseY, s) {
  roundRect(x - 8 * s, baseY - 70 * s, 16 * s, 70 * s, 5 * s); outlined('#8b5a2b', 2);
  ctx.beginPath();
  ctx.arc(x, baseY - 95 * s, 38 * s, 0, Math.PI * 2); ctx.arc(x - 32 * s, baseY - 78 * s, 28 * s, 0, Math.PI * 2); ctx.arc(x + 32 * s, baseY - 78 * s, 28 * s, 0, Math.PI * 2); ctx.arc(x, baseY - 65 * s, 30 * s, 0, Math.PI * 2);
  ctx.closePath(); ctx.fillStyle = '#3f8f3d'; ctx.fill();
  ctx.beginPath();
  ctx.arc(x, baseY - 98 * s, 32 * s, 0, Math.PI * 2); ctx.arc(x - 30 * s, baseY - 80 * s, 22 * s, 0, Math.PI * 2); ctx.arc(x + 30 * s, baseY - 80 * s, 22 * s, 0, Math.PI * 2); ctx.arc(x, baseY - 68 * s, 24 * s, 0, Math.PI * 2);
  ctx.closePath(); ctx.fillStyle = '#6cc75f'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 12 * s, baseY - 110 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
}

// =====================================================================
//  지형
// =====================================================================
function drawTile(c, r) {
  const t = grid[r][c];
  const x = c * TILE, y = r * TILE;
  if (t === T_SOLID) {
    const up = tileAt(c, r - 1) === T_EMPTY;
    const leftE = !isSolidTile(tileAt(c - 1, r)), rightE = !isSolidTile(tileAt(c + 1, r));
    let depth = 0; while (r - depth - 1 >= 0 && isSolidTile(tileAt(c, r - depth - 1))) depth++;
    const deep = depth >= 2;
    ctx.fillStyle = deep ? '#6f5d52' : '#a5683a';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = deep ? 'rgba(0,0,0,0.28)' : 'rgba(80,40,10,0.35)';
    ctx.lineWidth = 1.5;
    const off = (r % 2) * 20;
    ctx.beginPath();
    ctx.moveTo(x, y + 20.5); ctx.lineTo(x + TILE, y + 20.5);
    ctx.moveTo(x + off + 0.5, y); ctx.lineTo(x + off + 0.5, y + 20);
    ctx.moveTo(x + ((off + 20) % 40) + 0.5, y + 20); ctx.lineTo(x + ((off + 20) % 40) + 0.5, y + TILE);
    ctx.stroke();
    const v = hash(c, r);
    ctx.fillStyle = deep ? 'rgba(255,255,255,0.08)' : 'rgba(255,220,170,0.25)';
    ctx.fillRect(x + 3, y + 3, 14, 3);
    ctx.fillRect(x + 23, y + 23, 14, 3);
    if (v < 0.35) { ctx.fillStyle = deep ? '#8a7a6e' : '#c48a5a'; ctx.beginPath(); ctx.ellipse(x + 10 + v * 50, y + 12 + v * 40, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    if (v > 0.8 && !deep) { ctx.fillStyle = '#7a4a22'; ctx.fillRect(x + 6, y + 30, 10, 3); ctx.fillRect(x + 26, y + 8, 8, 3); }
    if (leftE) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y, 4, TILE); }
    if (rightE) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + TILE - 4, y, 4, TILE); }
    if (up) {
      ctx.fillStyle = '#5fbf4d'; ctx.fillRect(x, y, TILE, 14);
      ctx.fillStyle = '#7ddc66';
      ctx.beginPath(); ctx.arc(x + 8, y + 4, 8, 0, Math.PI * 2); ctx.arc(x + 22, y + 3, 9, 0, Math.PI * 2); ctx.arc(x + 34, y + 5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4aa63d'; ctx.fillRect(x, y + 12, TILE, 4);
      ctx.fillRect(x + 6, y + 16, 4, 4); ctx.fillRect(x + 26, y + 16, 5, 3);
      ctx.strokeStyle = '#2b5d1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + TILE, y + 1); ctx.stroke();
      if (leftE) { ctx.fillStyle = '#5fbf4d'; roundRect(x - 3, y - 2, 8, 12, 4); ctx.fill(); }
      if (rightE) { ctx.fillStyle = '#5fbf4d'; roundRect(x + TILE - 5, y - 2, 8, 12, 4); ctx.fill(); }
    }
    ctx.strokeStyle = 'rgba(40,20,5,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  } else if (t === T_SPIKE) {
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 20 + 1, y + TILE); ctx.lineTo(x + i * 20 + 10, y + 8); ctx.lineTo(x + i * 20 + 19, y + TILE);
      ctx.closePath(); outlined('#dcdce6', 2, '#3a3a4a');
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + i * 20 + 8, y + 14, 2, 10);
    }
    ctx.fillStyle = '#8b1e1e'; ctx.fillRect(x + 8, y + 9, 3, 3); ctx.fillRect(x + 28, y + 9, 3, 3);
  } else if (t === T_CRUMBLE) {
    const cr = crumbles.get(c + ',' + r);
    if (cr && cr.fallen) return;
    const timer = cr ? cr.timer : 0;
    const limit = diff().crumbleTime;
    const warn = limit * 0.45;
    const sh = timer > warn ? Math.sin(time * 1.3 + c) * Math.min(4, (timer - warn) / 6) : 0;
    const drop = timer > limit * 0.75 ? (timer - limit * 0.75) * 0.3 : 0;
    ctx.save();
    ctx.translate(sh, drop);
    roundRect(x + 1, y + 6, TILE - 2, 22, 4);
    outlined(timer > limit * 0.75 ? '#b98f6a' : '#c9a27c', 2, '#4a3520');
    ctx.strokeStyle = 'rgba(70,45,25,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 6, y + 13); ctx.lineTo(x + TILE - 6, y + 13); ctx.moveTo(x + 6, y + 21); ctx.lineTo(x + TILE - 6, y + 21); ctx.stroke();
    ctx.strokeStyle = `rgba(40,20,10,${0.35 + Math.min(0.6, timer / limit)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 12, y + 7); ctx.lineTo(x + 18, y + 16); ctx.lineTo(x + 14, y + 27); ctx.moveTo(x + 26, y + 7); ctx.lineTo(x + 24, y + 18); ctx.lineTo(x + 30, y + 27); ctx.stroke();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 5, y + 28); ctx.lineTo(x + 5, y + 36); ctx.moveTo(x + TILE - 5, y + 28); ctx.lineTo(x + TILE - 5, y + 36); ctx.stroke();
    ctx.restore();
    if (timer > warn) { ctx.fillStyle = '#ff5555'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x + TILE / 2, y - 2); ctx.textAlign = 'left'; }
  }
}

function drawDecor(d) {
  const x = d.c * TILE, y = (d.r + 1) * TILE;
  const px = x + 6 + d.v * 24;
  if (d.kind === 'grass') {
    ctx.strokeStyle = '#3f9a36'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px + i * 4 - 4, y); ctx.quadraticCurveTo(px + i * 4 - 6 + Math.sin(time * 0.05 + d.c) * 2, y - 8, px + i * 4 - 2, y - 14); ctx.stroke(); }
  } else if (d.kind === 'flower') {
    ctx.strokeStyle = '#3f9a36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y - 12); ctx.stroke();
    const col = ['#ff6b8a', '#ffd166', '#a78bfa', '#fff'][Math.floor(d.v * 40) % 4];
    ctx.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(px + Math.cos(a) * 4, y - 14 + Math.sin(a) * 4, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(px, y - 14, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (d.kind === 'rock') {
    ctx.beginPath(); ctx.ellipse(px, y - 5, 9, 6, 0, 0, Math.PI * 2); outlined('#9aa0a6', 2, '#4a4f55');
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(px - 3, y - 8, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else if (d.kind === 'mushroom') {
    roundRect(px - 3, y - 9, 6, 9, 2); outlined('#f3e6d0', 1.5);
    ctx.beginPath(); ctx.ellipse(px, y - 10, 9, 6, 0, Math.PI, 0); ctx.closePath(); outlined('#ff7043', 2);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - 3, y - 12, 1.8, 0, Math.PI * 2); ctx.arc(px + 3, y - 13, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (d.kind === 'fence') {
    ctx.fillStyle = '#c8a06a'; ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { roundRect(x + 6 + i * 22, y - 22, 6, 22, 2); ctx.fill(); ctx.stroke(); }
    roundRect(x + 2, y - 17, 36, 4, 1); ctx.fill(); ctx.stroke();
    roundRect(x + 2, y - 8, 36, 4, 1); ctx.fill(); ctx.stroke();
  }
}

// =====================================================================
//  월드 그리기
// =====================================================================
function drawWorld() {
  ctx.save();
  const sx = shake > 0 ? rand(-shake, shake) * 0.6 : 0, sy = shake > 0 ? rand(-shake, shake) * 0.6 : 0;
  ctx.translate(-Math.round(cameraX) + sx, sy);

  const c0 = Math.max(0, Math.floor(cameraX / TILE) - 1), c1 = Math.min(COLS - 1, Math.ceil((cameraX + W) / TILE) + 1);
  for (const d of decor) if (d.c >= c0 && d.c <= c1 && d.kind === 'fence') drawDecor(d);
  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) if (grid[r][c] !== T_EMPTY) drawTile(c, r);
  for (const d of decor) if (d.c >= c0 && d.c <= c1 && d.kind !== 'fence') drawDecor(d);

  // 포탈
  if (portal) {
    const locked = portalLocked();
    const px = portal.x + portal.w / 2, py = portal.y + portal.h / 2 + 6;
    const pulse = 1 + Math.sin(time * 0.1) * 0.05;
    ctx.beginPath(); ctx.ellipse(px, py, 22 * pulse, 36 * pulse, 0, 0, Math.PI * 2); outlined(locked ? '#8a2a2a' : '#5aa8ff', 3);
    ctx.beginPath(); ctx.ellipse(px, py, 13 * pulse, 26 * pulse, 0, 0, Math.PI * 2); ctx.fillStyle = locked ? '#3a1a1a' : '#cfe8ff'; ctx.fill();
    if (locked) {
      // 쇠사슬
      ctx.strokeStyle = '#999'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px - 26, py - 30); ctx.lineTo(px + 26, py + 30); ctx.moveTo(px + 26, py - 30); ctx.lineTo(px - 26, py + 30); ctx.stroke();
      ctx.fillStyle = '#ff5555'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('봉인', px, py - 44); ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 3; i++) { const a = time * 0.05 + i * 2.1; ctx.beginPath(); ctx.arc(px + Math.cos(a) * 18, py + Math.sin(a) * 30, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  for (const r of rupees) {
    if (!r.alive) continue;
    if (r.x < cameraX - 40 || r.x > cameraX + W + 40) continue;
    drawRupee(r.x, r.y + Math.sin(r.t * 0.1) * 3, r.val);
  }

  for (const e of enemies) if (e.alive) drawEnemy(e);
  drawPlayer();

  for (const p of particles) {
    if (p.ring) {
      ctx.globalAlpha = p.life / 20; ctx.strokeStyle = p.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (p.text) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.font = `bold ${p.size || 14}px sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = Math.min(1, p.life / 12);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawRupee(x, y, val) {
  const col = val >= 3 ? ['#ff5fa2', '#c2185b'] : val === 2 ? ['#4da3ff', '#1b5fb8'] : ['#4ce07a', '#1f8a48'];
  const w = 9, h = 14;
  ctx.beginPath();
  ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h / 2); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x, y + h); ctx.lineTo(x - w, y + h / 2); ctx.lineTo(x - w, y - h / 2); ctx.closePath();
  outlined(col[0], 2, col[1]);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x, y - 9); ctx.lineTo(x + 3, y - 4); ctx.lineTo(x - 2, y - 1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w, y - h / 2); ctx.lineTo(x, y - 3); ctx.lineTo(x + w, y - h / 2); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + h); ctx.stroke();
}

// ---------- 캐릭터 ----------
function drawPlayer() {
  const bx = player.x + player.w / 2, by = player.y + player.h;
  const drawH = 62, drawW = SPR_PLAYER.ready ? drawH * SPR_PLAYER.w / SPR_PLAYER.h : 60;
  const inAir = !player.onGround;
  const moving = player.vx !== 0 && player.onGround;
  const walk = moving ? Math.sin(player.walkT * 4) : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(bx, by + 2, 16, 4, 0, 0, Math.PI * 2); ctx.fill();

  let rot = 0, sx = 1, sy = 1, oy = 0, ox = 0;
  if (moving) { rot = walk * 0.08; oy = -Math.abs(walk) * 3; }
  else { sy = 1 + Math.sin(time * 0.08) * 0.02; sx = 1 - Math.sin(time * 0.08) * 0.015; }
  if (inAir) { rot = Math.max(-0.35, Math.min(0.35, player.vy * 0.03)); sy = 1 + Math.min(0.15, Math.abs(player.vy) * 0.012); sx = 1 - Math.min(0.1, Math.abs(player.vy) * 0.008); }
  if (player.attackT > 0) {
    const p = 1 - player.attackT / 20;
    const swing = p < 0.35 ? -0.5 * (p / 0.35) : 0.7 * ((p - 0.35) / 0.65) - 0.5;
    rot = swing; ox = 6 * Math.sin(p * Math.PI);
  }
  if (player.hurtT > 0) rot += Math.sin(time * 2) * 0.15;
  let flash = null;
  if (player.hurtT > 0 && (time % 4 < 2)) flash = 'rgba(255,60,60,0.75)';
  // 무적 시간 점멸은 살짝만 (0.7)
  const alpha = player.invuln > 0 && player.hurtT === 0 && (time % 8 < 3) ? 0.7 : 1;

  drawSprite(SPR_PLAYER, bx, by, drawW, drawH, { flip: player.facing < 0, rot, sx, sy, oy, ox, flash, alpha });

  if (player.attackT > 0 && player.attackT <= 16 && player.attackT >= 7) {
    const p = (16 - player.attackT) / 9;
    ctx.save();
    ctx.translate(bx + player.facing * 22, by - 30);
    ctx.scale(player.facing, 1);
    ctx.strokeStyle = `rgba(255,240,170,${1 - p * 0.7})`; ctx.lineWidth = 6 - p * 3;
    ctx.beginPath(); ctx.arc(0, 0, 28 + p * 10, -1.2 + p * 0.4, 0.9 + p * 0.6); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.9 - p * 0.8})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 24 + p * 10, -1.0 + p * 0.4, 0.8 + p * 0.6); ctx.stroke();
    ctx.restore();
  }
}

function drawEnemy(e) {
  const bx = e.x + e.w / 2, by = e.y + e.h;
  const drawH = 46 * e.scale, drawW = SPR_GOBLIN.ready ? drawH * SPR_GOBLIN.w / SPR_GOBLIN.h : 40 * e.scale;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(bx, by + 2, 14 * e.scale, 4 * e.scale, 0, 0, Math.PI * 2); ctx.fill();
  let rot = 0, sx = 1, sy = 1, oy = 0, flash = null, alpha = 1;
  if (e.dead) {
    const p = 1 - e.deathT / (e.guard ? 60 : 30);
    rot = p * Math.PI * 1.5; sy = 1 - p * 0.8; sx = 1 - p * 0.5; alpha = 1 - p; oy = -p * 20;
    flash = 'rgba(255,255,255,0.6)';
  } else if (e.hitT > 0) {
    flash = e.hitT % 4 < 2 ? 'rgba(255,255,255,0.85)' : 'rgba(255,80,80,0.6)';
    sx = 1.2; sy = 0.85; rot = -e.dir * 0.2;
  } else if (e.dashT > 0) {
    rot = e.dir * 0.25; sx = 1.15; sy = 0.9;
  } else if (e.slam) {
    rot = e.vy < 0 ? -e.dir * 0.3 : 0; sy = e.vy < 0 ? 1.2 : 0.9; sx = e.vy < 0 ? 0.9 : 1.15;
  } else {
    const w = Math.sin(e.walkT * 3);
    rot = w * 0.1; oy = -Math.abs(w) * 2; sy = 1 + Math.abs(w) * 0.05;
  }
  // 돌격/점프 전 예고 반짝임
  if (e.cd > 0 && e.cd < 12 && (e.type === 'charger' || e.guard) && !flash) flash = `rgba(255,200,80,${(12 - e.cd) / 24})`;
  drawSprite(SPR_GOBLIN, bx, by, drawW, drawH, { flip: e.dir > 0, rot, sx, sy, oy, flash, alpha, tint: e.tint });
  if (!e.dead) {
    if (e.guard) {
      // 이름 + 큰 HP바
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(e.name, bx, e.y - 18); ctx.fillText(e.name, bx, e.y - 18); ctx.textAlign = 'left';
      const bw = 60 * e.scale;
      roundRect(bx - bw / 2, e.y - 14, bw, 7, 3); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      roundRect(bx - bw / 2, e.y - 14, bw * e.hp / e.maxHp, 7, 3); ctx.fillStyle = '#ff4d4d'; ctx.fill();
    } else {
      for (let i = 0; i < e.maxHp; i++) { ctx.fillStyle = i < e.hp ? '#ff5c5c' : 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(bx - (e.maxHp - 1) * 4 + i * 8, e.y - 8, 3, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}

// =====================================================================
//  HUD
// =====================================================================
function drawHUD() {
  roundRect(W / 2 - 110, 8, 220, 46, 10);
  ctx.fillStyle = 'rgba(20,16,30,0.75)'; ctx.fill(); ctx.strokeStyle = '#ffd966'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffd966'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SCORE', W / 2, 24);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText(String(score).padStart(6, '0'), W / 2, 47);
  ctx.textAlign = 'left';

  roundRect(10, 8, 150, 46, 10); ctx.fillStyle = 'rgba(20,16,30,0.75)'; ctx.fill();
  drawRupee(30, 31, 1);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`${rupeeCount} 루피`, 46, 30);
  ctx.fillStyle = '#bbb'; ctx.font = '11px sans-serif'; ctx.fillText(`처치 ${player.kills} · 죽음 ${player.deaths}`, 46, 46);

  roundRect(W - 190, 8, 180, 46, 10); ctx.fillStyle = 'rgba(20,16,30,0.75)'; ctx.fill();
  const k = stageKind();
  ctx.fillStyle = k === 'boss' ? '#e0b0ff' : k === 'midboss' ? '#ffb347' : '#bbb'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`STAGE ${stage} · ${KIND_LABEL[k]}`, W - 178, 24);
  ctx.fillStyle = '#888'; ctx.font = '10px sans-serif'; ctx.fillText(`#${seedLabel}`, W - 40, 24);
  const prog = Math.min(1, player.x / (portal ? portal.x : LEVEL_W));
  roundRect(W - 178, 32, 156, 12, 5); ctx.fillStyle = '#333'; ctx.fill();
  ctx.save(); roundRect(W - 178, 32, 156, 12, 5); ctx.clip(); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(W - 178, 32, 156 * prog, 12); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W - 178 + 156 * prog, 38, 4, 0, Math.PI * 2); ctx.fill();

  // 보스 HP 바 (수호자가 있을 때)
  const guard = enemies.find(e => e.alive && e.guard);
  if (guard && Math.abs(guard.x - player.x) < 900) {
    roundRect(W / 2 - 200, 62, 400, 22, 8); ctx.fillStyle = 'rgba(20,16,30,0.8)'; ctx.fill(); ctx.strokeStyle = guard.type === 'boss' ? '#c060ff' : '#ff6060'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); roundRect(W / 2 - 196, 66, 392, 14, 6); ctx.clip();
    ctx.fillStyle = guard.type === 'boss' ? '#a040e0' : '#ff4d4d'; ctx.fillRect(W / 2 - 196, 66, 392 * Math.max(0, guard.hp) / guard.maxHp, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(W / 2 - 196, 66, 392, 7); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${guard.name}  ${Math.max(0, guard.hp)} / ${guard.maxHp}`, W / 2, 78); ctx.textAlign = 'left';
  }

  const barH = 44, y = H - barH;
  ctx.fillStyle = '#2f2a3a'; ctx.fillRect(0, y, W, barH);
  ctx.fillStyle = '#4b4560'; ctx.fillRect(0, y, W, 3);
  ctx.fillStyle = '#ffd966'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`Lv.${stage}`, 14, y + 27);
  ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText('용사', 56, y + 27);
  drawBar(110, y + 12, 220, 18, player.hp / player.maxHp, '#ff5c5c', '#7a1d1d', `HP ${Math.max(0, player.hp)} / ${player.maxHp}`);
  const alive = enemies.filter(e => e.alive && !e.dead).length, total = enemies.length;
  drawBar(345, y + 12, 200, 18, total ? (total - alive) / total : 1, '#8be07a', '#2a5d1d', `몬스터 ${total - alive} / ${total}`);
  drawBar(560, y + 12, 225, 18, (score % 500) / 500, '#ffd24d', '#7a5a1d', `EXP ${score % 500} / 500`);

  // 스테이지 배너
  if (banner) {
    const a = Math.min(1, banner.t / 20);
    ctx.globalAlpha = a;
    roundRect(W / 2 - 220, 100, 440, banner.sub ? 70 : 48, 12); ctx.fillStyle = 'rgba(20,16,30,0.8)'; ctx.fill();
    ctx.fillStyle = '#ffd966'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(banner.text, W / 2, 132);
    if (banner.sub) { ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText(banner.sub, W / 2, 158); }
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }

  if (state === 'win') {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, stateT / 30)})`; ctx.fillRect(0, 0, W, H);
    roundRect(W / 2 - 210, H / 2 - 100, 420, 200, 14); outlined('#fff8e6', 4);
    ctx.fillStyle = '#e07b00'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`STAGE ${stage} 클리어!`, W / 2, H / 2 - 48);
    ctx.fillStyle = '#333'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`SCORE ${score}`, W / 2, H / 2 - 8);
    ctx.font = '15px sans-serif';
    ctx.fillText(`루피 ${rupeeCount} · 처치 ${player.kills} · 죽음 ${player.deaths}회`, W / 2, H / 2 + 24);
    const nk = ['normal', 'midboss', 'boss'][stage % 3];
    ctx.fillStyle = '#555'; ctx.fillText(`다음: STAGE ${stage + 1} (${KIND_LABEL[nk]})`, W / 2, H / 2 + 50);
    ctx.fillStyle = stateT % 60 < 40 ? '#e07b00' : '#999'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Space / Enter 로 다음 스테이지 · R 처음부터', W / 2, H / 2 + 80);
    ctx.textAlign = 'left';
  }
}
function drawBar(x, y, w, h, frac, color, dark, label) {
  roundRect(x, y, w, h, 6); ctx.fillStyle = dark; ctx.fill();
  ctx.save(); roundRect(x, y, w, h, 6); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w, h / 2);
  ctx.restore();
  roundRect(x, y, w, h, 6); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h - 5); ctx.textAlign = 'left';
}

// =====================================================================
//  메인 루프
// =====================================================================
function loop() {
  update();
  drawBackground();
  drawWorld();
  drawHUD();
  requestAnimationFrame(loop);
}
newGame();
loop();
