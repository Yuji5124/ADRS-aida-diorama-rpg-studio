import { demoProject } from './data/demoProject'
import { DioramaCanvas } from './renderer/DioramaCanvas'

export function App() {
  const currentMap = demoProject.maps[0]
  const tileCount = currentMap.layers.ground.reduce(
    (total, row) => total + row.length,
    0,
  )

  return (
    <div className="adrs-app">
      <header className="adrs-titlebar">
        <span className="adrs-titlebar__brand">ADRS</span>
        <span className="adrs-titlebar__sub">AIDA Diorama RPG Studio</span>
      </header>
      <main className="adrs-stage">
        <DioramaCanvas map={currentMap} />
        <section className="adrs-stage__panel" aria-label="Phase status">
          <p className="adrs-stage__line">Phase 1-3: map_town Rendering</p>
          <dl className="adrs-stage__facts">
            <div>
              <dt>currentMapId</dt>
              <dd>{currentMap.id}</dd>
            </div>
            <div>
              <dt>map size</dt>
              <dd>
                {currentMap.width} x {currentMap.height}
              </dd>
            </div>
            <div>
              <dt>tiles</dt>
              <dd>{tileCount}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
