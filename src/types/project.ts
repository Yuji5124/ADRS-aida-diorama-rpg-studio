export type TileId = 'grass' | 'road' | 'water' | 'wall' | 'rock'

export type MapId = 'map_town'

export type TileLayers = {
  ground: TileId[][]
}

export type MapPosition = {
  x: number
  y: number
}

export type MapData = {
  id: MapId
  name: string
  width: number
  height: number
  layers: TileLayers
  collision: number[][]
  playerStartPosition: MapPosition
  events: unknown[]
}

export type ProjectData = {
  id: string
  title: string
  maps: MapData[]
}
