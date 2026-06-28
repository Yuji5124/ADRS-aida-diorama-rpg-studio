# CODEX REVIEW 002 - ADRS Demo 01 Implementation Readiness

## 1. Final Verdict

- Verdict: GO
- Reason:
  - フェーズ0仕様一式は、ADRS Demo 01 を実装フェーズ1へ進めるだけの整合性に達している。
  - 一周導線は、タイトル → New Game → ジョブ選択 → はじまりの村 → NPC 会話 → 宝箱 → 洞窟ワープ → 通常敵戦闘 → ボス戦闘 → victory 後 HP/MP 全回復 → `boss_defeated` flag → `clearGame` → クリア画面、という流れで仕様上成立している。
  - #001 の Blocking だった GameState、`startBattle` 結果契約、通常敵シンボル消滅、ページ別 appearance、Event の通行・trigger ルールは反映済み。
  - 実装フェーズ1の開始範囲は「Project/Map 読み込み、ジオラマ表示、主人公表示、グリッド移動、衝突判定、固定カメラ」に十分絞れる。
  - ただし、フェーズ1初手で Event Runtime / Battle Runtime / AI Support / Job selection UI / full Editor UI へ広げないことを GO 条件とする。

## 2. Blocking Issues

None.

実装フェーズ1の狭いスライスを開始するうえで、一周導線やデータモデルを止める未定義・矛盾は見当たらない。

## 3. Important Issues

- Roadmap 末尾に古いフェーズ0残タスク記述が残っている。
  - `41-roadmap.md` は本文で T1〜T10 作成済み・フェーズ0完了としている一方、末尾に「残りフェーズ0タスク: 24 → 10」という古い記述が残っている。
  - 実装可否は止めないが、着手前の人間向け運用メモとしては混乱源になるため、最初の仕様整理タイミングで削除または更新したい。

- `GameState` の `mode` / `scene` が `10-architecture.md` にはあるが、`11-data-model.md` の JSON 例には出ていない。
  - Architecture では `title / field / battle / clear / gameover` 等を持つと定義されており、戦闘開始・クリア・ゲームオーバーの遷移にも必要。
  - Phase 1 の地形移動だけなら Blocking ではないが、Phase 2 に入る前に `11-data-model.md` の GameState 例にも `mode` / `scene` を合わせるとよい。

- Phase 1 の「タイル配置の最小エディタ」は初手では実装対象にしない方がよい。
  - `41-roadmap.md` のフェーズ1には「最小エディタ（または手書き JSON 運用）」が含まれる。
  - 最初の一歩では必ず「手書き JSON / 固定 Project Data 読み込み」を選び、Editor UI 実装へ広げないこと。ここを広げるとフェーズ1が太る。

## 4. Nice to Have

- `10-architecture.md` の実装前ゲートチェックリストは未チェック `[ ]` のままだが、実質的には満たされている項目が多い。最終レビュー後に `[x]` 化するか、監査用チェックリストとして残すかを決めると読みやすい。

- `40-demo01-scenario.md` 末尾の「Codex にレビューさせるべき観点」には、旧 2 flag 前提の表現が残っている。本文仕様は 3 flag に更新済みなので実害は小さいが、将来のレビュー依頼文として使うなら更新した方がよい。

- `auto` trigger は定義済みだが Demo 01 で必須ではない。Phase 1 では未実装、Phase 2 でも必要になるまで未使用でよい。

## 5. Scope Check

Demo 01 のスコープは広がっていない。

- Event command は 6 種のまま。
- 戦闘コマンドは `attack` / `skill` / `escape` の 3 種のみ。
- `item` / guard / equipment / state / attribute / speed order / 複雑な enemy AI は復活していない。
- ジョブは 2 種、開始時に 1 回選ぶだけで、ゲーム中ジョブチェンジはない。
- マップは 2 枚のまま。
- AI は Editor Mode の文章提案 1 機能のみ。
- Tauri、DB editing GUI、save/load、本格 Editor UI、複数光源、回転カメラは初期実装必須から外れている。

Phase 1 は「歩ける村」を作る範囲に絞れており、イベント・戦闘・AI まで同時に始める必要はない。

## 6. Event / Runtime Check

Event.commands 統一方針は維持されている。

- 6 command は `message` / `addItem` / `setFlag` / `transfer` / `startBattle` / `clearGame` のみ。
- 通常敵の消滅は `setFlag enemy_slime_01_defeated=true` と page `appearance.visible:false` で表現され、敵専用の暗黙処理に逃げていない。
- `startBattle` の結果契約は明確。
  - `victory`: 後続 commands へ進む。
  - `escape`: 後続 commands を実行せず event 終了。敵シンボルは残る。
  - `defeat`: 後続 commands を実行せず gameover。
