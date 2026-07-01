<script>
  import { library, playerState, selectTrack, removeFromPlaylist, deletePlaylist } from "../store.svelte.js";
  import { convertFileSrc } from "@tauri-apps/api/core";

  let { playlist } = $props();

  let songs = $derived(playlist.songIds.map((id) => library.songs.find((s) => s.id === id)).filter(Boolean));

  let contextMenu = $state(null);

  function formatDuration(secs) {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleContext(e, songId) {
    e.preventDefault();
    contextMenu = { x: e.clientX, y: e.clientY, songId };
  }

  function closeContext() { contextMenu = null; }
</script>

<svelte:window onclick={closeContext} />

<div class="playlist-view">
  <header class="playlist-header">
    <div class="playlist-info">
      <h2 class="playlist-title">{playlist.name}</h2>
      <span class="playlist-count">{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
    </div>
    {#if !playlist.isLibrary}
      <button class="delete-btn" onclick={() => deletePlaylist(playlist.id)} title="Delete playlist">
        <span class="material-symbol">delete</span>
      </button>
    {/if}
  </header>

  {#if songs.length === 0}
    <div class="empty-state">
      <span class="material-symbol" style="font-size: 48px; color: var(--color-ink-tertiary)">queue_music</span>
      <h3 class="empty-title">Playlist is empty</h3>
      <p class="empty-text">Songs added to this playlist will appear here.</p>
    </div>
  {:else}
    <div class="song-list">
      <div class="song-list-header">
        <span class="col-num">#</span>
        <span class="col-title">Title</span>
        <span class="col-artist">Artist</span>
        <span class="col-album">Album</span>
        <span class="col-duration">Duration</span>
        <span class="col-action"></span>
      </div>
      {#each songs as song, i}
        <button
          class="song-row"
          class:active={song.id === playerState.currentSongId}
          onclick={() => selectTrack(song.id)}
          oncontextmenu={(e) => handleContext(e, song.id)}>
          <span class="col-num">{i + 1}</span>
          <div class="col-title">
            {#if song.thumbnailPath}
              <img class="thumb" src={convertFileSrc(song.thumbnailPath)} alt="" />
            {:else}
              <div class="thumb-placeholder"></div>
            {/if}
            <span class="song-title">{song.title}</span>
          </div>
          <span class="col-artist">{song.artist}</span>
          <span class="col-album">{song.album}</span>
          <span class="col-duration">{formatDuration(song.duration)}</span>
          <span class="col-action">
            {#if !playlist.isLibrary}
              <span
                class="remove-btn"
                role="button"
                tabindex="0"
                onclick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.id); }}
                onkeydown={(e) => e.key === 'Enter' && removeFromPlaylist(playlist.id, song.id)}
                title="Remove from playlist">
                <span class="material-symbol">close</span>
              </span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

{#if contextMenu}
  <div
    class="context-menu"
    style="left: {contextMenu.x}px; top: {contextMenu.y}px">
    <button
      class="context-item"
      onclick={() => { removeFromPlaylist(playlist.id, contextMenu.songId); contextMenu = null; }}>
      <span class="material-symbol">playlist_remove</span>
      Remove from playlist
    </button>
  </div>
{/if}

<style>
  .playlist-view {
    max-width: 960px;
  }

  .playlist-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
  }

  .playlist-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .playlist-title {
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    color: var(--color-ink-primary);
  }

  .playlist-count {
    font-size: 0.875rem;
    color: var(--color-ink-tertiary);
  }

  .delete-btn {
    background: none;
    border: none;
    color: var(--color-ink-tertiary);
    cursor: pointer;
    padding: 8px;
    border-radius: var(--radius-full);
    transition: color 150ms, background-color 150ms;
    font-family: inherit;
  }

  .delete-btn:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
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

  .song-list {
    display: flex;
    flex-direction: column;
  }

  .song-list-header {
    display: grid;
    grid-template-columns: 32px 1fr 1fr 1fr 64px 28px;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-ink-tertiary);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-surface-hover);
  }

  .song-row {
    display: grid;
    grid-template-columns: 32px 1fr 1fr 1fr 64px 28px;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    align-items: center;
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

  .song-row:hover {
    background: var(--color-surface-hover);
  }

  .song-row.active {
    background: var(--color-surface-hover);
    border-left: 2px solid var(--color-primary);
  }

  .col-num {
    color: var(--color-ink-tertiary);
    font-size: 0.75rem;
    text-align: center;
  }

  .col-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .thumb, .thumb-placeholder {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    object-fit: cover;
  }

  .thumb-placeholder {
    background: var(--color-surface-hover);
  }

  .song-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-artist, .col-album {
    color: var(--color-ink-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-duration {
    color: var(--color-ink-tertiary);
    font-size: 0.75rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .col-action {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--color-ink-tertiary);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-full);
    font-family: inherit;
    transition: color 150ms;
    opacity: 0;
  }

  .song-row:hover .remove-btn {
    opacity: 1;
  }

  .remove-btn:hover {
    color: var(--color-primary);
  }

  .context-menu {
    position: fixed;
    background: var(--color-surface);
    border: 1px solid var(--color-surface-hover);
    border-radius: var(--radius-lg);
    padding: 4px;
    z-index: 1000;
    min-width: 180px;
  }

  .context-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--color-ink-primary);
    cursor: pointer;
    font-size: 0.8125rem;
    border-radius: var(--radius-sm);
    font-family: inherit;
    text-align: left;
  }

  .context-item:hover {
    background: var(--color-surface-hover);
  }

  .context-item .material-symbol {
    font-size: 18px;
    color: var(--color-ink-secondary);
  }
</style>
