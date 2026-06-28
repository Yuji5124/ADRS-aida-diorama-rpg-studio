// ADRS Demo 01 Web Prototype — application shell.
// Phase 1 first slice: setup only. The diorama canvas and player movement
// are added in the following commits (diorama display / movement).
export function App() {
  return (
    <div className="adrs-app">
      <header className="adrs-titlebar">
        <span className="adrs-titlebar__brand">ADRS</span>
        <span className="adrs-titlebar__sub">AIDA Diorama RPG Studio</span>
      </header>
      <main className="adrs-stage">
        <div className="adrs-stage__placeholder">
          <p className="adrs-stage__line">Phase 1 — setup complete.</p>
          <p className="adrs-stage__hint">ジオラマ表示は次のコミットで追加します。</p>
        </div>
      </main>
    </div>
  )
}
