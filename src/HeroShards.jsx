import React, { lazy, Suspense, useCallback, useState } from 'react';
import './hero-shards.css';

const AeroShards = lazy(() => import('./AeroShards'));

class ShardBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function HeroShards({ paused, reduceMotion }) {
  const [failed, setFailed] = useState(() => !('gpu' in navigator));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const onError = useCallback(reason => { setFailed(true); setReady(false); setError(reason.message); }, []);
  const onReady = useCallback(() => setReady(true), []);

  return <div className={'hero-shards' + (ready && !failed && !reduceMotion ? ' is-ready' : '') + (paused || reduceMotion ? ' is-paused' : '')}
    aria-hidden="true" data-renderer={reduceMotion ? 'static' : failed ? 'fallback' : ready ? 'webgpu' : 'loading'} data-render-error={error || undefined}>
    <div className="hero-shards-fallback">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{
      '--shard-x': `${8 + (index * 17.3) % 81}%`, '--shard-y': `${7 + (index * 23.7) % 83}%`,
      '--shard-size': `${19 + (index * 13) % 55}px`, '--shard-angle': `${index * 37}deg`,
      '--shard-delay': `${-index * 1.3}s`, '--shard-duration': `${18 + index % 7 * 3}s`,
    }} />)}</div>
    {!failed && !reduceMotion && <ShardBoundary onError={onError}><Suspense fallback={null}><AeroShards shardColor="#606060" accentColor="#c7c7c7" material="chrome" placement="left" markers="none"
      count={460} shardSize={.9} speed={.38} spread={1.05} twist={.8} billow={.7} scale={.95}
      depthOfField={.45} glow={.14} grain={.025} vignette={.55} dpr={1.25}
      mouseInteraction={!paused} mouseStrength={.25} parallax={.3} pulseOnClick={!paused} holdToGather={false}
      intro={!paused} paused={paused} onError={onError} onReady={onReady} /></Suspense></ShardBoundary>}
  </div>;
}
