import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import type { MapData } from '../types/project'
import { buildDioramaScene } from './buildDioramaScene'
import { createDioramaCamera, updateDioramaCamera } from './camera'
import { getMapCenter, TILE_SIZE } from './coordinates'

type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry
  material?: THREE.Material | THREE.Material[]
}

type DioramaCanvasProps = {
  map: MapData
}

export function DioramaCanvas({ map }: DioramaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

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

    const mapCenter = getMapCenter(map.width, map.height)
    const cameraView = {
      viewWidth: map.width * TILE_SIZE,
      viewDepth: map.height * TILE_SIZE,
      padding: 3,
      target: new THREE.Vector3(mapCenter.x, mapCenter.y, mapCenter.z),
    }
    const camera = createDioramaCamera(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
      cameraView,
    )

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
    }
  }, [map])

  return <div className="diorama-canvas" ref={containerRef} />
}
