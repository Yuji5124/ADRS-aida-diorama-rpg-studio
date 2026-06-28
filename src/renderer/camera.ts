import * as THREE from 'three'

const FRUSTUM_HEIGHT = 12

export function createDioramaCamera(
  width: number,
  height: number,
): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera()

  camera.position.set(8, 7, 8)
  camera.lookAt(0, 0, 0)
  updateDioramaCamera(camera, width, height)

  return camera
}

export function updateDioramaCamera(
  camera: THREE.OrthographicCamera,
  width: number,
  height: number,
) {
  const aspect = width / Math.max(1, height)
  const halfHeight = FRUSTUM_HEIGHT / 2
  const halfWidth = halfHeight * aspect

  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.near = 0.1
  camera.far = 100
  camera.updateProjectionMatrix()
}
