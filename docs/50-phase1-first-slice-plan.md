# 50 - フェーズ1 最初のスライス計画 (Phase 1 First Slice Plan)

> ADRS Demo 01 は Codex #002 で **GO / Blocking None** 判定済み（`docs/reviews/CODEX_REVIEW_002.md`）。
> 本書は **実装フェーズ1 の最初の一歩** を、極端に狭い範囲に固定する計画書である。
> **まだ実装はしない。** この計画はコードを書く前の合意形成のためのもの。

---

## 技術選定の扱い（Demo 01 Web Prototype 採用方針）

> `10-architecture.md` では React / TypeScript / Vite / Three.js / Zustand を **「候補」** として扱った。
> 本書では、**Demo 01 の Web プロトタイプに限って** 以下を **採用方針**として確定する。

### 採用（Demo 01 Web Prototype）
- **React**
- **TypeScript**
- **Vite**
- **Three.js**
- **Zustand**
- **JSON Project Data**（まずは手書き / 固定データ）

### 後回し（Phase 1 では入れない）
- Tauri / Electron
- DB 編集 GUI
- 実 AI API
- オンライン共有 / 素材マーケット
- プラグイン機構

> 注:
> - これは **Demo 01 Web プロトタイプの採用方針**。
> - 将来のデスクトップ化では **Tauri を再検討可能**。ただし **Phase 1 では Tauri を入れない**。
> - **まだ実装コードは作らない**（本書は計画のみ）。

---

## 1. Phase 1 First Slice の位置づけ

このスライスは **ADRS Demo 01 の全機能実装ではない**。目的は、次が成立するかを確認すること:

- Project Data を読み込める
- `map_town` を表示できる
- 2D タイル情報を **3D ジオラマとして表示**できる
- 主人公を表示できる
- **グリッド単位で移動**できる
- `collision` に基づいて **移動不可マスで止まる**
- **固定斜め見下ろしカメラ**で見られる

> 一言でいうと: **「はじまりの村を、固定カメラ下で主人公が歩ける」** までを作る。

---

## 2. このスライスでやること

| やること | 補足 |
|---|---|
| 最小 Vite + React + TS プロジェクトの作成計画 | 設定は最小限 |
| Three.js Canvas の配置計画 | React 内に 1 枚の描画キャンバス |
| Project Data JSON の読み込み計画 | 固定データを import |
| `map_town` の読み込み計画 | 1 マップのみ |
| タイルの 3D 立ち上げ計画 | 地面=板 / 壁=ブロック（段階式高さ） |
| 主人公の表示計画 | 板スプライト or 簡易ボックス |
| グリッド移動 | 1 入力 = 1 マス |
| collision 判定 | 0/1 のみ |
| 固定斜め見下ろしカメラ | 回転なし・追従は平行移動 |
| 最低限のデバッグ表示 | 現在座標・FPS 程度 |

---

## 3. このスライスでやらないこと（明確に除外）

- Event Runtime / NPC 会話 / 宝箱 / ワープ
- Battle Runtime
- Job selection UI / Skill・Battle UI
- AI Support
- full Editor UI / map editor / asset importer
- save・load
- Tauri
- DB editing GUI
- audio
- title screen / clear screen

> **重要:** タイトル画面・ジョブ選択も **まだ入れない**。
> 最初は `map_town` を**直接表示**して、**主人公を動かすだけ**でよい。

---

## 4. 最初に作る想定ファイル構成（計画のみ・今は作らない）

> ⚠️ この時点では **作成しない**。「次回以降の実装で作る候補」として記す。

```text
package.json
index.html
src/
  main.tsx
  App.tsx
  data/
    demoProject.ts          # 固定 Project Data（map_town 中心）
  runtime/
    createInitialGameState.ts
    movement.ts             # 入力 → 移動可否 → GameState 更新
    collision.ts            # Map 座標で通行判定
  renderer/
    DioramaCanvas.tsx       # Three.js キャンバス（表示専用）
    buildDioramaScene.ts    # Map → 3D オブジェクト変換
    camera.ts               # 固定斜め見下ろし + 追従
    coordinates.ts          # Map 座標 ↔ world 座標
  types/
    project.ts
    gameState.ts
```

> 名前・粒度は仮。実装着手時に確定する。

---

## 5. Project Data の最小対象

最初のスライスで **読み込む**もの:
- project `id` / `title`
- `maps`
- `map_town`
- `tiles`（layers）
- `collision`
- `playerStartPosition`（Project の `startPosition`）
- minimal events placeholder（**配置だけ。実行はしない**）

まだ **使わないが将来接続**するもの:
- `map_cave`
- `events`（実行）
- `actors` / `jobs` / `skills` / `enemies` / `troops` / `items` / `system`

> Project Data は `11-data-model.md` の構造に従う。最初は **必要なフィールドだけ**を読み込む。

---

## 6. `map_town` の最小表示

`map_town` **だけ**を対象にする。

表示するもの:
- `grass`
- `road`
- `water`
- `wall` / `rock`
- `house` placeholder
- `tree` placeholder
- `cave_entrance` placeholder
- grid（任意・デバッグ）

