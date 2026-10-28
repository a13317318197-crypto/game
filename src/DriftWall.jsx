// Adapted from the React Bits JavaScript + CSS component supplied by the user.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DriftWall.css';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const columnFactor = (index, variance) => 1 + variance * (((index * .6180339887 + .35) % 1) * 2 - 1);

export default function DriftWall({
  items = [], columns = 5, tileWidth = 200, tileHeight = 132, gap = 18,
  radius = 14, tilt = 16, turn = -14, roll = 0, perspective = 1200, depth = 120,
  speed = 42, direction = 'up', variance = .45, parallax = .6,
  pauseOnHover = false, lift = 64, fade = .6, dim = .55, grayscale = false,
  overlayColor = '#060010', playing = true, onItemClick, className = '', style,
}) {
  const containerRef = useRef(null);
  const planeRef = useRef(null);
  const trackRefs = useRef([]);
  const offsetsRef = useRef([]);
  const velocitiesRef = useRef([]);
  const hoveredColRef = useRef(-1);
  const wallHoveredRef = useRef(false);
  const focusedRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const columnCount = Math.max(1, Math.round(columns));
  const planeHeight = containerHeight * 1.65;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = event => setReduced(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height || 600));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columnItems = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => cols[index % columnCount].push(item));
    return cols.map(col => col.length ? col : items.slice(0, 1));
  }, [items, columnCount]);

  const columnMeta = useMemo(() => columnItems.map(col => {
    const copyHeight = Math.max(tileHeight + gap, col.length * (tileHeight + gap));
    return { copyHeight, copies: Math.max(2, Math.ceil(planeHeight / copyHeight) + 2) };
  }), [columnItems, tileHeight, gap, planeHeight]);

  const baseVelocities = useMemo(() => columnItems.map((_, col) =>
    speed * columnFactor(col, variance) * (direction === 'up' ? 1 : -1) * (col % 2 === 0 ? 1 : -1)
  ), [columnItems, speed, direction, variance]);

  const applyPlaneTransform = useCallback((px = 0, py = 0) => {
    if (planeRef.current) planeRef.current.style.transform = `translate(-50%, -50%) scale(1.18) rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) translateZ(${-depth}px)`;
  }, [tilt, turn, roll, depth]);

  useLayoutEffect(() => {
    offsetsRef.current = columnMeta.map((meta, col) => meta.copyHeight * ((col * .37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
    columnMeta.forEach((_, col) => {
      if (trackRefs.current[col]) trackRefs.current[col].style.transform = `translate3d(0, ${-offsetsRef.current[col]}px, 0)`;
    });
    applyPlaneTransform();
  }, [columnMeta, columnItems, applyPlaneTransform]);

  useEffect(() => {
    if (!playing || reduced) return;
    let frame = 0;
    let lastTime = null;
    let inView = false;
    const animate = time => {
      const dt = lastTime === null ? 0 : Math.min(.05, (time - lastTime) / 1000);
      lastTime = time;
      const damp = 1 - Math.exp(-dt / .12);
      pointerDampedRef.current.x += (pointerRef.current.x * parallax * 8 - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (-pointerRef.current.y * parallax * 8 - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);
      columnMeta.forEach((meta, col) => {
        if (focusedRef.current?.col === col) return;
        const paused = (wallHoveredRef.current && pauseOnHover) || focusedRef.current || hoveredColRef.current === col;
        const target = paused ? 0 : baseVelocities[col];
        velocitiesRef.current[col] += (target - velocitiesRef.current[col]) * (1 - Math.exp(-dt / (paused ? .16 : .28)));
        const next = (offsetsRef.current[col] ?? 0) + velocitiesRef.current[col] * dt;
        offsetsRef.current[col] = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        if (trackRefs.current[col]) trackRefs.current[col].style.transform = `translate3d(0, ${-offsetsRef.current[col]}px, 0)`;
      });
      frame = requestAnimationFrame(animate);
    };
    function updatePlayback() {
      cancelAnimationFrame(frame);
      lastTime = null;
      if (inView && !document.hidden) frame = requestAnimationFrame(animate);
    }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updatePlayback(); });
    observer.observe(containerRef.current);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [playing, reduced, baseVelocities, columnMeta, parallax, pauseOnHover, applyPlaneTransform]);

  function handlePointerMove(event) {
    if (event.pointerType === 'touch' || focusedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (parallax > 0 && !reduced) {
      pointerRef.current = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 };
      if (!playing) applyPlaneTransform(pointerRef.current.x * parallax * 8, -pointerRef.current.y * parallax * 8);
    }
    const tile = event.target.closest('[data-tile-id]');
    hoveredColRef.current = tile ? Number(tile.dataset.col) : -1;
    setActiveId(tile?.dataset.tileId ?? null);
  }

  function releasePointer() {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    hoveredColRef.current = -1;
    if (!focusedRef.current) setActiveId(null);
    if (!playing) applyPlaneTransform();
  }

  function focusTile(id, col, itemIndex) {
    focusedRef.current = { id, col };
    setActiveId(id);
    // Keep the unique keyboard target visible, even when its looping copy has drifted away.
    offsetsRef.current[col] = itemIndex * (tileHeight + gap) - planeHeight / 2 + tileHeight / 2;
    velocitiesRef.current[col] = 0;
    if (trackRefs.current[col]) trackRefs.current[col].style.transform = `translate3d(0, ${-offsetsRef.current[col]}px, 0)`;
  }

  function renderTile(item, id, col, copyIndex, itemIndex) {
    const content = <span className="drift-wall__inner"><img src={item.image} alt={item.alt ?? item.title ?? ''} style={{ objectPosition: item.position }} loading="lazy" decoding="async" draggable={false} /><span className="drift-wall__overlay" aria-hidden="true" /><span className="drift-wall__caption" aria-hidden="true">{item.title}<span>↗</span></span></span>;
    const props = {
      className: `drift-wall__tile${activeId === id ? ' is-active' : ''}`,
      'data-tile-id': id, 'data-col': col,
      // Loop copies remain clickable without creating duplicate keyboard or screen-reader stops.
      tabIndex: copyIndex === 0 ? 0 : -1,
      'aria-hidden': copyIndex > 0 ? true : undefined,
      onPointerDown: event => { if (event.pointerType !== 'touch') event.preventDefault(); },
      onFocus: () => focusTile(id, col, itemIndex),
      onBlur: () => { focusedRef.current = null; setActiveId(null); },
    };
    if (onItemClick) return <button key={id} type="button" {...props} aria-label={`查看${item.title}大图`} onClick={event => onItemClick(item, event)}>{content}</button>;
    if (item.href) return <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...props}>{content}</a>;
    return <div key={id} className={props.className} data-tile-id={id} data-col={col} aria-hidden="true">{content}</div>;
  }

  return <div ref={containerRef} className={['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ')}
    style={{ '--dw-tile-w': `${tileWidth}px`, '--dw-tile-h': `${tileHeight}px`, '--dw-gap': `${gap}px`, '--dw-radius': `${radius}px`, '--dw-perspective': `${perspective}px`, '--dw-lift': `${lift}px`, '--dw-dim': dim, '--dw-gray': grayscale ? 1 : 0, '--dw-overlay': overlayColor, '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`, ...style }}
    onPointerMove={handlePointerMove} onPointerEnter={event => { if (event.pointerType !== 'touch') wallHoveredRef.current = true; }} onPointerLeave={releasePointer} onPointerCancel={releasePointer} role="group" aria-label="生活切片漂浮照片墙">
    <div ref={planeRef} className="drift-wall__plane" style={{ height: planeHeight, width: columnCount * (tileWidth + gap) }}>
      {columnItems.map((col, colIndex) => <div className="drift-wall__col" key={colIndex}><div className="drift-wall__track" ref={element => { trackRefs.current[colIndex] = element; }}>
        {Array.from({ length: columnMeta[colIndex].copies }, (_, copyIndex) => col.map((item, itemIndex) => renderTile(item, `${colIndex}-${copyIndex}-${itemIndex}`, colIndex, copyIndex, itemIndex)))}
      </div></div>)}
    </div>
  </div>;
}
