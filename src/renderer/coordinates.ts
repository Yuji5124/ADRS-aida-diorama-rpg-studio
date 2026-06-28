export const TILE_SIZE = 1

export type WorldPosition = {
  x: number
  y: number
  z: number
}

export function mapToWorldPosition(
  x: number,
  y: number,
  mapWidth: number,
  mapHeight: number,
  elevation = 0,
): WorldPosition {
  return {
    x: (x - (mapWidth - 1) / 2) * TILE_SIZE,
    y: elevation,
    z: (y - (mapHeight - 1) / 2) * TILE_SIZE,
  }
}

export function getMapCenter(width: number, height: number): WorldPosition {
  return mapToWorldPosition((width - 1) / 2, (height - 1) / 2, width, height)
}
