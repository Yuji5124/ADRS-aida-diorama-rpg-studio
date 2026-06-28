# 10 - アーキテクチャ方針 (Architecture)

> ADRS Demo 01 の実装に入る前に、アプリ全体の **責務分離・データ流れ・レイヤー構成** を定義する。
> **本書は技術確定書ではない。** 実装候補を踏まえた「アーキテクチャ方針」であり、ライブラリは確定しない。

---

## 技術スタンス（重要）

- ADRS Demo 01 は **Web-first**（まずブラウザで動くことを前提に設計）。
- **実装候補**（確定ではない）: React / TypeScript / Three.js / Vite / Zustand / JSON project data。
  - 本書では **特定ライブラリのコードや API には踏み込まない**。責務・データ流れ・レイヤー境界のみを定義する。
- **Tauri** は将来のデスクトップアプリ化候補。**Demo 01 の初期実装必須にはしない**。
- ⚠️ ここに挙げた技術は **「候補」** であり、`10` の段階で確定はしない。最終確定は実装着手の合意時に行う。
- ⚠️ ADRS では「HD-2D」という名称は使わない（→ `00-overview.md`）。

---

## 1. アーキテクチャ原則

1. **データ駆動** — 振る舞いはコードの分岐ではなく Project Data（JSON）で表現する。会話・宝箱・ワープ・戦闘は Event.commands で表す。
2. **ロジックと描画の分離** — ゲーム進行ロジック（状態更新）と Renderer（表示）を分ける。Renderer は状態を**読むだけ**。
3. **Editor Mode と Play Mode の分離** — Editor は Project Data を編集し、Play はそれを実行する。両者の責務を混ぜない。
4. **Event.commands 統一を崩さない** — 個別機能（会話システム・宝箱システム…）を作らない。Event Runtime 1 本で実行する。
5. **Renderer にゲーム進行ロジックを持たせない** — Renderer は flag/位置/見た目を表示するだけ。trigger 実行や flag 更新をしない。
6. **Battle Runtime と Event Runtime の契約を明確にする** — `startBattle` の victory/escape/defeat 結果で後続コマンドの扱いを決める（→ §6）。
7. **AI Support は補助機能** — Editor Mode の支援であり、**Play Mode（ゲーム実行）の必須依存にしない**。
8. **Demo 01 では小さく作る** — DB 編集 GUI・プラグイン機構・高度なセーブ等は作らない（→ §12）。

---

## 2. 全体レイヤー構成

### データ流れ（実行＝Play Mode の主筋）

```text
Project Data
   ↓ （ロード）
Game Runtime / GameState
   ↓ （trigger / ページ評価）
Event Runtime
   ↓ （startBattle）
Battle Runtime
   ↓ （状態を読む）
Renderer
   ↓ （表示・操作）
Editor UI
```

> **補足（流れの向きの実態）:**
> - **Editor UI** は Project Data を **編集** する（上記の縦流れとは別系統）。
> - **Renderer** は **表示専用**。GameState / Map を **読むだけ** で、状態を更新しない。
> - 実行時の状態更新は **Event Runtime / Battle Runtime** が担い、その結果を GameState に書き、Renderer が反映する。
> - つまり「縦の矢印」は *制御とデータの主な流れ* であって、Renderer や Editor は一方向の読み/編集に閉じる。

### 責務表

| レイヤー | 役割 | 持ってよい責務 | 持ってはいけない責務 |
|---|---|---|---|
| Project Data | 定義データ（JSON） | エンティティ定義・ID参照・保存対象 | 描画・戦闘処理・実行時状態の保持 |
| Game Runtime / GameState | 実行時状態 | flags/inventory/party/現在地/mode の保持と初期化 | 定義データの恒久編集・描画 |
| Event Runtime | イベント実行 | trigger判定・ページ評価・commands逐次実行 | 描画・戦闘内部処理・データ定義の改変 |
| Battle Runtime | 戦闘実行 | コマンド処理・勝敗判定・結果(victory/escape/defeat)返却 | イベント進行の管理・描画の所有 |
| Renderer | 表示 | Map/GameStateを読んで描画・カメラ・擬似影 | flag更新・trigger実行・ゲーム進行 |
| Editor UI | 編集・操作 | Project Data編集・一覧表示・テストプレイ起動・AIパネル | RPGロジック（実行）の保持 |
| AI Support | 編集補助 | セリフ案生成・採用反映（Editor内） | Play Modeの実行依存になること |

---

## 3. Project Data レイヤー

`11-data-model.md` に基づく **定義データ**。対象: Project / System / Map / Event / Actor / Job / Skill / Enemy / Troop / Item。

- **JSON 想定**、**ID 参照で疎結合**（埋め込みでなく文字列 ID）。
- **保存対象**（永続化されるのは定義データ。Demo 01 はセーブ機構を作らないが、データ自体は保存物）。
- **Editor Mode で編集** される。
- **Play Mode では読み込まれ**、GameState と各 Runtime に渡される。
- **Project Data は直接、描画や戦闘処理をしない**（受け身のデータ）。