> Demo 01 完成版と違ってよい。ただし `24-diorama-rendering.md` の方針に合わせる:
> - 固定斜め見下ろし / ライト 1 灯 / 擬似影
> - 回転カメラなし / 自由な高さ編集なし / 段差移動なし

> placeholder は箱・板・単色で可（見栄えより**識別**を優先）。

---

## 7. 座標系

`10-architecture.md` §10 / `24-diorama-rendering.md` に合わせる。

- **Map 座標** `{ x, y }`（グリッドのセル単位）
- **`tileSize`**（1 セルの基準サイズ）
- **world 座標への変換**: `world = f(Map 座標, tileSize, 高さ段階)`
- **collision は Map 座標で判定**
- **Renderer は world 座標で表示**
- **主人公移動は Map 座標を更新**（GameState.playerPosition）
- **カメラは world 座標に変換された主人公位置を追従**（角度固定）

---

## 8. 主人公移動（最小仕様）

- キーボード操作（**Arrow keys または WASD**）
- **1 入力 = 1 マス移動**
- **斜め移動なし**
- 移動中の連続入力は簡易でよい（押しっぱなしは後で調整）
- `collision` が `1` のマスには入れない
- **マップ外に出られない**
- 移動後にカメラが追従

---

## 9. collision 仕様（極端に単純）

- `0` = 通れる
- `1` = 通れない

| タイル | 通行 |
|---|---|
| `grass` / `road` | 通れる（0） |
| `water` | 通れない（1） |
| `wall` / `rock` | 通れない（1） |
| `house` placeholder | 通れない（1） |
| `tree` placeholder | 通れない（1） |

> このスライスでは:
> - **Event との衝突は扱わない**（NPC/宝箱の当たり判定なし）。
> - **`visible:false` も実装対象外**（イベントを実行しないため不要）。

---

## 10. Renderer 責務

**Renderer がやること:**
- Project Data / GameState を受け取って表示する
- Map 座標を world 座標へ変換する
- タイルとオブジェクトを描画する
- 主人公を描画する
- カメラを追従させる

**Renderer がやらないこと:**
- **GameState を直接更新しない**
- Event.commands を実行しない
- Battle Runtime を持たない
- AI Support を持たない
- Project Data を編集しない

---

## 11. Runtime 責務

**Runtime がやること:**
- 初期 GameState を作る
- `currentMapId` を持つ
- `playerPosition` を持つ
- 入力を受けて移動可能か判定する
- `collision` を見て移動を許可/拒否する
- GameState を更新する

**Runtime がやらないこと:**
- **描画しない**
- **Three.js に依存しない**（純粋ロジック）
- Event.commands をまだ実行しない
- 戦闘しない
- AI Support を呼ばない

> この分離（Runtime は Three.js 非依存 / Renderer は状態を読むだけ）が `10-architecture.md` の原則を守る鍵。

---

## 12. Acceptance Criteria（完了条件）

- [ ] ブラウザで ADRS の画面が開く
- [ ] `map_town` が 3D ジオラマとして表示される
- [ ] `grass` / `road` / `water` / `wall` が見分けられる
- [ ] 主人公が表示される
- [ ] 主人公がグリッド単位で上下左右に動く
- [ ] 通行不可マスに入れない
- [ ] マップ外に出られない
- [ ] カメラが固定斜め見下ろしで主人公を追従する
- [ ] Renderer が GameState を直接更新していない
- [ ] Event Runtime / Battle Runtime / AI Support を実装していない

---

## 13. 実装順序（次回以降に実装する場合）

1. Vite + React + TypeScript の最小セットアップ
2. Three.js Canvas 表示
3. 固定カメラとライト（1 灯）
4. `demoProject` data 作成（map_town 中心）
5. `map_town` 描画
6. 座標変換（Map ↔ world）
7. 主人公表示
8. 入力処理
9. collision 判定
10. カメラ追従
11. デバッグ表示
12. build 確認

---

## 14. リスクと回避策

| リスク | 回避策 |
|---|---|
| Three.js 描画に時間を吸われる | まず箱・板・簡易スプライトでよい。見栄えは後回し |
| Editor UI を作りたくなる | Phase 1 初手では作らない（手書き JSON / 固定データ） |
| Event Runtime に進みたくなる | `map_town` 移動が完了するまで入れない |
| データ構造を複雑にしたくなる | `11-data-model.md` の必要部分だけ使う |
| 見た目を作り込みたくなる | grass/road/water/wall の **識別**を優先 |
| 押しっぱなし移動などの操作感に凝る | 1 入力 1 マスで十分。操作感は後で調整 |

---

## 15. 次の判断ゲート

この計画書の後に必要な判断:

- [ ] **この計画で実装着手してよいか**（実装着手 GO の可否）
- [ ] **技術スタックを Demo 01 Web Prototype として確定してよいか**（React/TS/Vite/Three.js/Zustand）
- [ ] **初回実装コミットの単位**（例: セットアップ / 描画 / 移動 で分ける）
- [ ] **初回実装を Codex / Claude Code のどちらに任せるか**
- [ ] **実装後にどのレビューを行うか**（動作確認 / Acceptance Criteria 照合 / Codex レビュー）

> ここまでの合意が取れたら、初めて実装着手（フェーズ1 最初のスライス）に進む。
