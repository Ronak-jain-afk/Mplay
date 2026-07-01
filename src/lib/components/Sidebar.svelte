<script>
  import { ui, library, importFolder, createPlaylist, deletePlaylist, setActiveView } from "../store.svelte.js";

  let playlists = $derived(library.playlists.filter((p) => !p.isLibrary));
</script>

<div class="sidebar-header">
  <h1 class="logo">mplay</h1>
</div>

<nav class="nav-list">
  <button
    class="nav-item"
    class:active={ui.sidebarActive === "library"}
    onclick={() => setActiveView("library")}
  >
    <span class="material-symbol icon">music_note</span>
    <span class="nav-label">Library</span>
  </button>

  {#if playlists.length > 0}
    <div class="section-label">Playlists</div>
    {#each playlists as pl}
      <div class="playlist-row" class:active={ui.sidebarActive === pl.id}>
        <button class="nav-item playlist-item" onclick={() => setActiveView(pl.id)}>
          <span class="material-symbol icon">list</span>
          <span class="nav-label">{pl.name}</span>
        </button>
        <button
          class="delete-playlist-btn"
          onclick={() => deletePlaylist(pl.id)}
          title="Delete playlist"
        >
          <span class="material-symbol">close</span>
        </button>
      </div>
    {/each}
  {/if}
</nav>

<div class="sidebar-footer">
  <button class="create-btn" onclick={() => {
    const name = prompt("Playlist name");
    if (name?.trim()) createPlaylist(name.trim());
  }}>
    <span class="material-symbol icon">add</span>
    <span>New playlist</span>
  </button>
  <button class="import-btn" onclick={importFolder}>
    <span class="material-symbol icon">folder_open</span>
    <span>Import folder</span>
  </button>
</div>

<style>
  .sidebar-header {
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-ink-primary);
    letter-spacing: -0.02em;
    margin: 0;
  }

  .nav-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .section-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-tertiary);
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-xs);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 12px var(--spacing-md);
    border-radius: var(--radius-lg);
    background: transparent;
    border: none;
    color: var(--color-ink-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 150ms, color 150ms;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .nav-item.active,
  :global(.playlist-row.active) .nav-item {
    background: var(--color-surface-hover);
    color: var(--color-ink-primary);
  }

  .nav-item.active .icon,
  :global(.playlist-row.active) .nav-item .icon {
    color: var(--color-ink-primary);
  }

  .icon {
    font-size: 20px;
    color: var(--color-ink-secondary);
    transition: color 150ms;
    flex-shrink: 0;
  }

  .playlist-row {
    display: flex;
    align-items: center;
    border-radius: var(--radius-lg);
  }

  .playlist-row.active {
    background: var(--color-surface-hover);
  }

  .playlist-item {
    flex: 1;
    border-radius: var(--radius-lg);
  }

  .delete-playlist-btn {
    background: none;
    border: none;
    color: var(--color-ink-tertiary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-full);
    font-family: inherit;
    margin-right: 4px;
    opacity: 0;
    transition: opacity 150ms, color 150ms;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .playlist-row:hover .delete-playlist-btn {
    opacity: 1;
  }

  .delete-playlist-btn:hover {
    color: var(--color-primary);
  }

  .delete-playlist-btn .material-symbol {
    font-size: 16px;
  }

  .sidebar-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: var(--spacing-sm);
  }

  .create-btn, .import-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 12px var(--spacing-md);
    border-radius: var(--radius-lg);
    border: none;
    color: var(--color-ink-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 150ms;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }

  .create-btn {
    background: var(--color-primary);
  }

  .create-btn:hover {
    background: #ff2a5d;
  }

  .import-btn {
    background: var(--color-surface-hover);
  }

  .import-btn:hover {
    background: #333333;
  }
</style>
