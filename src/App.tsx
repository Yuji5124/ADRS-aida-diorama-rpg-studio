import { useEffect, useState } from 'react'

import { demoProject } from './data/demoProject'
import { DioramaCanvas } from './renderer/DioramaCanvas'
import { createInitialGameState } from './runtime/createInitialGameState'
import { directionFromKeyCode, movePlayer } from './runtime/movement'

export function App() {
  const currentMap = demoProject.maps[0]
  const [gameState, setGameState] = useState(() =>
    createInitialGameState(currentMap),
  )

  // Input handling lives outside the renderer: a keydown maps to a direction,
  // and the Runtime computes the next GameState. The renderer only reads it.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = directionFromKeyCode(event.code)
      if (!direction) {
        return
      }

      event.preventDefault()
      setGameState((state) => movePlayer(state, direction, currentMap))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentMap])

  const { playerPosition } = gameState

  return (
    <div className="adrs-app">
      <header className="adrs-titlebar">
        <span className="adrs-titlebar__brand">ADRS</span>
        <span className="adrs-titlebar__sub">AIDA Diorama RPG Studio</span>
      </header>
      <main className="adrs-stage">
        <DioramaCanvas map={currentMap} playerPosition={playerPosition} />
        <section className="adrs-stage__panel" aria-label="Phase status">
          <p className="adrs-stage__line">Phase 1-4: Player Grid Movement</p>
          <dl className="adrs-stage__facts">
            <div>
              <dt>currentMapId</dt>
              <dd>{gameState.currentMapId}</dd>
            </div>
            <div>
              <dt>map size</dt>
              <dd>
                {currentMap.width} x {currentMap.height}
              </dd>
            </div>
            <div>
              <dt>playerPosition</dt>
              <dd>
                x={playerPosition.x}, y={playerPosition.y}
              </dd>
            </div>
          </dl>
          <p className="adrs-stage__hint">
            Arrow keys / WASD で 1 マスずつ移動（collision 判定はまだ無し）
          </p>
        </section>
      </main>
    </div>
  )
}
