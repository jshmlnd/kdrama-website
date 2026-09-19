import { useEffect, useRef, useState } from 'react';
import { Captions, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Subtitle, { SubtitleTrack } from './Subtitle.jsx';

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const seconds = Math.floor(value);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes % 60).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

export default function VideoPlayer({ src, subtitles = [], title = 'MeiDrama player', onError }) {
  const shellRef = useRef(null);
  const videoRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [captions, setCaptions] = useState(Boolean(subtitles.length));
  const [captionText, setCaptionText] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  function clearHideTimer() {
    clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }

  function revealControls() {
    setControlsVisible(true);
    clearHideTimer();
    if (videoRef.current && !videoRef.current.paused) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }

  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;
    let cancelled = false;
    let hls;

    const updateProgress = () => {
      setCurrent(video.currentTime || 0);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if (video.buffered.length && video.duration) setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
    };
    const onPlay = () => { setPlaying(true); revealControls(); };
    const onPause = () => { setPlaying(false); clearHideTimer(); setControlsVisible(true); };
    const onEnded = () => setPlaying(false);
    const onVolume = () => setVolume(video.muted ? 0 : video.volume);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('volumechange', onVolume);

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.ERROR, (_, data) => data.fatal && onError?.());
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        onError?.();
      }
    }).catch(() => onError?.());

    return () => {
      cancelled = true;
      clearHideTimer();
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('progress', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('volumechange', onVolume);
    };
  }, [src, onError]);

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setBuffered(0);
    setPlaying(false);
    setControlsVisible(true);
    clearHideTimer();
    setCaptions(Boolean(subtitles.length));
    setCaptionText('');
  }, [src, subtitles.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.textTracks).forEach((track) => { track.mode = captions ? 'hidden' : 'disabled'; });
  }, [captions, subtitles]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const tracks = Array.from(video.textTracks);
    const updateCaption = () => {
      if (!captions) {
        setCaptionText('');
        return;
      }
      const track = tracks.find((item) => item.activeCues?.length);
      const text = track ? Array.from(track.activeCues).map((cue) => String(cue.text).replace(/<[^>]*>/g, '')).join('\n') : '';
      setCaptionText(text);
    };
    tracks.forEach((track) => track.addEventListener('cuechange', updateCaption));
    updateCaption();
    return () => tracks.forEach((track) => track.removeEventListener('cuechange', updateCaption));
  }, [captions, subtitles, src]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      revealControls();
    } else {
      video.pause();
    }
  }

  function seek(event) {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = Number(event.target.value);
    setCurrent(video.currentTime);
  }

  function changeVolume(event) {
    const video = videoRef.current;
    const next = Number(event.target.value);
    if (!video) return;
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setVolume(video.muted ? 0 : video.volume || 1);
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  }

  function toggleCaptions() {
    setCaptions((enabled) => !enabled);
  }

  function handleKeyDown(event) {
    if (['INPUT', 'BUTTON'].includes(event.target.tagName)) return;
    const video = videoRef.current;
    if (!video) return;
    if (event.key === ' ' || event.key === 'k') { event.preventDefault(); togglePlay(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); }
    if (event.key === 'ArrowRight') { event.preventDefault(); video.currentTime = Math.min(duration, video.currentTime + 10); }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleMute(); }
  }

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div ref={shellRef} tabIndex="0" onKeyDown={handleKeyDown} onPointerMove={revealControls} onTouchStart={revealControls} onFocus={revealControls} className="group/player relative overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <video ref={videoRef} aria-label={title} playsInline crossOrigin="anonymous" className="aspect-video w-full bg-black" onDoubleClick={toggleFullscreen}>
        {subtitles.map((subtitle) => <SubtitleTrack key={`${subtitle.lang}-${subtitle.url}`} subtitle={subtitle} />)}
      </video>
      <Subtitle text={captionText} />

      {!playing && (
        <button type="button" aria-label="Play video" onClick={togglePlay} className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-content shadow-[0_0_0_10px_rgba(255,77,141,0.18),0_12px_40px_rgba(0,0,0,0.5)] transition hover:scale-105 hover:bg-[#ff679c] focus:outline-none focus:ring-2 focus:ring-white sm:size-20"><Play size={28} fill="currentColor" className="ml-1 sm:size-9" /></button>
      )}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pb-3 pt-12 transition-opacity duration-300 sm:px-5 sm:pb-4 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="relative mb-3 h-1.5 rounded-full bg-white/20">
          <span className="absolute inset-y-0 left-0 rounded-full bg-white/25" style={{ width: `${buffered}%` }} />
          <span className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_12px_rgba(255,77,141,0.75)]" style={{ width: `${progress}%` }} />
          <input aria-label="Seek video" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(current, duration || 0)} onChange={seek} className="absolute inset-x-0 -top-1.5 h-4 w-full cursor-pointer appearance-none bg-transparent accent-primary" />
        </div>
        <div className="flex items-center gap-2 text-white">
          <button type="button" aria-label={playing ? 'Pause video' : 'Play video'} onClick={togglePlay} className="grid size-9 place-items-center rounded-lg transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary"><>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</></button>
          <button type="button" aria-label={volume ? 'Mute video' : 'Unmute video'} onClick={toggleMute} className="grid size-9 place-items-center rounded-lg transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary">{volume ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} className="hidden h-1 w-20 cursor-pointer accent-primary sm:block" />
          <span className="font-mono text-[11px] text-white/75">{formatTime(current)} / {formatTime(duration)}</span>
          <span className="ml-auto flex items-center gap-1">
            {subtitles.length > 0 && <button type="button" aria-label={captions ? 'Hide subtitles' : 'Show subtitles'} aria-pressed={captions} onClick={toggleCaptions} className={`grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary ${captions ? 'bg-primary text-primary-content' : 'hover:bg-white/15'}`}><Captions size={18} /></button>}
            <button type="button" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={toggleFullscreen} className="grid size-9 place-items-center rounded-lg transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary">{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
