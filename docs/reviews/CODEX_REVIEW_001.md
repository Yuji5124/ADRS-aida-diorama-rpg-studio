# CODEX_REVIEW_001 - ADRS Demo 01 技術レビュー

## サマリー

ADRS の中心方針である「会話・宝箱・ワープ・戦闘開始を個別機能にせず、すべて Event の `commands` で表現する」は、README / `01-demo01-scope.md` / `11-data-model.md` / `21-event-system-spec.md` / `40-demo01-scenario.md` の大筋では一貫している。

ただし、実装前に必ず詰めるべき接続仕様が残っている。特に `startBattle` の戻り方、通常敵シンボルの消滅、flag / inventory の保存先が未定義のため、このままフェーズ 2 のイベントエンジンへ入ると、Event.commands の外側に個別処理が漏れる可能性が高い。

結論として、6 コマンド方針は維持可能。ただし「6 コマンドだけで成立する」ためには、コマンドを増やすより先に、`11-data-model.md` / `21-event-system-spec.md` / `40-demo01-scenario.md` の間でランタイム状態と戦闘結果の契約を明文化する必要がある。

## 指摘一覧

### Blocking（実装前に必ず直すべき）

- [観点2/3/5] flag と inventory の保存先・初期値がデータモデルにない
  - 根拠: `11-data-model.md:58` では Item 定義のみがあり、`21-event-system-spec.md:76` / `21-event-system-spec.md:97` では `addItem` が所持品に追加するとされているが、所持品の保存先がない。`21-event-system-spec.md:57`-`67` と `40-demo01-scenario.md:153`-`157` では flag 条件と `setFlag` を使うが、flag store や未定義 flag の初期値がない。
  - 影響: `chest_potion_opened=false` のページが New Game 直後に有効になる保証がない。`addItem` の結果もどこに反映されるか不明で、宝箱イベントがデータモデル上完結しない。
  - 推奨: 保存対象かどうかは別として、Demo 01 用の `GameState` / runtime state を仕様に追加する。最低限 `flags`、`inventory`、`currentMapId`、`playerPosition` を持たせ、未定義 flag は `false` と扱うか、`initialFlags` を明示する。

- [観点3/4/5] `startBattle` の結果契約が不足している
  - 根拠: `21-event-system-spec.md:113`-`119` は「勝利後はイベントの続きのコマンドに戻る想定」とだけ書いている。`40-demo01-scenario.md:224`-`234` は `startBattle` の後に `setFlag` / `message` / `clearGame` を置き、敗北はゲームオーバー想定としている。`01-demo01-scope.md:65`-`69` では戦闘が `attack` / `skill` / `escape` と勝利 / 敗北 / 逃走を扱うとある。
  - 影響: 勝利時だけ後続コマンドを実行するのか、逃走時は event を中断するのか、敗北時は後続コマンドを絶対に実行しないのかが未定義。ここが曖昧なままでは、ボス撃破前に `boss_defeated` や `clearGame` が実行されるバグを防ぐ仕様根拠が弱い。
  - 推奨: `startBattle` は `victory` / `escape` / `defeat` の結果を返す、と明記する。Demo 01 では `victory` のみ後続 commands 継続、`escape` は event 終了または再接触可能状態へ戻る、`defeat` は Game Over へ遷移して後続 commands を実行しない、のように固定する。

- [観点1/3/5/9] 通常敵シンボルの消滅が 2 flag 方針では表現できない
  - 根拠: `40-demo01-scenario.md:203`-`208` は通常敵を `startBattle` だけで表現し、「勝利後はシンボルは消滅扱い」としている。一方で `40-demo01-scenario.md:249` は Demo 01 の flag を `chest_potion_opened` / `boss_defeated` の 2 個のみとする。`21-event-system-spec.md:75`-`80` の 6 コマンドには event を消す専用コマンドはない。
  - 影響: 敵シンボルが一本道上に残ると、再接触で通常戦が繰り返されるか、道を塞いで進行不能になる。消滅をエンジン側の暗黙処理にすると、Event.commands 統一方針の外に「敵シンボルだけ特別」という個別機能が生まれる。
  - 推奨: 6 コマンドを維持するなら `ev_enemy_slime` に `setFlag enemy_slime_defeated=true` を追加し、ページ条件で非表示 / 無効化を表現する。これにより flag は 3 個になる。2 flag にこだわる場合は、通常敵を消滅させない仕様とし、再戦・通行・逃走時の扱いを明記する必要がある。

### Important（早めに直すべき）

