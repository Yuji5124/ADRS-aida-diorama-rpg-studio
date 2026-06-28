import { DioramaCanvas } from './renderer/DioramaCanvas'

export function App() {
  return (
    <div className="adrs-app">
      <header className="adrs-titlebar">
        <span className="adrs-titlebar__brand">ADRS</span>
        <span className="adrs-titlebar__sub">AIDA Diorama RPG Studio</span>
      </header>
      <main className="adrs-stage">
        <DioramaCanvas />
        <section className="adrs-stage__panel" aria-label="Phase status">
          <p className="adrs-stage__line">Phase 1-2: Diorama Canvas</p>
          <p className="adrs-stage__hint">
            固定カメラと仮グリッドだけの表示土台です。
          </p>
        </section>
      </main>
    </div>
  )
}
