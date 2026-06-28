import type { GameState } from '../types/gameState'
import type { MapData, MapPosition } from '../types/project'

export type MoveDirection = 'up' | 'down' | 'left' | 'right'

// Keyboard mapping (keyed by KeyboardEvent.code so WASD is layout-independent).
const directionByKeyCode: Record<string, MoveDirection> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

const deltaByDirection: Record<MoveDirection, MapPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function directionFromKeyCode(code: string): MoveDirection | null {
  return directionByKeyCode[code] ?? null
}

// Phase 1-4: grid movement only — one cell per call, no diagonals.
// Collision against blocked tiles is NOT handled yet (commit 5). The only
// guard here is the map boundary: the player cannot leave the map.
export function movePlayer(
  state: GameState,
  direction: MoveDirection,
  map: MapData,
): GameState {
  const delta = deltaByDirection[direction]
  const nextX = state.playerPosition.x + delta.x
  const nextY = state.playerPosition.y + delta.y

  const outOfBounds =
    nextX < 0 || nextX >= map.width || nextY < 0 || nextY >= map.height
  if (outOfBounds) {
    return state
  }

  return {
    ...state,
    playerPosition: { x: nextX, y: nextY },
  }
}
