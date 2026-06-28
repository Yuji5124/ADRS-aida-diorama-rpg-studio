import type { MapId, MapPosition } from './project'

// Runtime state (10-architecture.md §4 / 11-data-model.md GameState).
// Phase 1-4 holds only what grid movement needs. flags / inventory / party /
// scene are added in later phases.
export type GameState = {
  currentMapId: MapId
  playerPosition: MapPosition
}
