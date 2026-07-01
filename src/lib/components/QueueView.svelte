<script>
  import { library, queue, selectTrack } from "../store.svelte.js";
  import { convertFileSrc } from "@tauri-apps/api/core";

  let queuedSongs = $derived(queue.items.map((id) => library.songs.find((s) => s.id === id)).filter(Boolean));

  function removeFromQueue(index) {
    queue.items.splice(index, 1);
  }

  function formatDuration(secs) {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
</script>

<div class="queue-view">
  <header class="queue-header">
    <h2 class="queue-title">Queue</h2>
    {#if queue.items.length > 0}
      <span class="queue-count">{queue.items.length} {queue.items.length === 1 ? "song" : "songs"}</span>
    {/if}
  </header>

  {#if queue.items.length === 0}
    <div class="empty-state">
      <span class="material-symbol" style="font-size: 48px; color: var(--color-ink-tertiary)">queue_music</span>
      <h3 class="empty-title">Queue is empty</h3>
      <p class="empty-text">Add songs from your library to play them next.</p>
    </div>
  {:else}
    <div class="queue-list">
      {#each queuedSongs as song, i}
        <button class="queue-row" onclick={() => selectTrack(song.id)}>
          <div class="col-title">
            {#if song.thumbnailPath}
              <img class="thumb" src={convertFileSrc(song.thumbnailPath)} alt="" />
            {:else}
              <div class="thumb-placeholder"></div>
            {/if}
            <div class="queue-meta">
              <span class="song-title">{song.title}</span>
              <span class="song-artist">{song.artist}</span>
            </div>
          </div>
          <span class="col-duration">{formatDuration(song.duration)}</span>
          <span
            class="remove-btn"
            role="button"
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
            onkeydown={(e) => e.key === 'Enter' && removeFromQueue(i)}
            title="Remove from queue">
            <span class="material-symbol">close</span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .queue-view {
    max-width: 640px;
  }

  .queue-header {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .queue-title {
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    color: var(--color-ink-primary);
  }

  .queue-count {
    font-size: 0.875rem;
    color: var(--color-ink-tertiary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px;
    gap: var(--spacing-md);
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-ink-primary);
  }

  .empty-text {
    font-size: 0.875rem;
    color: var(--color-ink-secondary);
    max-width: 380px;
    line-height: 1.5;
    margin: 0;
  }

  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .queue-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    color: var(--color-ink-primary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background-color 150ms;
    width: 100%;
    text-align: left;
    font-family: inherit;
    font-size: 0.875rem;
  }

  .queue-row:hover {
    background: var(--color-surface-hover);
  }

  .col-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
  }

  .thumb, .thumb-placeholder {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    object-fit: cover;
  }

  .thumb-placeholder {
    background: var(--color-surface-hover);
  }

  .queue-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .song-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .song-artist {
    font-size: 0.75rem;
    color: var(--color-ink-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-duration {
    color: var(--color-ink-tertiary);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .remove-btn {
    color: var(--color-ink-tertiary);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-full);
    transition: color 150ms;
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .queue-row:hover .remove-btn {
    opacity: 1;
  }

  .remove-btn:hover {
    color: var(--color-primary);
  }

  .remove-btn .material-symbol {
    font-size: 18px;
  }
</style>
