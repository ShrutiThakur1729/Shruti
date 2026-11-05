import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

const PARCHMENT = "#efe3c2";
const PARCHMENT_SHADE = "#e4d4aa";
const INK = "#3d3223";
const GOLD = "#8a6d33";

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    let line = "";
    for (const word of raw.split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export function plaqueTexture(
  title: string,
  subtitle = "",
  hint = ""
): THREE.CanvasTexture {
  const key = `plaque|${title}|${subtitle}|${hint}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = makeCanvas(512, 256);
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#2c3a2e");
  grad.addColorStop(1, "#1d2a20");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = "#b08d4f";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.strokeRect(22, 22, 468, 212);
  ctx.fillStyle = "#e7d5a4";
  ctx.textAlign = "center";
  ctx.font = "600 44px Cinzel, Georgia, serif";
  ctx.fillText(title.slice(0, 22), 256, 108);
  if (subtitle) {
    ctx.font = "italic 30px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#c9b87f";
    ctx.fillText(subtitle.slice(0, 34), 256, 158);
  }
  if (hint) {
    ctx.font = "24px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#9a8a5e";
    ctx.fillText(hint.slice(0, 44), 256, 205);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

export function pageTexture(
  heading: string,
  paragraphs: string[],
  pageNo: number,
  totalPages: number,
  bookTitle: string
): THREE.CanvasTexture {
  const key = `page|${bookTitle}|${pageNo}|${heading}`;
  if (cache.has(key)) return cache.get(key)!;
  const W = 768,
    H = 960;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, PARCHMENT);
  grad.addColorStop(1, PARCHMENT_SHADE);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // faint ruling
  ctx.strokeStyle = "rgba(120,100,60,0.07)";
  ctx.lineWidth = 1;
  for (let y = 140; y < H - 100; y += 42) {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(W - 70, y);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD;
  ctx.font = "600 34px Cinzel, Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(bookTitle.toUpperCase(), W / 2, 76);
  ctx.strokeStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 96);
  ctx.lineTo(W / 2 + 120, 96);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = "italic 600 44px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(heading.slice(0, 40), W / 2, 156);
  ctx.textAlign = "left";
  ctx.font = "34px 'Cormorant Garamond', Georgia, serif";
  let y = 226;
  for (const para of paragraphs) {
    const lines = wrapText(ctx, para, W - 150);
    for (const line of lines) {
      if (y > H - 90) break;
      ctx.fillText(line, 76, y);
      y += 42;
    }
    y += 24;
  }
  ctx.textAlign = "center";
  ctx.font = "26px 'Cormorant Garamond', Georgia, serif";
  ctx.fillStyle = "#8a7a52";
  ctx.fillText(`— ${pageNo + 1} —`, W / 2, H - 44);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

// spreads a book's pages into [left, right] texture pairs
export function bookSpreads(book: {
  title: string;
  pages: { heading: string; body: string[] }[];
}) {
  const spreads: { left: THREE.CanvasTexture; right: THREE.CanvasTexture; index: number }[] = [];
  const ctx=makeCanvas(768,960).getContext('2d')!;
  ctx.font="34px 'Cormorant Garamond', Georgia, serif";
  const pages:{heading:string;body:string[]}[]=[];
  for(const page of book.pages){
    const lines=page.body.flatMap(p=>[...wrapText(ctx,p,618),'']);
    for(let start=0;start<lines.length;start+=14)pages.push({heading:page.heading+(start?' · continued':''),body:[lines.slice(start,start+14).filter(Boolean).join(' ')]});
  }
  for (let i = 0; i < pages.length; i += 2) {
    const leftPage = pages[i];
    const rightPage = pages[i + 1];
    spreads.push({
      left: pageTexture(leftPage.heading, leftPage.body, i, book.pages.length, book.title),
      right: rightPage
        ? pageTexture(rightPage.heading, rightPage.body, i + 1, book.pages.length, book.title)
        : pageTexture("", [], i + 1, book.pages.length, book.title),
      index: i,
    });
  }
  return spreads;
}

export function bannerTexture(label: string, bg = "#5d2a26"): THREE.CanvasTexture {
  const key = `banner|${label}|${bg}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = makeCanvas(256, 512);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, 28, 512);
  ctx.fillRect(228, 0, 28, 512);
  ctx.strokeStyle = "#c5a45c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(48, 40);
  ctx.lineTo(208, 40);
  ctx.stroke();
  ctx.fillStyle = "#e7d5a4";
  ctx.textAlign = "center";
  ctx.font = "600 64px Cinzel, Georgia, serif";
  ctx.fillText(label.slice(0, 1).toUpperCase(), 128, 240);
  ctx.font = "600 40px Cinzel, Georgia, serif";
  const chars = label.slice(1, 2).toUpperCase();
  ctx.fillText(chars, 128, 310);
  // bottom point
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.lineTo(256, 470);
  ctx.lineTo(128, 512);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function stainedGlassTexture(): THREE.CanvasTexture {
  const key = "stained-glass";
  if (cache.has(key)) return cache.get(key)!;
  const c = makeCanvas(256, 512);
  const ctx = c.getContext("2d")!;
  const cols = ["#2c4a6e", "#7a2e3a", "#3a6e46", "#8a6d33", "#54437a"];
  const rows = 8,
    colsN = 4;
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < colsN; col++) {
      ctx.fillStyle = cols[(r * 3 + col) % cols.length];
      ctx.fillRect((col * 256) / colsN, (r * 512) / rows, 256 / colsN, 512 / rows);
      ctx.strokeStyle = "rgba(20,16,10,0.85)";
      ctx.lineWidth = 4;
      ctx.strokeRect((col * 256) / colsN, (r * 512) / rows, 256 / colsN, 512 / rows);
    }
  // leaded centre diamond
  ctx.fillStyle = "#d8b25f";
  ctx.beginPath();
  ctx.moveTo(128, 176);
  ctx.lineTo(176, 256);
  ctx.lineTo(128, 336);
  ctx.lineTo(80, 256);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
