<script>
  import { library, ui, importFolder, selectTrack, playerState, addToPlaylist } from "../store.svelte.js";
  import { convertFileSrc } from "@tauri-apps/api/core";

  let searchQuery = $state("");
  let addMenu = $state(null);

  let playlists = $derived(library.playlists.filter((p) => !p.isLibrary));

  function closeAddMenu() { addMenu = null; }

  function formatDuration(secs) {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  let filteredSongs = $derived(
    library.songs.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.album.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
</script>

<svelte:window onclick={closeAddMenu} />

<div class="library">
  <header class="library-header">
    <h2 class="library-title">Library</h2>
    <div class="search-wrapper">
      <span class="material-symbol search-icon">search</span>
      <input
        type="text"
        class="search-input"
        placeholder="Search artists, albums, songs..."
        bind:value={searchQuery}
      />
    </div>
  </header>

  {#if ui.importProgress}
    <div class="import-progress">
      <span class="material-symbol">sync</span>
      <span>{ui.importProgress}</span>
    </div>
  {:else if library.songs.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <span class="material-symbol" style="font-size: 48px">library_music</span>
      </div>
      <h3 class="empty-title">Your library is empty</h3>
      <p class="empty-text">
        Import a folder of music to get started. mplay supports MP3, FLAC, OGG,
        Opus, WAV, M4A, and more.
      </p>
      <button class="import-action" onclick={importFolder}>
        <span class="material-symbol">folder_open</span>
        Import music folder
      </button>
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
      {#each filteredSongs as song, i}
        <button
          class="song-row"
          class:active={song.id === playerState.currentSongId}
          onclick={() => selectTrack(song.id)}>
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
            {#if playlists.length > 0}
              <span
                class="add-btn"
                role="button"
                tabindex="0"
                onclick={(e) => { e.stopPropagation(); addMenu = addMenu === song.id ? null : song.id; }}
                onkeydown={(e) => e.key === 'Enter' && (addMenu = addMenu === song.id ? null : song.id)}
                title="Add to playlist">
                <span class="material-symbol">playlist_add</span>
              </span>
            {/if}
          </span>
        </button>
        {#if addMenu === song.id}
          <div class="add-menu" role="presentation" onclick={(e) => e.stopPropagation()}>
            {#each playlists as pl}
              <button
                class="add-menu-item"
                onclick={() => { addToPlaylist(pl.id, song.id); addMenu = null; }}>
                <span class="material-symbol">list</span>
                {pl.name}
              </button>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .library {
    max-width: 960px;
  }

  .library-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    gap: var(--spacing-md);
  }

  .library-title {
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    color: var(--color-ink-primary);
  }

  .search-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-ink-tertiary);
    font-size: 20px;
    pointer-events: none;
  }

  .search-input {
    background: var(--color-surface-hover);
    border: none;
    border-radius: var(--radius-full);
    padding: 10px 16px 10px 48px;
    color: var(--color-ink-primary);
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    width: 280px;
    transition: background-color 150ms;
  }

  .search-input::placeholder {
    color: var(--color-ink-tertiary);
  }

  .search-input:focus {
    background: var(--color-surface-hover);
    outline: 1px solid var(--color-ink-primary);
  }

  .import-progress {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: 40px;
    color: var(--color-ink-secondary);
    font-size: 0.875rem;
  }

  .import-progress .material-symbol {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

  .empty-icon {
    width: 96px;
    height: 96px;
    border-radius: var(--radius-lg);
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-ink-tertiary);
    margin-bottom: var(--spacing-sm);
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

  .import-action {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: var(--color-primary);
    color: var(--color-ink-primary);
    border: none;
    border-radius: var(--radius-full);
    padding: 10px 20px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 150ms;
    font-family: inherit;
    margin-top: var(--spacing-sm);
  }

  .import-action:hover {
    background: #ff2a5d;
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

  .thumb,
  .thumb-placeholder {
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

  .col-artist,
  .col-album {
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

  .add-btn {
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

  .song-row:hover .add-btn {
    opacity: 1;
  }

  .add-btn:hover {
    color: var(--color-primary);
  }

  .add-menu {
    position: absolute;
    right: var(--spacing-md);
    margin-top: -8px;
    background: var(--color-surface);
    border: 1px solid var(--color-surface-hover);
    border-radius: var(--radius-lg);
    padding: 4px;
    z-index: 100;
    min-width: 160px;
  }

  .add-menu-item {
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

  .add-menu-item:hover {
    background: var(--color-surface-hover);
  }

  .add-menu-item .material-symbol {
    font-size: 18px;
    color: var(--color-ink-secondary);
  }
</style>