- GameState は `flags` / `inventory` / `party` / `currentMapId` / `playerPosition` を持ち、未定義 flag は false。
- 選択ジョブは `actor_hero.jobId` と stats / skills として GameState の party に反映される契約がある。
- `mode` / `scene` は Architecture 側で定義されているため契約としては存在するが、Data Model の JSON 例にも追加するとより堅い。

`visible:false` の同期も破綻していない。

- Play Mode では描画しない、影も出さない、当たり判定なし、trigger なし。
- Editor Mode ではイベント一覧に残す。
- Renderer は GameState を読むだけで、flag 更新や trigger 実行をしない。

## 7. Battle / Job Check

戦闘仕様は Demo 01 実装に十分な粒度で定義されている。

- 戦闘コマンドは `attack` / `skill` / `escape` の 3 種のみ。
- `canEscape:false` のボス戦では escape が発生しない。
- `victory` の場合のみ HP/MP 全回復。`escape` / `defeat` では回復しない。
- 敵は通常攻撃のみ。`Enemy.skills` は予約フィールド。
- `spd` は保持するが行動順には使わず、味方 → 敵の固定順。
- `System.damageFormula` は通常攻撃式として解釈され、攻撃スキルは `atk + skill.power - def`。
- 数値検証は、通常戦 2 ターン、ボス戦 4〜5 ターンで成立している。
- 剣士は安定型、光術士は高火力・低耐久だがヒールが安全網として機能する。

戦闘中 item を入れない判断も妥当。ポーションは宝箱と inventory 更新の確認用として扱われ、Demo 01 の縦切りを止めない。

## 8. AI Support Check

AI Support は Play Mode の必須依存になっていない。

- Editor Mode 専用の補助機能として定義されている。
- 実 AI API は必須ではなく、擬似 AI / テンプレート生成で成立する。
- AI が変更するのは既存 `message` command の `text` のみ。
- AI は `addItem` / `setFlag` / `transfer` / `startBattle` / `clearGame` を追加・削除・並べ替えしない。
- AI が失敗しても Play Mode の一周導線には影響しない。

したがって、AI Support は Phase 1 開始の Blocking ではない。Roadmap 通り Phase 3 でよい。

## 9. Phase 1 Implementation Recommendation

Phase 1 は以下に絞って開始してよい。

- Project Data 読み込み。
- Map JSON 読み込み。
- `map_town` のタイルレイヤー、collision、diorama 設定の解釈。
- 2D タイルを 3D ジオラマ風に表示。
- 主人公を `startPosition` に表示。
- グリッド移動。
- Map collision に基づく通行可否。
- 固定斜め見下ろしカメラ。
- ライト 1 灯 + 簡易影。

Phase 1 に入れないもの。

- Event Runtime。
- Battle Runtime。
- Job selection UI。
- AI Support。
- full Editor UI。
- save/load。
- Tauri。
- DB editing GUI。
- Event.commands の実行。
- title / clear / gameover の本格 scene 遷移。

最初の一歩は「はじまりの村を読み込み、主人公が固定カメラ下で歩ける」までで十分。ここで戦闘・AI・イベントを先食いしないこと。

## 10. Required Fixes Before Implementation

None.

Phase 1 を始めるために必須の仕様修正はない。

ただし、着手前または Phase 1 中の軽い整理として、以下は推奨する。

- `41-roadmap.md` 末尾の古い「残りフェーズ0タスク」記述を更新する。
- `11-data-model.md` の GameState JSON 例に `mode` / `scene` を追加する。
- Phase 1 初手では「最小エディタ」ではなく「手書き JSON / 固定データ読み込み」を明示的に選ぶ。

## 11. Recommended First Implementation Slice

### やること

- 固定 Project Data を読み込む。
- `map_town` を読み込む。
- `width` / `height` / `tileSize` / `layers` / `collision` を解釈する。
- grass / road / water / wall / tree / house の最小表示を出す。
- `startMapId` / `startPosition` から主人公を配置する。
- 矢印キー等で 1 マス単位に移動する。
- `collision` が 1 のマスへ進めない。
- カメラは固定斜め見下ろしで主人公に追従する。
- Renderer は表示に徹し、GameState 更新は移動ロジック側に置く。

### やらないこと

- NPC 会話を作らない。
- 宝箱を開けない。
- `transfer` を動かさない。
- `startBattle` を動かさない。
- ジョブ選択画面を作らない。
- AI パネルを作らない。
- イベントエディタを作らない。
- セーブ / ロードを作らない。
- Tauri やデスクトップ化を始めない。
- 技術選定をこのレビュー内で確定しない。
