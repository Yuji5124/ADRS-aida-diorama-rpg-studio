# ADRS — AIDA Diorama RPG Studio

> **読み:** エイドラス
> **タグライン:** 「ドット絵の世界を、光るジオラマRPGに。」

---

## ADRS とは

**ADRS / AIDA Diorama RPG Studio** は、ドット絵タイルと 3D ジオラマ表現を組み合わせて、
**短編 RPG を制作できるアプリケーション** です。

RPGツクールMV 級の制作体験を目指しつつ、ADRS では 2D マップを 3D ジオラマとして立ち上げ、
**光・影・霧・奥行き** によって「作った瞬間に見栄えする RPG 制作ツール」を目指します。

ADRS が提供したい体験のジャンル表現:

- ピクセルジオラマRPG
- 2.5DジオラマRPG
- Pixel Diorama RPG
- Diorama RPG Studio

### 名称ポリシー（重要）

ADRS では **「HD-2D」という名称は使いません。**
仕様書・UI・コメントいずれにおいても、上記の「ピクセルジオラマRPG / Pixel Diorama RPG / Diorama RPG Studio」を使用します。

---

## Demo 01 の成功条件

Demo 01 は「RPGツクールMV 級の機能網羅」ではなく、
**「短い RPG がタイトルからクリアまで一周遊べる縦切り」** を成功条件とします。

1. タイトル画面から開始
2. はじまりの村に入る
3. NPC と会話する
4. 宝箱を開けてアイテムを入手する
5. 洞窟入口へ移動する
6. 小さな洞窟へワープする
7. 敵シンボルに触れて戦闘する
8. ボスを倒す
9. クリア画面へ到達する

規模の目安: マップ 2 枚 / 主人公 1 人 / ジョブ 2 種 / スキル各 2 / 通常敵 1 + ボス 1 / プレイ 3〜5 分。

---

## 現在の状態：仕様検討フェーズ

> ⚠️ **このリポジトリはまだ実装していません。**
> 現在は **Markdown による仕様検討フェーズ** です。

このフェーズでは以下を **行いません**:

- `src/` を作らない
- `package.json` を作らない
- React / Vite / Three.js / TypeScript のコードを書かない
- 技術選定を確定しない

扱うのは **Markdown 仕様書とレビュー用プロンプトのみ** です。

---

## 仕様書（docs/）

| ドキュメント | 内容 |
|---|---|
| [docs/00-overview.md](docs/00-overview.md) | ADRS の概要・名称ポリシー・用語・ドキュメント構成 |
| [docs/01-demo01-scope.md](docs/01-demo01-scope.md) | Demo 01 のスコープ（やること／やらないこと） |
| [docs/11-data-model.md](docs/11-data-model.md) | 主要データ構造（Project / Map / Event / Actor / Job / Skill / Enemy / Battle / System ほか） |
| [docs/21-event-system-spec.md](docs/21-event-system-spec.md) | イベント／コマンド仕様（ADRS の心臓部・6 コマンド統一方式） |
| [docs/40-demo01-scenario.md](docs/40-demo01-scenario.md) | Demo 01 ミニシナリオ台本（一周できる短編 RPG） |
| [docs/41-roadmap.md](docs/41-roadmap.md) | 実装前〜デモ完成までの進行計画（5 フェーズ / 20〜30 ターン） |

今後追加予定: `10-architecture.md` / `22-battle-spec.md` / `23-job-skill-spec.md` / `24-diorama-rendering.md` / `30-ai-support-spec.md` / `40-demo01-scenario.md` 以外の補助仕様。

---

## 設計の中心思想

- **縦切り優先** — 機能網羅より「最小機能が最後まで通る」こと
- **イベント統一** — 会話・宝箱・ワープ・戦闘開始を個別機能にせず、すべて Event の `commands` で表現する
- **見栄えは最小で達成** — ライト 1 灯 + 簡易影 + 固定斜め見下ろし
- **AI は 1 機能・承認制** — NPC セリフ／クエスト文の提案のみ、自動反映しない

---

## 次のステップ

1. ✅ 仕様書一式の作成（00 / 01 / 11 / 21 / 40 / 41）
2. ⏭️ **Codex による技術レビュー** — [prompts/CODEX_TECH_REVIEW_001.md](prompts/CODEX_TECH_REVIEW_001.md) を Codex に渡す
3. 🔜 レビュー結果を `docs/reviews/CODEX_REVIEW_001.md` にまとめる
4. 🔜 指摘を受けて仕様修正
5. 🔜 残り仕様書（10 / 22 / 23 / 24 / 30）へ進む
