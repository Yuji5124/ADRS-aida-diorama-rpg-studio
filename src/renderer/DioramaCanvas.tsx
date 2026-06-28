import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import type { MapData, MapPosition } from '../types/project'
import { buildDioramaScene } from './buildDioramaScene'
import { createDioramaCamera, updateDioramaCamera } from './camera'
import { mapToWorldPosition, TILE_SIZE } from './coordinates'

type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry
  material?: THREE.Material | THREE.Material[]
}

type DioramaCanvasProps = {
  map: MapData
  playerPosition: MapPosition
}

const PLAYER_HEIGHT = 0.7
const PLAYER_BASE_Y = 0.12

export function DioramaCanvas({ map, playerPosition }: DioramaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const cameraOffsetRef = useRef(new THREE.Vector3())
  const playerRef = useRef<THREE.Mesh | null>(null)

  // Build the scene once per map. Renderer is display-only: it reads state via
  // props and never updates GameState.
  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0e1116)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const startWorld = mapToWorldPosition(
      map.playerStartPosition.x,
      map.playerStartPosition.y,
      map.width,
      map.height,
    )
    const startTarget = new THREE.Vector3(startWorld.x, 0, startWorld.z)
    const cameraView = {
      viewWidth: map.width * TILE_SIZE,
      viewDepth: map.height * TILE_SIZE,
      padding: 3,
      target: startTarget,
    }
    const camera = createDioramaCamera(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
      cameraView,
    )
    cameraRef.current = camera
    // Fixed offset from the look-at target — preserved as the camera follows
    // the player, so the diorama angle never changes.
    cameraOffsetRef.current = camera.position.clone().sub(startTarget)

    const ambientLight = new THREE.AmbientLight(0xe8f0ff, 0.45)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(6, 10, 4)
    scene.add(ambientLight, keyLight)

    const townTiles = buildDioramaScene(map)
    scene.add(townTiles)

    const gridSize = Math.max(map.width, map.height) * TILE_SIZE
    const gridDivisions = Math.max(map.width, map.height)
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x96b9ff, 0x344860)
    grid.position.y = 0.02
    scene.add(grid)

    // Player placeholder (Phase 1-4). Its position is driven by GameState via
    // the playerPosition prop in the effect below.
    const player = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, PLAYER_HEIGHT, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xffd24a,
        emissive: 0x4a3300,
        roughness: 0.5,
      }),
    )
    player.position.set(
      startWorld.x,
      PLAYER_BASE_Y + PLAYER_HEIGHT / 2,
      startWorld.z,
    )
    scene.add(player)
    playerRef.current = player

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)

      renderer.setSize(width, height, false)
      updateDioramaCamera(camera, width, height, cameraView)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    let animationFrameId = 0

    const renderFrame = () => {
      animationFrameId = window.requestAnimationFrame(renderFrame)
      renderer.render(scene, camera)
    }

    renderFrame()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()

      scene.traverse((object) => {
        const disposable = object as DisposableObject
        disposable.geometry?.dispose()

        if (Array.isArray(disposable.material)) {
          disposable.material.forEach((material) => material.dispose())
        } else {
          disposable.material?.dispose()
        }
      })

      renderer.dispose()
      renderer.domElement.remove()
      cameraRef.current = null
      playerRef.current = null
    }
  }, [map])

  // Follow the player: move the placeholder and recenter the camera whenever
  // GameState.playerPosition changes. The render loop above picks it up.
  useEffect(() => {
    const camera = cameraRef.current
    const player = playerRef.current

    if (!camera || !player) {
      return
    }

    const world = mapToWorldPosition(
      playerPosition.x,
      playerPosition.y,
      map.width,
      map.height,
    )
    player.position.set(world.x, PLAYER_BASE_Y + PLAYER_HEIGHT / 2, world.z)

    const target = new THREE.Vector3(world.x, 0, world.z)
    camera.position.copy(target).add(cameraOffsetRef.current)
    camera.lookAt(target)
  }, [map, playerPosition])

  return <div className="diorama-canvas" ref={containerRef} />
}
