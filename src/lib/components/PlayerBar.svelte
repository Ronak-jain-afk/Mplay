<script>
  import {
    playerState,
    library,
    lyrics,
    togglePlay,
    nextTrack,
    previousTrack,
    toggleMute,
    setVolume,
    seek,
  } from "../store.svelte.js";
  import { toggleShuffle, cycleRepeatMode } from "../queue-manager.svelte.js";

  let currentSong = $derived(
    library.songs.find((s) => s.id === playerState.currentSongId),
  );

  function formatTime(secs) {
    if (!secs || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function progressPercent() {
    if (!playerState.duration) return 0;
    return Math.min(100, (playerState.position / playerState.duration) * 100);
  }

  function seekFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * playerState.duration);
  }

  function volumeFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  }

  function volumeIcon() {
    if (playerState.muted) return "volume_off";
    if (playerState.volume > 0.5) return "volume_up";
    if (playerState.volume > 0) return "volume_down";
    return "volume_mute";
  }
</script>

<div class="player-grid">
  <div class="track-info">
    {#if currentSong}
      <div class="track-thumb">
        {#if currentSong.thumbnailPath}
          <img class="thumb-img" src={currentSong.thumbnailPath} alt="" />
        {:else}
          <div class="thumb-placeholder"></div>
        {/if}
      </div>
      <div class="track-meta">
        <span class="track-title">{currentSong.title}</span>
        <span class="track-artist">{currentSong.artist || currentSong.album}</span>
        {#if lyrics.currentLine}
          <span class="track-lyric">{lyrics.currentLine}</span>
        {/if}
      </div>
    {:else}
      <div class="cover-placeholder"></div>
      <div class="track-meta">
        <span class="track-title">No track selected</span>
        <span class="track-artist">Import a folder to get started</span>
      </div>
    {/if}
  </div>

  <div class="playback-controls">
    <div class="controls-row">
      <button class="ctrl-btn" onclick={toggleShuffle} class:active={playerState.shuffleEnabled} title="Shuffle">
        <span class="material-symbol">shuffle</span>
      </button>
      <button class="ctrl-btn" onclick={previousTrack} title="Previous">
        <span class="material-symbol">skip_previous</span>
      </button>
      <button class="ctrl-btn play-btn" onclick={togglePlay} title={playerState.playbackStatus === "Playing" ? "Pause" : "Play"}>
        <span class="material-symbol">{playerState.playbackStatus === "Playing" ? "pause" : "play_arrow"}</span>
      </button>
      <button class="ctrl-btn" onclick={nextTrack} title="Next">
        <span class="material-symbol">skip_next</span>
      </button>
      <button class="ctrl-btn" onclick={cycleRepeatMode} class:active={playerState.repeatMode !== "Off"} title="Repeat">
        <span class="material-symbol">
          {playerState.repeatMode === "One" ? "repeat_one" : "repeat"}
        </span>
      </button>
    </div>
    <div class="progress-row">
      <span class="time">{formatTime(playerState.position)}</span>
      <div class="progress-track" role="slider" aria-label="Seek" aria-valuenow={playerState.position} aria-valuemin={0} aria-valuemax={playerState.duration} tabindex="0" onclick={(e) => seekFromEvent(e)} onkeydown={(e) => e.key === 'Enter' && seek(playerState.position)}>
        <div class="progress-fill" style="width: {progressPercent()}%"></div>
      </div>
      <span class="time">{formatTime(playerState.duration)}</span>
    </div>
  </div>

  <div class="volume-controls">
    <button class="ctrl-btn" onclick={toggleMute} title={playerState.muted ? "Unmute" : "Mute"}>
      <span class="material-symbol">{volumeIcon()}</span>
    </button>
    <div class="volume-track" role="slider" aria-label="Volume" aria-valuenow={playerState.muted ? 0 : Math.round(playerState.volume * 100)} aria-valuemin={0} aria-valuemax={100} tabindex="0" onclick={(e) => volumeFromEvent(e)} onkeydown={(e) => e.key === 'Enter' && setVolume(playerState.volume)}>
      <div class="volume-fill" style="width: {playerState.muted ? 0 : playerState.volume * 100}%"></div>
    </div>
  </div>
</div>

<style>
  .player-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    align-items: center;
    gap: var(--spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }

  .track-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .cover-placeholder,
  .thumb-placeholder {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    flex-shrink: 0;
  }

  .track-thumb {
    flex-shrink: 0;
  }

  .thumb-img {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    object-fit: cover;
  }

  .track-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .track-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-ink-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-artist {
    font-size: 0.75rem;
    color: var(--color-ink-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-lyric {
    font-size: 0.75rem;
    color: var(--color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-style: italic;
  }

  .playback-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .ctrl-btn {
    background: none;
    border: none;
    color: var(--color-ink-primary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-full);
    transition: color 150ms;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
  }

  .ctrl-btn:hover {
    color: var(--color-primary);
  }

  .ctrl-btn.active {
    color: var(--color-primary);
  }

  .play-btn {
    background: var(--color-ink-primary);
    color: #000;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
  }

  .play-btn:hover {
    background: var(--color-primary);
    color: var(--color-ink-primary);
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    max-width: 480px;
  }

  .time {
    font-size: 0.6875rem;
    color: var(--color-ink-tertiary);
    font-variant-numeric: tabular-nums;
    min-width: 32px;
    text-align: center;
  }

  .progress-track {
    flex: 1;
    height: 4px;
    background: var(--color-surface-hover);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-ink-primary);
    border-radius: 2px;
    transition: width 100ms linear;
    max-width: 100%;
  }

  .volume-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    justify-self: end;
  }

  .volume-track {
    width: 80px;
    height: 4px;
    background: var(--color-surface-hover);
    border-radius: 2px;
    cursor: pointer;
  }

  .volume-fill {
    height: 100%;
    background: var(--color-ink-primary);
    border-radius: 2px;
    transition: width 100ms;
  }
</style>
