import type { GameState } from '../types/gameState'
import type { MapData } from '../types/project'

// Builds the initial runtime state from a map's start position.
// New Game initialization (11-data-model.md): player starts at playerStartPosition.
export function createInitialGameState(map: MapData): GameState {
  return {
    currentMapId: map.id,
    playerPosition: { ...map.playerStartPosition },
  }
}