- [観点2/3] Event の passability / collision が未定義
  - 根拠: `11-data-model.md:83`-`92` は Map の collision を定義しているが、Event 自身が通行不可か、重なれるか、接触判定がどのタイミングで発火するかはない。`21-event-system-spec.md:49`-`55` は `touch` を定義し、`40-demo01-scenario.md:171`-`185` と `40-demo01-scenario.md:191`-`204` はワープと敵シンボルを `touch` で起動する。
  - 影響: 洞窟入口は踏める必要があり、NPC / 宝箱は基本的に踏めない可能性が高く、敵シンボルは接触後の位置関係が重要になる。ここを実装者判断にすると、イベント統一のはずが表示・当たり判定側に個別ルールが散る。
  - 推奨: Event に `passable` または `collision` を持たせるか、trigger ごとの標準挙動を定義する。

- [観点2/3] ページごとの appearance 変更がないため、宝箱の開封表示が表現できない
  - 根拠: `21-event-system-spec.md:21`-`43` と `11-data-model.md:100`-`115` では `appearance` が Event 直下にある。`40-demo01-scenario.md:147` は開封後 `chest_open` 表示想定としている。
  - 影響: `setFlag` により二重取得は防げるが、見た目は `chest_closed` のままになる。Demo 01 の最小体験として宝箱が開いたことを視覚確認できない。
  - 推奨: page に `appearance` override を許可するか、「Demo 01 では開封後も見た目は変えない」と明記する。

- [観点2/3] `11-data-model.md` のサンプル ID と `40-demo01-scenario.md` のイベント ID がずれている
  - 根拠: `11-data-model.md:91` は `ev_npc_01` / `ev_chest_01` / `ev_warp_cave` / `ev_enemy_slime` を `map_town` の events としている。一方 `40-demo01-scenario.md:99`-`148` は `ev_npc_villager` / `ev_npc_oldman` / `ev_chest_potion` を使い、`ev_enemy_slime` は `map_cave` 側のイベントとしている。
  - 影響: たたき台とはいえ、11 と 40 のどちらを canonical data と見るかが曖昧になる。実装者がサンプルを起点にすると、村に敵シンボルが出るなど台本と違うデータになる。
  - 推奨: `11-data-model.md` の Map.events 例を 40 のイベント ID に合わせるか、「この例は構造例であり Demo 01 実データではない」と明記する。

- [観点6] ポーション入手と戦闘コマンドの仕様が噛み合っていない
  - 根拠: `40-demo01-scenario.md:155`-`157` でポーションを入手し、`40-demo01-scenario.md:279` / `40-demo01-scenario.md:283` ではボス戦を「ポーション or ヒール」で調整するとしている。しかし `01-demo01-scope.md:65` の戦闘コマンドは `attack` / `skill` / `escape` のみで、item 使用がない。
  - 影響: ドット剣士がポーションを使える前提なら battle command に `item` が必要になる。`item` を増やさない場合、宝箱のポーションは戦闘バランス上使えない報酬になり、台本上の意味が薄くなる。
  - 推奨: Demo 01 で battle `item` を追加するか、ポーションはフィールド回復専用にするか、宝箱報酬を戦闘外でも意味があるものに変える。6 Event commands とは別の「戦闘内コマンド」なので、追加する場合も Event.commands 方針とは分けて判断できる。

- [観点6] Skill / damageFormula / Enemy.skills の契約が未定義
  - 根拠: `11-data-model.md:65` は `damageFormula` を `atk * 2 - def` とし、`11-data-model.md:166`-`169` は skill に `power` を持たせているが、power が式にどう入るか未定義。`11-data-model.md:187` / `11-data-model.md:194` では Enemy が actor skill と同じ `skill_power_strike` を使うが、`target: enemy_single` の意味が使用者視点か陣営固定か不明。
  - 影響: `22-battle-spec.md` / `23-job-skill-spec.md` に先送りでよい項目だが、`startBattle` の勝敗と Demo 01 の成立ターン数に直結するため、イベントエンジン実装前には最低限の契約が必要。
  - 推奨: skill damage / heal formula、MP 不足時、target の相対解釈、敵スキルの扱いを短い決定事項として先に固定する。

- [観点7/8/10] ロードマップ上、フェーズ 2 の前に「イベント仕様修正ゲート」が必要
  - 根拠: `41-roadmap.md:56`-`70` ではフェーズ 2 にイベントエンジン、宝箱、ワープ、戦闘、クリアがまとまっている。`41-roadmap.md:120` は commands 統一を厳守とするが、上記のランタイム状態と戦闘結果契約が未定義。
  - 影響: フェーズ 2 開始後に仕様穴を埋めると、イベントエンジンと戦闘遷移を同時に設計し直すことになり、20〜30 ターン計画が崩れやすい。
  - 推奨: フェーズ 0 の残タスクに「Event runtime contract / GameState / battle result contract の修正」を追加してから、フェーズ 1 / 2 に進む。

### Nice to have（後でよい）

- [観点2] `auto` trigger の再実行条件を軽く定義しておくとよい
  - 根拠: `21-event-system-spec.md:55` で `auto` が定義されているが、条件が真の間に毎フレーム再実行されるのか、一度だけなのかは未定義。
  - 推奨: Demo 01 で使わないなら「Demo 01 では未使用」としてよい。使うなら `runOnce` 相当の扱いが必要。

