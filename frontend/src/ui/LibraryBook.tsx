import { useCallback, useEffect, useRef, useState } from 'react';
import { books, type Book } from '../data/content';
import { audio } from '../audio/AudioEngine';
import type { GestureAction } from '../systems/gestureRecognizer';
import './LibraryBook.css';

const singlePage = '(max-width: 680px)';
function PrintedPage({ book, number }: { book: Book; number: number }) {
  const page = book.pages[number];
  if (!page) return <div className="frontispiece"><i aria-hidden>✧</i><em>{book.title}</em><small>{book.author}</small></div>;
  return <><span className="running-title">{book.title}</span><h3>{page.heading}</h3>
    {page.body.map((line,i)=><p key={i}>{line}</p>)}<small className="folio">{number+1}</small></>;
}

export default function LibraryBook({id}:{id:string}) {
  const book = books.find(b=>b.id===id)!;
  const [narrow,setNarrow] = useState(()=>matchMedia(singlePage).matches);
  const [page,setPage] = useState(0);
  const [next,setNext] = useState<number|null>(null);
  const turning = useRef(false);
  const timer = useRef(0);
  const pages = useRef<HTMLDivElement>(null);
  const step = narrow ? 1 : 2;
  // A broad spread starts with the title opposite page one. An even number
  // of printed pages finishes with a left page opposite the inside cover.
  const right = narrow ? page : Math.floor((page+1)/2)*2;
  const last = narrow ? book.pages.length-1 : Math.floor(book.pages.length/2)*2;
  const turn = useCallback((dir:number) => {
    const target = Math.max(0, Math.min(last,right+dir*step));
    if (turning.current || target===right) return;
    turning.current=true;
    audio.init();
    audio.playSfx('page');
    setNext(target);
    timer.current=window.setTimeout(()=>{
      setPage(Math.min(target,book.pages.length-1));
      setNext(null);
      turning.current=false;
      pages.current?.querySelectorAll('.paper').forEach(sheet=>{sheet.scrollTop=0;});
    },matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 660);
  },[right,step,last,book]);
  useEffect(()=>{
    audio.playSfx('bookOpen');
    const mq=matchMedia(singlePage);
    const resize=()=>{window.clearTimeout(timer.current);turning.current=false;setNext(null);setNarrow(mq.matches);};
    mq.addEventListener('change',resize);
    return ()=>{window.clearTimeout(timer.current);mq.removeEventListener('change',resize);};
  },[]);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1);}};
    const gesture=(e:Event)=>{const a=(e as CustomEvent<GestureAction>).detail;if(a.type==='swipe'&&a.dx)turn(a.dx<0?1:-1);};
    window.addEventListener('keydown',key);window.addEventListener('twi-gesture',gesture);
    return ()=>{window.removeEventListener('keydown',key);window.removeEventListener('twi-gesture',gesture);};
  },[turn]);
  const forward=next!==null && next>right;
  const leftPaper=next!==null && !forward ? next-1 : right-1;
  const rightPaper=next!==null && (narrow || forward) ? next : right;
  return <article className="library-book" data-testid="book-panel" aria-label={book.title}>
    <h2>{book.title}</h2>
    <div ref={pages} className={'binding '+(narrow?'single':'spread')}>
      {!narrow && <section className="paper verso" data-hand-action onClick={()=>turn(-1)}><PrintedPage book={book} number={leftPaper}/></section>}
      <section className="paper recto" data-testid="book-page" data-hand-action onClick={e=>{
        if(window.getSelection()?.toString())return;
        const bounds=e.currentTarget.getBoundingClientRect();
        turn(narrow && right>0 && (right===last || e.clientX-bounds.left<bounds.width*.2) ? -1 : 1);
      }}><PrintedPage book={book} number={rightPaper}/></section>
      {next!==null && <div aria-hidden className={'turning-leaf '+(forward?'forward':'backward')}>
        <div className="paper leaf-front"><PrintedPage book={book} number={forward?right:next}/></div>
        <div className="paper leaf-back"><PrintedPage book={book} number={narrow?(forward?next:right):(forward?next-1:right-1)}/></div>
      </div>}
    </div>
    <nav aria-label="Book pages"><button data-testid="book-prev" aria-label="Previous page" disabled={right===0 || next!==null} onClick={()=>turn(-1)}>←</button>
      <span aria-live="polite">{!narrow && right>0 && right<book.pages.length ? `Pages ${right}–${right+1}` : `Page ${Math.min(right+1,book.pages.length)}`} of {book.pages.length}</span>
      <button data-testid="book-next" aria-label="Next page" disabled={right===last || next!==null} onClick={()=>turn(1)}>→</button></nav>
  </article>;
}
