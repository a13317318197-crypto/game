import React, { useEffect, useRef, useState } from 'react';
import './rotating-portrait.css';

const wrapAngle = value => ((value % 360) + 360) % 360;
const controlAngle = value => value > 0 && wrapAngle(value) === 0 ? 360 : wrapAngle(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function RotateIcon({ direction = 1 }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: `scaleX(${direction})` }}><path d="M19 10a7.5 7.5 0 1 0-1 7M19 4v6h-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function RotatingPortrait({ src, reduceMotion }) {
  const [rotation, setRotation] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [hover, setHover] = useState({ x: 0, y: 0 });
  const [spinning, setSpinning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (reduceMotion) setSpinning(false);
  }, [reduceMotion]);

  useEffect(() => {
    if (!spinning || reduceMotion) return;
    let frame = 0;
    let previousTime = null;
    let visible = false;
    function animate(time) {
      if (previousTime !== null) {
        const elapsed = Math.min(time - previousTime, 64);
        setRotation(value => value + elapsed * .018);
      }
      previousTime = time;
      frame = requestAnimationFrame(animate);
    }
    function updatePlayback() {
      cancelAnimationFrame(frame);
      previousTime = null;
      if (visible && !document.hidden) frame = requestAnimationFrame(animate);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(stageRef.current);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [spinning, reduceMotion]);

  function stopSpin() {
    setSpinning(false);
    setHover({ x: 0, y: 0 });
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return;
    stopSpin();
    const bounds = event.currentTarget.getBoundingClientRect();
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation, pitch, width: bounds.width, height: bounds.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    setDragging(true);
  }

  function movePointer(event) {
    const drag = dragRef.current;
    if (drag && drag.id === event.pointerId) {
      setRotation(drag.rotation + (event.clientX - drag.x) / drag.width * 360);
      setPitch(clamp(drag.pitch - (event.clientY - drag.y) / drag.height * 30, -12, 12));
    } else if (event.pointerType === 'mouse' && !spinning && !reduceMotion) {
      const bounds = event.currentTarget.getBoundingClientRect();
      setHover({ x: (.5 - (event.clientY - bounds.top) / bounds.height) * 6, y: ((event.clientX - bounds.left) / bounds.width - .5) * 10 });
    }
  }

  function endDrag(event) {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function rotateBy(amount) {
    stopSpin();
    setRotation(value => value + amount);
  }

  function reset() {
    stopSpin();
    // Return to the closest full turn, so resetting never spins through previous turns.
    setRotation(value => Math.round(value / 360) * 360);
    setPitch(0);
  }

  function handleKey(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      rotateBy((event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 45 : 15));
    } else if (event.key === 'Home') {
      event.preventDefault();
      reset();
    }
  }

  const angle = Math.round(controlAngle(rotation));
  return <div className="portrait-viewer" data-reveal>
    <div ref={stageRef} className={'portrait-stage' + (dragging ? ' is-dragging' : '') + (spinning ? ' is-spinning' : '')}
      role="group" tabIndex={0} aria-label="可旋转的丁浩轩照片" aria-describedby="portrait-help"
      onPointerDown={startDrag} onPointerMove={movePointer} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
      onPointerLeave={() => { if (!dragRef.current) setHover({ x: 0, y: 0 }); }} onKeyDown={handleKey}>
      <div className="portrait-stage-heading" aria-hidden="true"><span>01 / INTERACTIVE PORTRAIT</span><span>360°</span></div>
      <div className="portrait-ground" aria-hidden="true" />
      <div className="portrait-cast-shadow" aria-hidden="true" />
      <div className="portrait-object" style={{ transform: `rotateX(${pitch + hover.x}deg) rotateY(${rotation + hover.y}deg)` }}>
        <div className="portrait-face portrait-front">
          <img src={src} alt="丁浩轩个人照片" loading="lazy" width="1600" height="2400" draggable="false" />
          <div className="portrait-top"><span>DING HAOXUAN</span><span className="seal" aria-hidden="true">浩<br />轩</span></div>
          <div className="portrait-bottom"><span>ABOUT THE PERSON</span><span>丁浩轩</span></div>
          <span className="portrait-gloss" aria-hidden="true" />
        </div>
        <div className="portrait-face portrait-back" aria-hidden="true">
          <div className="portrait-back-top">DING HAOXUAN<span>PERSONAL ARCHIVE / 01</span></div>
          <svg className="portrait-back-orbit" viewBox="0 0 300 300" fill="none"><circle cx="150" cy="150" r="118" /><ellipse cx="150" cy="150" rx="65" ry="118" transform="rotate(35 150 150)" /><ellipse cx="150" cy="150" rx="65" ry="118" transform="rotate(-35 150 150)" /><path d="M150 20v260M20 150h260" /></svg>
          <div className="portrait-back-mark"><strong>DHX<span>.</span></strong><span>丁 浩 轩</span></div>
          <div className="portrait-back-bottom">每一面，都有自己的故事。<span>A DIFFERENT SIDE.</span></div>
        </div>
        <span className="portrait-edge portrait-edge-left" aria-hidden="true" /><span className="portrait-edge portrait-edge-right" aria-hidden="true" />
        <span className="portrait-edge portrait-edge-top" aria-hidden="true" /><span className="portrait-edge portrait-edge-bottom" aria-hidden="true" />
      </div>
      <span className="portrait-stage-note" aria-hidden="true">DRAG TO EXPLORE</span>
    </div>
    <div className="portrait-controls">
      <div className="portrait-control-row"><span id="portrait-help">左右拖动 · 方向键旋转</span><output htmlFor="portrait-angle" aria-hidden="true">{String(angle).padStart(3, '0')}°</output></div>
      <input id="portrait-angle" className="portrait-angle" type="range" min="0" max="360" step="1" value={angle} aria-label="照片旋转角度" aria-valuetext={`${angle}度`} onChange={event => {
        stopSpin();
        const next = Number(event.target.value);
        setRotation(value => value + next - controlAngle(value));
      }} />
      <div className="portrait-actions">
        <div className="portrait-nudges"><button type="button" aria-label="向左旋转45度" onClick={() => rotateBy(-45)}><RotateIcon direction={-1} /></button><button type="button" aria-label="向右旋转45度" onClick={() => rotateBy(45)}><RotateIcon /></button></div>
        <button type="button" className={'portrait-auto' + (spinning ? ' is-active' : '')} aria-pressed={spinning} disabled={reduceMotion} title={reduceMotion ? '系统已开启减少动态效果，可手动旋转' : undefined} onClick={() => { setHover({ x: 0, y: 0 }); setSpinning(value => !value); }}><span className={spinning ? 'pause-symbol' : 'play-symbol'} aria-hidden="true" />{spinning ? '暂停旋转' : '自动旋转'}</button>
        <button type="button" className="portrait-reset" onClick={reset}>复位 <span aria-hidden="true">↺</span></button>
      </div>
    </div>
  </div>;
}
