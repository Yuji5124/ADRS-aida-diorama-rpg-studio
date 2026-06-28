# Codex 技術レビュー依頼 #002 — ADRS Demo 01 実装可否の最終審査

> このファイルは **Codex に貼り付けるレビュー依頼プロンプト** です。
> 今回は 1 回目（#001）のような個別仕様レビューではなく、**フェーズ0 仕様一式を通読**したうえで、
> ADRS Demo 01 が **実装フェーズ1 に進んでよいか（GO / NO-GO）を判定する最終審査**です。

---

## あなた（Codex）への依頼

あなたは ADRS / AIDA Diorama RPG Studio の **実装可否の最終審査担当** です。
フェーズ0 の仕様一式を読み、**実装フェーズ1 に着手してよいか**を判定してください。

**重要: あなたは実装しません。審査だけを行います。**

- コードを書かないでください
- `src/` を作らないでください
- `package.json` を作らないでください
- React / Vite / Three.js / TypeScript の実装を始めないでください
- 技術選定を勝手に確定しないでください（実装候補のまま扱う）
- **スコープを広げる提案をしないでください**
- **Demo 01 で WONT（やらない）になっている機能を復活させないでください**

成果物は **レビュー結果の Markdown（内容案）** のみです。

---

## 前提（ADRS Demo 01 の確定方針）

- **縦切り優先**: 機能網羅ではなく「短い RPG がタイトル→クリアまで一周遊べる」ことが成功条件。
- **Event.commands 統一が心臓部**: 会話・宝箱・ワープ・戦闘開始を個別機能にせず、Event の 6 コマンドで表現する。
  - 6 コマンド: `message` / `addItem` / `setFlag` / `transfer` / `startBattle` / `clearGame`
- **「HD-2D」という名称は使わない**（ピクセルジオラマRPG / Pixel Diorama RPG / Diorama RPG Studio）。
- フェーズ0（仕様確定）は完了済み。1 回目 Codex レビューと内部整合レビューも反映済み。

---

## 読むべきファイル

以下を **すべて通読**してから審査してください。

1. `README.md`
2. `docs/00-overview.md`
3. `docs/01-demo01-scope.md`
4. `docs/10-architecture.md`
5. `docs/11-data-model.md`
6. `docs/21-event-system-spec.md`
7. `docs/22-battle-spec.md`
8. `docs/23-job-skill-spec.md`
9. `docs/24-diorama-rendering.md`
10. `docs/30-ai-support-spec.md`
11. `docs/40-demo01-scenario.md`
12. `docs/41-roadmap.md`
13. `docs/reviews/CODEX_REVIEW_001.md`
14. `docs/reviews/INTERNAL_CONSISTENCY_REVIEW_001.md`

---

## 審査観点

### 1. 実装フェーズ1へ進んでよいか（最重要 / Verdict）

仕様一式を読み、**`GO` または `NO-GO`** を判定する。
`NO-GO` の場合は、実装前に必ず直すべき **Blocking Issue** を明記すること。

### 2. 一周導線が仕様上成立しているか

次の導線が **仕様だけで成立**しているか（途中で詰まる/未定義がないか）:

1. タイトル画面 → 2. New Game → 3. ジョブ選択 → 4. はじまりの村 → 5. NPC 会話 →
6. 宝箱 → 7. 洞窟へワープ → 8. 通常敵戦闘 → 9. ボス戦闘 →
10. victory 後に HP/MP 全回復 → 11. `boss_defeated` flag → 12. `clearGame` → 13. クリア画面

### 3. Event.commands 統一方針が維持されているか

- Event command は **6 種のみ**（message / addItem / setFlag / transfer / startBattle / clearGame）
- AI は command を **追加・削除・並べ替えしない**
- 通常敵の消滅が **`setFlag` + `visible:false`** で表現できている
- `startBattle` 結果契約が明確: **victory のみ後続 commands へ進む / escape・defeat では進まない**

### 4. Runtime GameState が十分か

実装フェーズ1〜2 の前提として、以下が足りているか:
`flags` / `inventory` / `party` / `currentMapId` / `playerPosition` /
selected job（`actor_hero.jobId`）/ current scene・mode / **未定義 flag = false**

