<script>
  import { lyrics, playerState, library } from "../store.svelte.js";

  let currentSong = $derived(
    library.songs.find((s) => s.id === playerState.currentSongId),
  );
</script>

<div class="lyrics-panel">
  {#if !currentSong}
    <div class="empty-state">
      <span class="material-symbol" style="font-size: 48px; color: var(--color-ink-tertiary)">lyrics</span>
      <h3 class="empty-title">No track selected</h3>
      <p class="empty-text">Start playing a song to see its lyrics here.</p>
    </div>
  {:else if lyrics.synced.length > 0}
    <div class="synced-lyrics">
      {#each lyrics.synced as line, i}
        <p class="lyric-line" class:active={i === lyrics.currentIndex}>{line.text}</p>
      {/each}
    </div>
  {:else if lyrics.plain}
    <div class="plain-lyrics">
      {#each lyrics.plain.split("\n") as line}
        {#if line.trim()}
          <p class="lyric-line">{line}</p>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <span class="material-symbol" style="font-size: 48px; color: var(--color-ink-tertiary)">lyrics</span>
      <h3 class="empty-title">No lyrics found</h3>
      <p class="empty-text">This song doesn't have a matching .lrc or .txt file.</p>
    </div>
  {/if}
</div>

<style>
  .lyrics-panel {
    max-width: 640px;
    margin: 0 auto;
    padding: var(--spacing-lg) 0;
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

  .synced-lyrics, .plain-lyrics {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .lyric-line {
    font-size: 1.125rem;
    line-height: 1.6;
    margin: 0;
    color: var(--color-ink-tertiary);
    transition: color 200ms, font-size 200ms;
  }

  .lyric-line.active {
    color: var(--color-ink-primary);
    font-size: 1.25rem;
    font-weight: 500;
  }

  .plain-lyrics .lyric-line {
    color: var(--color-ink-secondary);
  }
</style>
