import * as THREE from 'three'

const MIN_FRUSTUM_HEIGHT = 12

export type DioramaCameraView = {
  viewWidth: number
  viewDepth: number
  padding?: number
  target?: THREE.Vector3
}

export function createDioramaCamera(
  width: number,
  height: number,
  view: DioramaCameraView,
): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera()
  const target = view.target ?? new THREE.Vector3()
  const distance = Math.max(view.viewWidth, view.viewDepth, MIN_FRUSTUM_HEIGHT)

  camera.position.set(target.x + distance * 0.65, 7.5, target.z + distance * 0.65)
  camera.lookAt(target)
  updateDioramaCamera(camera, width, height, view)

  return camera
}

export function updateDioramaCamera(
  camera: THREE.OrthographicCamera,
  width: number,
  height: number,
  view: DioramaCameraView,
) {
  const aspect = width / Math.max(1, height)
  const padding = view.padding ?? 2
  const paddedWidth = view.viewWidth + padding
  const paddedDepth = view.viewDepth + padding
  const frustumHeight = Math.max(
    MIN_FRUSTUM_HEIGHT,
    paddedDepth,
    paddedWidth / aspect,
  )
  const halfHeight = frustumHeight / 2
  const halfWidth = halfHeight * aspect

  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.near = 0.1
  camera.far = 100
  camera.updateProjectionMatrix()
}
