import { playerState, library, queue } from "./store.svelte.js";

function getActivePlaylistSongs() {
  const pl = library.playlists.find((p) => p.id === playerState.activePlaylistId);
  if (!pl) return [];
  return pl.songIds;
}

function findIndexInPlaylist(songId) {
  const ids = getActivePlaylistSongs();
  return ids.indexOf(songId);
}

function shuffleArray(arr, forbiddenIndex) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 1 && forbiddenIndex >= 0 && a[0] === forbiddenIndex) {
    const swap = Math.floor(Math.random() * (a.length - 1)) + 1;
    [a[0], a[swap]] = [a[swap], a[0]];
  }
  return a;
}

export function generateShuffleSequence(playlistLength, forbiddenIndex) {
  const indices = Array.from({ length: playlistLength }, (_, i) => i);
  return shuffleArray(indices, forbiddenIndex);
}

export function getNextTrackId() {
  if (queue.items.length > 0) {
    return queue.items.shift();
  }

  const sourceIds = getActivePlaylistSongs();
  if (sourceIds.length === 0) return null;

  if (playerState.repeatMode === "One") {
    return playerState.currentSongId;
  }

  if (playerState.shuffleEnabled) {
    if (!playerState.shuffledSequence || playerState.shuffledSequence.length === 0) {
      const currentIdx = findIndexInPlaylist(playerState.currentSongId);
      playerState.shuffledSequence = generateShuffleSequence(sourceIds.length, currentIdx);
      playerState.currentSequenceIndex = 0;
    }

    const shuffledIdx = playerState.shuffledSequence[playerState.currentSequenceIndex];
    const nextId = sourceIds[shuffledIdx];
    playerState.currentSequenceIndex++;

    if (playerState.currentSequenceIndex >= playerState.shuffledSequence.length) {
      if (playerState.repeatMode === "All") {
        const lastPlayed = shuffledIdx;
        playerState.shuffledSequence = generateShuffleSequence(sourceIds.length, lastPlayed);
        playerState.currentSequenceIndex = 0;
      } else {
        playerState.shuffledSequence = [];
        playerState.currentSequenceIndex = 0;
        return null;
      }
    }

    return nextId;
  }

  const currentIdx = findIndexInPlaylist(playerState.currentSongId);
  if (currentIdx < 0) return sourceIds[0] || null;

  let nextIdx = currentIdx + 1;
  if (nextIdx >= sourceIds.length) {
    if (playerState.repeatMode === "All") nextIdx = 0;
    else return null;
  }

  return sourceIds[nextIdx];
}

export function toggleShuffle() {
  if (playerState.shuffleEnabled) {
    playerState.shuffleEnabled = false;
    const idx = findIndexInPlaylist(playerState.currentSongId);
    playerState.currentSequenceIndex = idx >= 0 ? idx : 0;
    playerState.shuffledSequence = [];
  } else {
    playerState.shuffleEnabled = true;
    const currentIdx = findIndexInPlaylist(playerState.currentSongId);
    const ids = getActivePlaylistSongs();
    if (ids.length === 0) return;
    playerState.shuffledSequence = generateShuffleSequence(ids.length, currentIdx);
    playerState.shuffledSequence = [currentIdx, ...playerState.shuffledSequence.filter((i) => i !== currentIdx)];
    playerState.currentSequenceIndex = 0;
  }
}

export function cycleRepeatMode() {
  const modes = ["Off", "All", "One"];
  const idx = modes.indexOf(playerState.repeatMode);
  playerState.repeatMode = modes[(idx + 1) % modes.length];
}

export function addToQueue(songIds) {
  queue.items.push(...songIds);
}
