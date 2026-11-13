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
  ctx.fillText(title, 256, 108, 442);
  if (subtitle) {
    ctx.font = "italic 30px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#c9b87f";
    ctx.fillText(subtitle, 256, 158, 442);
  }
  if (hint) {
    ctx.font = "24px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#9a8a5e";
    ctx.fillText(hint, 256, 205, 442);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

export function libraryCover(title:string,author:string,leather:string) {
  const key='cover|'+title;
  if(cache.has(key))return cache.get(key)!;
  const ctx=makeCanvas(420,530).getContext('2d')!;
  ctx.fillStyle=leather;ctx.fillRect(0,0,420,530);
  const shade=ctx.createLinearGradient(0,0,420,460);
  shade.addColorStop(0,'#0005');shade.addColorStop(.35,'#ffffff14');shade.addColorStop(1,'#0005');
  ctx.fillStyle=shade;ctx.fillRect(0,0,420,530);
  ctx.strokeStyle='#c8a768';ctx.lineWidth=4;ctx.strokeRect(20,20,380,490);
  ctx.lineWidth=1.5;ctx.strokeRect(29,29,362,472);
  ctx.textAlign='center';ctx.fillStyle='#e8d091';ctx.font='46px Georgia, serif';ctx.fillText('✧',210,126);
  ctx.fillStyle='#fff1d5';ctx.font='bold 46px Georgia, serif';
  const lines=wrapText(ctx,title,346);
  lines.forEach((line,i)=>ctx.fillText(line,210,250+(i-(lines.length-1)/2)*53));
  ctx.fillStyle='#d7c295';ctx.font='italic 25px Georgia, serif';ctx.fillText(author,210,405);
  const texture=new THREE.CanvasTexture(ctx.canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  cache.set(key,texture);return texture;
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
  const arch = new Path2D();
  arch.moveTo(8,506);
  arch.lineTo(8,152);
  arch.quadraticCurveTo(8,65,128,5);
  arch.quadraticCurveTo(248,65,248,152);
  arch.lineTo(248,506);
  arch.closePath();
  ctx.save();
  ctx.clip(arch);
  const light = ctx.createLinearGradient(0,0,230,535);
  light.addColorStop(0,'#94bcc1'); light.addColorStop(.45,'#297d83'); light.addColorStop(1,'#273d5b');
  ctx.fillStyle = light;
  ctx.fillRect(0,0,256,512);
  const colors = ['#c7d6b2','#5aab9d','#467c92','#a7bdad','#b59778'];
  for (let row=0; row<14; row++) for (let col=-1; col<7; col++) {
    const x=col*48+(row%2)*24, y=row*42;
    ctx.beginPath(); ctx.moveTo(x,y-42); ctx.lineTo(x+24,y); ctx.lineTo(x,y+42); ctx.lineTo(x-24,y); ctx.closePath();
    ctx.fillStyle=colors[Math.abs(row*7+col*3)%colors.length]; ctx.globalAlpha=.3; ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle='#345052'; ctx.lineWidth=1.8; ctx.stroke();
  }
  ctx.translate(128,155);
  for (const radius of [91,84,70,34]) {
    ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.lineWidth=radius===84?5:2.5;ctx.strokeStyle='#e8cd8e';ctx.stroke();
  }
  for (let petal=0; petal<12; petal++) {
    ctx.save(); ctx.rotate(petal*Math.PI/6);
    ctx.beginPath(); ctx.moveTo(0,-14);ctx.bezierCurveTo(-21,-38,-15,-58,0,-74);
    ctx.bezierCurveTo(15,-58,21,-38,0,-14);ctx.closePath();
    ctx.fillStyle=petal%2?'#b47675':'#ad9b66';ctx.fill();ctx.strokeStyle='#f0dbaa';ctx.stroke();ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2);ctx.fillStyle='#ffe8a5';ctx.fill();ctx.restore();
  ctx.strokeStyle='#c6ae76'; ctx.lineWidth=6;ctx.stroke(arch);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