> 定義データ（Map/Actor/...）と実行時状態（GameState）は **別物**。Project Data はプレイ中に書き換えない。

---

## 4. Game Runtime / GameState レイヤー

`11-data-model.md` の **GameState**（実行時状態）を保持する。

| 状態 | 内容 |
|---|---|
| `flags` | 真偽値ストア。**未定義 flag は false** |
| `inventory` | `addItem` の反映先 |
| `party` | 現在のパーティ（Demo 01 は主人公1人） |
| `currentMapId` | 現在のマップ |
| `playerPosition` | 主人公の現在位置 `{ x, y }` |
| `mode` / `scene` | 現在のモード/シーン（title / field / battle / clear / gameover 等） |

- **New Game 初期化**: flags は空（=全 false）、inventory 空、currentMapId/playerPosition は Project の startMapId/startPosition。
  - **開始時ジョブ選択**（`23-job-skill-spec.md`）の結果は、`actor_hero.jobId` と初期 `stats`/`skills` として **GameState の party に反映**される（以後 Demo 01 では固定）。
- **参照者**: Event Runtime（条件評価・flag更新）、Battle Runtime（party参照・結果反映）、Renderer（位置/見た目の表示）。
- **重要**: GameState は **実行時の状態**であり、**Project Data とは分離**する。GameState の変化が Project Data を書き換えてはならない。

---

## 5. Event Runtime レイヤー

`21-event-system-spec.md` に基づく **イベント実行エンジン**（ADRS の心臓部）。

責務:
- **trigger 判定**（action=隣接決定 / touch=侵入 / auto）
- **EventPage の条件評価**（上から最初に conditions を満たすページを採用。条件は GameState.flags 参照）
- **`visible:false` の扱い**（採用ページが visible:false、または有効ページ無し → 非表示・当たり判定なし・trigger 発火なし）
- **commands の逐次実行**: `message` / `addItem` / `setFlag` / `transfer` / `startBattle` / `clearGame`
  - `setFlag`/`addItem` → GameState を更新
  - `transfer` → GameState.currentMapId/playerPosition を更新
  - `startBattle` → Battle Runtime へ遷移（結果契約は §6）
  - `clearGame` → クリアシーンへ

> **重要**: Renderer に **イベント進行ロジックを持たせない**。Renderer は「見た目」を表示するだけ。
> Event Runtime が「実行」を担当し、その結果（flag/位置/visible）を GameState に書き、Renderer が反映する。

---

## 6. Battle Runtime レイヤー

`startBattle` の **結果契約**（`21-event-system-spec.md` / `40-demo01-scenario.md`）を中核に置く。

- `startBattle` で **Event Runtime → Battle Runtime** に遷移。
- 戦闘結果は **victory / escape / defeat** を返す。

| 結果 | Event.commands の扱い | 遷移 |
|---|---|---|
| `victory` | **後続を続行**（次の commands を実行） | イベントへ復帰 |
| `escape` | **実行しない**（イベント終了） | フィールドへ復帰（イベントは未消化で残る＝再接触可） |
| `defeat` | **実行しない** | ゲームオーバーへ |

- これにより **勝利時のみ** `setFlag`（敵消滅・boss_defeated）や `clearGame` が走る。
- **Demo 01 の戦闘コマンドは `attack` / `skill` / `escape` のみ**。`item` / `equipment` / `state` / `attribute` は後回し。
- Battle Runtime は **Renderer から独立したロジック**。戦闘の見た目（演出）は Renderer が担当し、勝敗計算は Battle Runtime が担当する。
- `canEscape:false`（ボス）では escape 結果は発生しない。

---

## 7. Renderer レイヤー

`24-diorama-rendering.md` に基づく **表示専用**レイヤー。

責務:
- **Map JSON → 表示用オブジェクトへ変換**（タイル配列＋段階式高さ → 板/ブロック/オブジェクト）
- **タイル座標 → ワールド座標への変換**（§10）
- **固定斜め見下ろしカメラ**（回転なし・正投影風/アイソメ寄り）
- **主人公追従**（平行移動のみ・角度固定）
- **ライト1灯** + **擬似影**
- **スプライト表示**（主人公/NPC/敵シンボルは板スプライト）
- **`visible:false` の描画除外**（描画なし・影なし）
- **Editor Mode / Play Mode の表示差分**（§11）

> **重要**: Renderer は GameState を **参照して表示を変えてよい** が、**GameState を直接更新しない**。
> ゲーム進行の更新は Event Runtime / Battle Runtime 側で行う。Renderer は「現在の状態を絵にする」だけ。

---

## 8. Editor UI レイヤー

Editor UI は **見た目・操作** を担当。**Demo 01 では DB 編集 GUI を作らない**ため、巨大なエディタは前提にしない。

