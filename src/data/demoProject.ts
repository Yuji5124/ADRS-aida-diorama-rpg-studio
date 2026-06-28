import type { MapData, ProjectData, TileId } from '../types/project'

const ground: TileId[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'rock', 'wall'],
  ['wall', 'grass', 'grass', 'grass', 'grass', 'grass', 'road', 'road', 'grass', 'grass', 'grass', 'water', 'water', 'wall'],
  ['wall', 'grass', 'rock', 'grass', 'grass', 'grass', 'road', 'road', 'grass', 'rock', 'grass', 'water', 'water', 'wall'],
  ['wall', 'grass', 'grass', 'grass', 'road', 'road', 'road', 'road', 'road', 'grass', 'grass', 'grass', 'grass', 'wall'],
  ['wall', 'grass', 'grass', 'grass', 'road', 'grass', 'grass', 'grass', 'road', 'grass', 'grass', 'rock', 'grass', 'wall'],
  ['wall', 'water', 'water', 'grass', 'road', 'grass', 'rock', 'grass', 'road', 'grass', 'grass', 'grass', 'grass', 'wall'],
  ['wall', 'water', 'water', 'grass', 'road', 'road', 'road', 'road', 'road', 'road', 'grass', 'grass', 'grass', 'wall'],
  ['wall', 'grass', 'grass', 'grass', 'grass', 'grass', 'road', 'grass', 'grass', 'road', 'grass', 'rock', 'grass', 'wall'],
  ['wall', 'rock', 'grass', 'grass', 'grass', 'grass', 'road', 'grass', 'grass', 'road', 'grass', 'grass', 'grass', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
]

const blockedTiles = new Set<TileId>(['water', 'wall', 'rock'])

export const mapTown: MapData = {
  id: 'map_town',
  name: 'はじまりの村',
  width: 14,
  height: 10,
  layers: {
    ground,
  },
  collision: ground.map((row) =>
    row.map((tileId) => (blockedTiles.has(tileId) ? 1 : 0)),
  ),
  playerStartPosition: { x: 6, y: 8 },
  events: [],
}

export const demoProject: ProjectData = {
  id: 'proj_demo01',
  title: 'ADRS Demo 01',
  maps: [mapTown],
}
