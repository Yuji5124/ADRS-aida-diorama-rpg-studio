import * as THREE from 'three'

import type { MapData, TileId } from '../types/project'
import { TILE_SIZE, mapToWorldPosition } from './coordinates'

type TileRenderSpec = {
  color: number
  height: number
  baseY: number
  roughness: number
}

const tileSpecs: Record<TileId, TileRenderSpec> = {
  grass: { color: 0x4f8f4f, height: 0.08, baseY: 0, roughness: 0.92 },
  road: { color: 0x8b7355, height: 0.08, baseY: 0.01, roughness: 0.96 },
  water: { color: 0x2a72a8, height: 0.04, baseY: -0.08, roughness: 0.62 },
  wall: { color: 0x68717c, height: 0.72, baseY: 0, roughness: 0.86 },
  rock: { color: 0x515b66, height: 0.46, baseY: 0, roughness: 0.9 },
}

export function buildDioramaScene(map: MapData): THREE.Group {
  const group = new THREE.Group()
  group.name = `${map.id}_tiles`

  map.layers.ground.forEach((row, y) => {
    row.forEach((tileId, x) => {
      const spec = tileSpecs[tileId]
      const position = mapToWorldPosition(x, y, map.width, map.height)
      const tile = createTileMesh(tileId, spec)

      tile.position.set(
        position.x,
        spec.baseY + spec.height / 2,
        position.z,
      )
      group.add(tile)
    })
  })

  return group
}

function createTileMesh(
  tileId: TileId,
  spec: TileRenderSpec,
): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
  const geometry = new THREE.BoxGeometry(TILE_SIZE, spec.height, TILE_SIZE)
  const material = new THREE.MeshStandardMaterial({
    color: spec.color,
    metalness: 0,
    roughness: spec.roughness,
  })
  const mesh = new THREE.Mesh(geometry, material)

  mesh.name = `tile_${tileId}`

  return mesh
}