責務（最小）:
- マップ表示
- タイル配置の **最小編集**、または **JSON 編集補助**
- イベント一覧（`visible:false` のイベントも一覧には残す）
- イベント commands の確認
- **テストプレイ開始**（Play Mode への切り替え）
- **AI サポートパネル**（§9）
- Project Data の編集

> **重要**: Editor UI は **RPG ロジック（実行）を持たない**。実行は Play Mode 側（Event/Battle Runtime）が担う。
> Editor は Project Data を編集し、Play はそれを読んで実行する、という分離を保つ。

---

## 9. AI Support レイヤー

Demo 01 の AI サポートは **1 機能のみ**: **NPC セリフ・クエスト文の提案**（→ `40-demo01-scenario.md` §6）。

- 3 案提示 → **採用したものだけ反映**（自動反映しない）
- **擬似 AI・テンプレート生成でも可**。実 AI API は必須ではない。

> **重要**: AI Support は **Editor Mode の補助機能**。Project Data（イベントの message 文）を編集する手助けをするだけ。
> **Play Mode（ゲーム実行）の必須依存にしない** — AI が無くても Demo 01 は最後まで遊べる。

---

## 10. 座標系

`24-diorama-rendering.md` と整合する座標変換方針。

| 概念 | 内容 |
|---|---|
| Map 座標 | `{ x, y }`（グリッドのセル単位） |
| `tileSize` | 1 セルのピクセル/単位サイズ（Map に持つ） |
| world 座標 | Map 座標 × tileSize ＋ 高さ段階 で求める表示用座標 |
| 高さ段階 | 段階式（water=低 / 標準 / 1段ブロック）。連続高さは扱わない |

- **衝突判定は Map 座標ベース**（`11-data-model.md` の `collision` 配列）。
- **描画は world 座標ベース**（Renderer が変換を所有）。
- **Demo 01 では段差移動・高低差ルート探索は扱わない**（移動は平面グリッド）。

---

## 11. Editor Mode と Play Mode の違い

| 項目 | Editor Mode | Play Mode |
|---|---|---|
| データ編集 | できる | できない |
| `Event.visible === false` | 一覧には残る（描画は通常しない） | 描画しない・影なし・当たりなし・trigger なし |
| commands 実行 | しない | する |
| trigger 発火 | しない | する |
| AI サポート | 使える | 使わない |
| GameState 更新 | 原則しない | する |
| 描画ガイド（グリッド等） | 表示する | 原則隠す（必要最小） |

> テストプレイは「Editor が持つ Project Data を Play Mode に渡して実行する」操作。
> Play 中の GameState 変化は Project Data を書き換えない（テストプレイ終了で破棄）。

---

## 12. Demo 01 でやること / やらないこと（アーキテクチャ観点）

| ✅ やること | ❌ やらないこと |
|---|---|
| JSON ベースの Project Data | DB 編集 GUI の本格実装 |
| Runtime GameState | プラグイン機構 |
| Event Runtime（commands 統一） | セーブ/ロードの高度管理 |
| Battle Runtime（attack/skill/escape） | オンライン共有 |
| Renderer（固定見下ろし/1灯/擬似影） | 素材マーケット |
| Editor UI（最小） | Tauri 必須化 |
| AI Support の最小機能（1つ・承認制） | 実 AI API 必須化 |
| Web-first 設計 | カメラ回転 / 複数光源 |
| | 複雑な戦闘システム（状態異常・属性・装備） |

---

## 13. 実装に入る前のゲート（チェックリスト）

> このゲートを満たしてからフェーズ1/2の実装に入る（`41-roadmap.md` の T5.5 ゲートと連動）。

- [ ] Project Data と GameState の違いが明確（定義データ vs 実行時状態）
- [ ] Event Runtime と Renderer の責務が分離されている（実行 vs 表示）
- [ ] `startBattle` の結果契約（victory/escape/defeat）が明確
- [ ] `visible:false` の描画・衝突・trigger ルールが明確で 3 系統に一貫適用される
- [ ] 座標変換方針（Map 座標 ↔ world 座標、衝突は Map 座標）が明確
- [ ] AI Support が Play Mode の必須依存になっていない
- [ ] Renderer が GameState を直接更新しない設計になっている
- [ ] Demo 01 のスコープを広げていない（DB GUI / 回転カメラ / 複雑戦闘なし）

---

## 14. この先の技術確定で残る論点（メモ）

> 本書では確定しない。実装着手の合意時に決める候補論点。

- 状態管理（Zustand 等）を GameState のどこまでに使うか、Project Data と分けるか
- Three.js を採る場合のシーングラフと「タイル→メッシュ変換」の実装責務
- React と Three.js（react-three-fiber 等）の境界、再描画コストの扱い
- Editor UI と Play Canvas の共存方法（同一画面 / モード切替）
- Demo 01 後の Tauri 化を見据えた、ブラウザ依存 API の隔離方針