- [観点8] 追加仕様書の候補に `12-runtime-state.md` 相当を足すと整理しやすい
  - 根拠: 既存の `11-data-model.md` は定義データ中心で、Battle は runtime と明記されているが、flags / inventory / current map などのランタイム状態は置き場がない。
  - 推奨: 独立文書にしなくてもよいが、`11-data-model.md` 内に「Runtime GameState」を追加すると 21 / 40 との接続が明確になる。

- [観点8] README とロードマップの作成済み / 追加予定表現を少し整えるとよい
  - 根拠: `README.md:76` は今後追加予定の列挙に `40-demo01-scenario.md` を含んでおり、実際には作成済み。`41-roadmap.md:25`-`40` も現状の作成済み状態と少しずれて見える。
  - 推奨: レビュー後の仕様修正タイミングで、作成済み / 未作成の表示だけ合わせる。

## 観点別レビュー

1. 縦切りの技術的成立性
   - 条件付きで成立可能。最大の懸念は通常敵シンボルの消滅と `startBattle` の敗北 / 逃走時挙動。ここを直せば「タイトル → 村 → 会話 → 宝箱 → 洞窟 → 通常戦 → ボス → クリア」は 6 Event commands 方針で通せる。

2. データモデルの不足・矛盾
   - 不足は runtime `GameState`、flag 初期値、inventory、Event passability、page appearance。矛盾は `11-data-model.md` のサンプル events と `40-demo01-scenario.md` の実イベント ID / 所属マップのズレ。

3. 6 コマンドで台本が成立するか
   - 6 Event commands 自体は妥当。ただし敵消滅は `setFlag` + pages で表現する必要がある。`startBattle` の結果処理を command 外の暗黙処理にしすぎると、統一方針が崩れる。

4. `startBattle` 後の続行仕様の危険性
   - 現状は Blocking。勝利時だけ後続 commands に戻るという契約、敗北時の Game Over、逃走時の event 終了または再接触可能化を明記する必要がある。

5. flag 設計の不足
   - `chest_potion_opened` / `boss_defeated` の 2 flag だけでは、通常敵シンボル消滅をデータ駆動で表現できない。3 個目の `enemy_slime_defeated` を許容するのが最も素直。

6. 戦闘・ジョブ・スキルで先に決めるべき点
   - battle item を入れるかどうか、skill power の計算式、heal の扱い、target の相対解釈、敵スキル、敗北 / 逃走結果。これらは `22-battle-spec.md` / `23-job-skill-spec.md` でよいが、イベントエンジン着手前に最低限の結論が必要。

7. React + TypeScript + Three.js 想定時のリスク
   - 技術選定はまだ確定しない前提で、リスク指摘に留める。将来この構成を採る場合、3D 表示状態と RPG runtime state が密結合になると Event.commands のデータ駆動性が崩れやすい。描画、入力、イベント実行、戦闘遷移の責務境界を `10-architecture.md` で確認したい。

8. 実装前に作るべき追加仕様
   - 最優先は runtime state / event execution contract / battle result contract。次点で `22-battle-spec.md`、`23-job-skill-spec.md`、`24-diorama-rendering.md`。特に runtime state は `11-data-model.md` に追記してもよい。

9. Demo 01 で後回しにすべき機能
   - WONT 方針は概ね守れている。条件分岐コマンドや変数は不要。ただし敵消滅のために flag を 1 つ増やすのはスコープ拡大というより、既存の pages + flag 方式を正しく使うための最小修正と見るのが妥当。

10. 20〜30 ターン完成のための優先順位
   - フェーズ 2 に入る前に Blocking 3 件を潰すのが最短。ここを後回しにすると、イベントエンジン、戦闘、マップ接触判定を同時に手戻りさせる可能性が高い。

## 実装前に必ず直すべき仕様（まとめ）

1. `11-data-model.md` に runtime `GameState` を追加する。最低限 `flags`、`inventory`、`currentMapId`、`playerPosition`。
2. flag の初期値ルールを決める。推奨は「未定義 flag は false」。
3. `21-event-system-spec.md` の `startBattle` に `victory` / `escape` / `defeat` の結果契約を追加する。
4. `40-demo01-scenario.md` の通常敵シンボルについて、消滅を `setFlag enemy_slime_defeated=true` + pages で表現するか、消滅しない仕様に変える。
5. Event の passability / collision と `touch` 発火タイミングを定義する。
6. 宝箱の開封後 appearance を page override で表現するか、Demo 01 では見た目を変えないと明記する。
7. ポーションを戦闘中に使うかどうかを決め、使うなら battle command 側に `item` を追加する。使わないなら 40 のバランス記述を修正する。
8. `11-data-model.md` のサンプル event ID / map 所属を `40-demo01-scenario.md` に合わせる。

以上を直せば、ADRS の「Event.commands 統一」方針は Demo 01 の範囲では十分に維持できる。