不足は Blocking / Important / Nice to have に分けて指摘。

### 5. 表示・衝突・trigger の同期が明確か

`EventPage.appearance.visible === false` のとき:
- Play Mode では **描画しない / 影も描画しない / 当たり判定なし / trigger なし**
- Editor Mode では **イベント一覧に残る**
- **Renderer が GameState を直接更新しない**

これらが仕様上破綻していないか。

### 6. 戦闘仕様が実装可能な粒度か

- コマンドは **`attack` / `skill` / `escape` の 3 つのみ**（item/guard/equipment/state/attribute なし）
- **victory 後のみ HP/MP 全回復 / escape・defeat では回復しない**
- 敵スキルは **予約フィールド扱い**、`spd` は行動順に使わない
- 数値バランスが **通常 2 ターン / ボス 4〜5 ターン** で成立しているか

### 7. AI Support が実装必須依存になっていないか

- **Editor Mode 専用 / Play Mode の必須依存ではない**
- 実 AI API は必須ではない（**擬似 AI・テンプレート生成で成立**）
- AI は **`message.text` だけ**を提案・反映する
- AI は addItem/setFlag/transfer/startBattle/clearGame を変更しない

### 8. 実装フェーズ1の開始範囲が適切か（最重要）

最初のフェーズ1 を **以下に絞るべきか**確認する:

```text
Project Data 読み込み
Map JSON 読み込み
2D/3D ジオラマ表示
主人公表示
グリッド移動
衝突判定
固定斜め見下ろしカメラ
```

そして、**以下はフェーズ1 に入れない**前提が妥当か確認する:
Event Runtime / Battle Runtime / Job selection UI / AI Support / full Editor UI / save・load / Tauri / DB editing GUI

> ここを重点的に: **「実装フェーズ1の最初の一歩が、戦闘・AI・イベントまで広げず、十分に狭く絞れているか」** を強めに評価してほしい。

### 9. 実装前に必要な追加仕様が残っていないか

実装フェーズ1 に入る前に必要な追加仕様があれば Blocking / Important / Nice to have に分けて出す。
ただし **スコープ拡大ではなく、既存仕様の曖昧さ解消に限定**すること。

---

## 出力形式（厳守）

以下の構成の Markdown で出力すること（`docs/reviews/CODEX_REVIEW_002.md` に保存する内容案）。

```markdown
# CODEX REVIEW 002 - ADRS Demo 01 Implementation Readiness

## 1. Final Verdict
- Verdict: GO / NO-GO
- Reason:

## 2. Blocking Issues
（実装前に必ず直すべき問題。なければ「None」）

## 3. Important Issues
（実装前またはフェーズ1中に直すべき問題）

## 4. Nice to Have
（後続でよい改善点）

## 5. Scope Check
（Demo 01 のスコープが広がっていないか）

## 6. Event / Runtime Check
（Event.commands / GameState / startBattle 契約 / visible:false の確認）

## 7. Battle / Job Check
（戦闘・ジョブ・数値バランスの確認）

## 8. AI Support Check
（AI サポートの依存関係と安全性の確認）

## 9. Phase 1 Implementation Recommendation
（最初に実装すべき範囲を具体化）

## 10. Required Fixes Before Implementation
（実装前に必須の修正があれば列挙。なければ「None」）

## 11. Recommended First Implementation Slice
（最初の実装スライスを「やること / やらないこと」で整理）
```

---

## 判定の指針

- **GO**: 一周導線が仕様だけで成立し、フェーズ1 の範囲が十分狭く、Blocking がない。
- **NO-GO**: 一周を止める未定義・矛盾がある、またはフェーズ1 の範囲が広すぎる。→ Blocking を明記。

> 迷ったら「**この仕様だけで、フェーズ1 の狭いスライス（Project Data 読み込み〜衝突判定）を実装し始められるか**」を基準に判断すること。

---

## やってはいけないこと（再掲）

- 実装しない / コードを書かない / `src/`・`package.json` を作らない
- 技術選定を確定しない
- スコープを広げない / WONT 機能を復活させない
- レビュー結果（Markdown）以外を出力しない
