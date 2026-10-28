import React, { useEffect, useRef, useState } from 'react';
import DriftWall from './DriftWall';
import { lifePhotos } from './content';
import './life-gallery.css';

export default function LifeGallery({ reduceMotion }) {
  const [playing, setPlaying] = useState(true);
  const [flat, setFlat] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [width, setWidth] = useState(1200);
  const galleryRef = useRef(null);
  const browseRef = useRef(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const isOpen = selectedIndex !== null;
  const isGrid = flat || reduceMotion;
  const selected = isOpen ? lifePhotos[selectedIndex] : null;
  const layout = width < 640 ? { columns: 3, tileWidth: 138, tileHeight: 174, gap: 13 } : width < 1100 ? { columns: 4, tileWidth: 190, tileHeight: 220, gap: 17 } : { columns: 5, tileWidth: 224, tileHeight: 242, gap: 20 };

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(galleryRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  function openPhoto(item, event, fromGrid = false) {
    openerRef.current = fromGrid ? event.currentTarget : browseRef.current;
    setSelectedIndex(lifePhotos.findIndex(photo => photo.id === item.id));
  }

  function closePhoto() { dialogRef.current.close(); }

  function onClose() {
    setSelectedIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }));
  }

  function stepPhoto(direction) {
    setSelectedIndex(value => (value + direction + lifePhotos.length) % lifePhotos.length);
  }

  return <section className="life-gallery" id="moments" ref={galleryRef} aria-labelledby="moments-title">
    <div className="life-gallery-heading" data-reveal><div><span className="eyebrow">OFF THE RECORD / PERSONAL FRAGMENTS</span><h3 id="moments-title">生活，<span>不止一面。</span></h3></div><p>表情包、猫咪、游戏，<br />还有随手留下的日常。</p></div>
    <div className="life-gallery-toolbar"><span>生活与收藏 <i />{String(lifePhotos.length).padStart(2, '0')} 张切片</span><div>
      {!isGrid && <button type="button" className="life-motion-toggle" aria-pressed={!playing} onClick={() => setPlaying(value => !value)}><span className={playing ? 'pause-symbol' : 'play-symbol'} aria-hidden="true" />{playing ? '暂停漂浮' : '继续漂浮'}</button>}
      <button type="button" ref={browseRef} className="life-view-toggle" aria-pressed={isGrid} disabled={reduceMotion} onClick={() => setFlat(value => !value)}><span aria-hidden="true">{isGrid ? '◇' : '⊞'}</span>{isGrid ? '返回漂浮' : '平铺浏览'}</button>
    </div></div>
    <div className={'life-wall-frame' + (isGrid ? ' is-grid' : '')}>
      {isGrid ? <div className="life-photo-grid">{lifePhotos.map(photo => <button key={photo.id} type="button" aria-label={`查看${photo.title}大图`} onClick={event => openPhoto(photo, event, true)}><span><img src={photo.image} alt={photo.alt} loading="lazy" style={{ objectPosition: photo.position }} /></span><span>{photo.title}<span aria-hidden="true">↗</span></span></button>)}</div>
        : <DriftWall items={lifePhotos} {...layout} radius={5} tilt={12} turn={-12} roll={-3} depth={85} speed={24} variance={.35} parallax={.45} pauseOnHover lift={42} fade={.3} dim={.85} overlayColor="#181818" playing={playing && !isOpen} onItemClick={openPhoto} />}
    </div>
    <div className="life-gallery-footer"><span>{isGrid ? '点击照片，查看完整画面。' : '悬停停驻 · 点击看大图'}</span><span>A LITTLE MORE OF ME.</span></div>
    <dialog ref={dialogRef} className="life-photo-dialog" aria-labelledby="life-photo-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) closePhoto(); }} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      {selected && <div className="life-lightbox"><div className="life-lightbox-heading"><div><span>PERSONAL FRAGMENTS / {String(selectedIndex + 1).padStart(2, '0')} — {String(lifePhotos.length).padStart(2, '0')}</span><h4 id="life-photo-title">{selected.title}</h4></div><button type="button" className="dialog-close" aria-label="关闭照片大图" onClick={closePhoto}>×</button></div>
        <div className="life-lightbox-image"><img src={selected.full} alt={selected.alt} /></div>
        <div className="life-lightbox-controls"><button type="button" aria-label="上一张照片" onClick={() => stepPhoto(-1)}>← <span>上一张</span></button><span>左右方向键切换 · ESC 关闭</span><button type="button" aria-label="下一张照片" onClick={() => stepPhoto(1)}><span>下一张</span> →</button></div>
      </div>}
    </dialog>
  </section>;
}
