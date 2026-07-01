<script>
  import { onMount, onDestroy } from "svelte";
  import { initApp, library, ui, play, pause, togglePlay, nextTrack, previousTrack } from "./lib/store.svelte.js";
  import { listen } from "@tauri-apps/api/event";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import PlayerBar from "./lib/components/PlayerBar.svelte";
  import LibraryView from "./lib/components/LibraryView.svelte";
  import PlaylistView from "./lib/components/PlaylistView.svelte";
  import QueueView from "./lib/components/QueueView.svelte";
  import LyricsPanel from "./lib/components/LyricsPanel.svelte";

  let activePlaylist = $derived(
    ui.sidebarActive !== "library" && ui.sidebarActive !== "queue" && ui.sidebarActive !== "lyrics" && library.playlists.find((p) => p.id === ui.sidebarActive),
  );

  let cleanup;

  onMount(async () => {
    initApp();

    cleanup = await listen("media-command", (event) => {
      const cmd = event.payload;
      if (typeof cmd === "string") {
        switch (cmd) {
          case "play": play(); break;
          case "pause": pause(); break;
          case "toggle": togglePlay(); break;
          case "next": nextTrack(); break;
          case "previous": previousTrack(); break;
        }
      }
    });
  });

  onDestroy(() => {
    cleanup?.();
  });
</script>

<div class="app-shell">
  <aside class="sidebar">
    <Sidebar />
  </aside>
  <main class="content">
    {#if ui.sidebarActive === "queue"}
      <QueueView />
    {:else if ui.sidebarActive === "lyrics"}
      <LyricsPanel />
    {:else if activePlaylist}
      <PlaylistView playlist={activePlaylist} />
    {:else}
      <LibraryView />
    {/if}
  </main>
  <footer class="player-bar">
    <PlayerBar />
  </footer>
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      "sidebar content"
      "player player";
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg);
    color: var(--color-ink-primary);
  }

  .sidebar {
    grid-area: sidebar;
    background: var(--color-surface);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    overflow-y: auto;
  }

  .content {
    grid-area: content;
    overflow-y: auto;
    padding: var(--spacing-lg);
  }

  .player-bar {
    grid-area: player;
    background: var(--color-surface);
    border-top: 1px solid var(--color-surface-hover);
    padding: var(--spacing-sm) var(--spacing-lg);
    z-index: 10;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);
  }
</style>
