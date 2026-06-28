import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { createDioramaCamera, updateDioramaCamera } from './camera'

type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry
  material?: THREE.Material | THREE.Material[]
}

export function DioramaCanvas() {
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

    const camera = createDioramaCamera(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
    )

    const ambientLight = new THREE.AmbientLight(0xe8f0ff, 0.45)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(6, 10, 4)
    scene.add(ambientLight, keyLight)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x2c5a45,
        metalness: 0,
        roughness: 0.88,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    const grid = new THREE.GridHelper(12, 12, 0x96b9ff, 0x344860)
    grid.position.y = 0.02
    scene.add(grid)

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)

      renderer.setSize(width, height, false)
      updateDioramaCamera(camera, width, height)
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
  }, [])

  return <div className="diorama-canvas" ref={containerRef} />
}
