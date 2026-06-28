# 11 - データモデル (Data Model)

> ADRS Demo 01 の主要データ構造を定義する。**たたき台（仮置き）** であり、技術選定は未確定。
> 記述はすべて **JSON 想定**。実装言語・保存形式は本書では確定しない。

---

## 設計原則

1. **ID 参照で疎結合** — エンティティは埋め込みではなく文字列 ID で参照する
2. **イベントは commands で統一** — 会話・宝箱・ワープ・戦闘を個別構造にしない（→ `21-event-system-spec.md`）
3. **計算式は System に集約** — ダメージ式・成長式を散らさない
4. **ID 命名規則** — 接頭辞を付ける: `map_` / `ev_` / `actor_` / `job_` / `skill_` / `enemy_` / `troop_` / `item_`

---

## エンティティ一覧

| エンティティ | 役割 | Demo 01 の規模 |
|---|---|---|
| Project | 全体ルート | 1 |
| System | 全体設定・初期値・用語・計算式 | 1 |
| Map | タイル + イベント配置 + ジオラマ設定 | 2 |
| Event | 会話/宝箱/ワープ/戦闘を commands で表現 | 数個/マップ |
| Actor | 主人公 | 1 |
| Job | 職業 | 2 |
| Skill | スキル | 4（各ジョブ2） |
| Enemy | 敵 1 体の定義 | 2（通常+ボス） |
| Troop | 戦闘の敵編成 | 数個 |
| Battle | 戦闘の実行時状態（保存対象ではない） | 実行時 |
| Item | アイテム | 数個 |
| GameState | ランタイム状態（flags / inventory / 現在地） | 実行時 |

---

## Project — 全体ルート

```jsonc
{
  "id": "proj_demo01",
  "title": "ADRS Demo 01",
  "version": "0.1.0",
  "system": "system.json",        // System への参照
  "maps": ["map_town", "map_cave"],
  "startMapId": "map_town",
  "startPosition": { "x": 5, "y": 8 }
}
```

---

## System — 全体設定・計算式・用語

```jsonc
{
  "gameTitle": "ADRS Demo 01",
  "startingParty": ["actor_hero"],
  "startingJob": "job_swordsman",   // 開始時ジョブ選択の「フォールバック / デバッグ用初期値」（→ 23-job-skill-spec.md §2）
  "items": [
    { "id": "item_potion", "name": "ポーション", "effect": { "hp": 15 } }
  ],
  "terms": {
    "hp": "HP", "mp": "MP",
    "attack": "こうげき", "skill": "スキル", "escape": "にげる"
  },
  "damageFormula": "atk * 2 - def", // 仮の標準式（固定）
  "clearScene": "ボスを倒した！"      // クリア画面用テキスト
}
```

---

## Map — タイル + イベント + ジオラマ設定

```jsonc
{
  "id": "map_town",
  "name": "はじまりの村",
  "width": 20,
  "height": 15,
  "tileSize": 32,
  "layers": [
    { "name": "ground", "tiles": [/* width*height のタイルID配列 */] },
    { "name": "deco",   "tiles": [/* 木・家・岩など */] }
  ],
  "collision": [/* width*height: 0=通行可, 1=通行不可 */],
  "diorama": {
    "cameraAngle": 45,            // 固定の斜め見下ろし
    "light": { "type": "directional", "intensity": 1.0, "angle": 60 },
    "shadow": true                // 簡易影
  },
  "events": ["ev_npc_villager", "ev_npc_oldman", "ev_chest_potion", "ev_warp_cave"]
}
```

> イベント ID は `40-demo01-scenario.md` の Demo 01 実データに一致させる。
> `map_cave` 側は `ev_enemy_slime_01` / `ev_boss` を持つ。

### 最小タイル種別（Demo 01）
`grass`(草) / `road`(道) / `water`(水) / `wall`(壁) / `tree`(木) / `house`(家) / `cave_floor`(洞窟床) / `rock`(岩)

---

## Event — 会話/宝箱/ワープ/戦闘を統一表現

> 詳細は `21-event-system-spec.md` を参照。ここでは構造のみ。

```jsonc
{
  "id": "ev_npc_villager",
  "mapId": "map_town",
  "position": { "x": 7, "y": 6 },
  "trigger": "action",            // action(調べる) | touch(接触) | auto
  "appearance": { "tile": "npc_villager", "visible": true },  // Event 直下=デフォルト見た目
  "pages": [
    {
      "conditions": [],           // Demo 01 はフラグ条件のみ（空=常時）
      "appearance": { "tile": "npc_villager", "visible": true }, // 任意。ページ側があれば優先
      "commands": [
        { "type": "message", "text": "村へようこそ！" }
      ]
    }
  ]
}
```

### appearance の優先ルール（Demo 01）

- `Event.appearance` … デフォルトの見た目（必須）
- `EventPage.appearance` … **任意**。指定があればそのページ採用時にこちらを優先（未指定なら Event 直下を継承）
- `appearance.visible` … `false` のとき **非表示・当たり判定なし・trigger 発火なし**
- 有効なページが 1 つも無いときも **非表示・当たり判定なし・trigger 発火なし** とみなす

> これにより「宝箱 `chest_closed`→`chest_opened`」「敵シンボル勝利後に `visible:false` で消滅」を
> **新コマンドを増やさず** データ駆動で表現できる（→ `21-event-system-spec.md`）。

---

## Actor — 主人公

```jsonc
{
  "id": "actor_hero",
  "name": "主人公",
  "jobId": "job_swordsman",       // 開始時ジョブ選択で確定（ドット剣士 or 光術士）
  "level": 1,
  "stats": { "hp": 36, "mp": 8, "atk": 8, "def": 5, "spd": 5 },  // 選択ジョブの初期ステータスを反映（例: ドット剣士）
  "skills": ["skill_power_strike", "skill_guard_break"]          // 選択ジョブのスキル
}
```

> `jobId` は **New Game 後のジョブ選択**で確定（→ `23-job-skill-spec.md` §2）。`stats` / `skills` は選択ジョブの初期値を反映する。
> 光術士を選んだ場合は `stats: { hp:30, mp:20, atk:5, def:3, spd:6 }` / `skills: [skill_light_bolt, skill_heal]`。

---

## Job — ジョブ（2 種）

```jsonc
[
  {
    "id": "job_swordsman",
    "name": "ドット剣士",
    "feature": "通常攻撃が強い",
    "statGrowth": { "hp": 6, "mp": 1, "atk": 3, "def": 2, "spd": 1 },
    "learnableSkills": ["skill_power_strike", "skill_guard_break"]
  },
  {
    "id": "job_lightmage",
    "name": "光術士",
    "feature": "MPを使ったスキルが得意",
    "statGrowth": { "hp": 4, "mp": 3, "atk": 1, "def": 1, "spd": 2 },
    "learnableSkills": ["skill_light_bolt", "skill_heal"]
  }
]
```

> Demo 01 での扱い（→ `23-job-skill-spec.md`）: `learnableSkills` は **初期習得スキル一覧**、
> `statGrowth` は **将来用**（Demo 01 ではレベルアップ成長を扱わない）。初期ステータスは
> 剣士 `{hp:36,mp:8,atk:8,def:5,spd:5}` / 光術士 `{hp:30,mp:20,atk:5,def:3,spd:6}`。

---

## Skill — スキル（各ジョブ 2 個）

```jsonc
[
  { "id": "skill_power_strike", "name": "パワーストライク", "type": "attack", "mpCost": 3, "power": 12, "target": "enemy_single" },
  { "id": "skill_guard_break",  "name": "ガードブレイク",   "type": "attack", "mpCost": 4, "power": 9,  "target": "enemy_single" },
  { "id": "skill_light_bolt",   "name": "ライトボルト",     "type": "attack", "mpCost": 4, "power": 14, "target": "enemy_single" },
  { "id": "skill_heal",         "name": "ヒール",           "type": "heal",   "mpCost": 5, "power": 18, "target": "ally_single" }
]
```

- `type`: Demo 01 は `attack` / `heal` の 2 種のみ
- `target`: `enemy_single` / `ally_single`

---

## Enemy — 敵（通常 1 + ボス 1）

```jsonc
[
  {
    "id": "enemy_slime",
    "name": "スライム",
    "stats": { "hp": 12, "mp": 0, "atk": 3, "def": 1, "spd": 4 },
    "exp": 5, "gold": 3,
    "skills": ["skill_power_strike"]
  },
  {
    "id": "enemy_boss",
    "name": "洞窟の主",
    "stats": { "hp": 56, "mp": 10, "atk": 5, "def": 4, "spd": 5 },
    "exp": 50, "gold": 30,
    "skills": ["skill_power_strike"]
  }
]
```

> 敵ステータスは `23-job-skill-spec.md` §6 の **バランス検証で確定した仮値**。
> 特に boss `atk` は旧値 10 だと敵通常攻撃（`atk*2-def`）が両ジョブを数ターンで全滅させるため **5 に調整**した。

> **`Enemy.skills` は Demo 01 では「予約フィールド」扱い**。Battle Runtime は Demo 01 では
> **敵の通常攻撃のみ**を実行し、`skills` は参照しない（敵スキルは後続デモ）。詳細は `22-battle-spec.md` §9。
> `spd` も将来用に保持するが、Demo 01 の行動順には使わない（味方→敵の固定順 / `22-battle-spec.md` §6）。

---

## Troop — 敵編成

```jsonc
[
  { "id": "troop_slime", "members": ["enemy_slime", "enemy_slime"] },
  { "id": "troop_boss",  "members": ["enemy_boss"] }
]
```

---

## Battle — 戦闘の実行時状態（保存対象外）

```jsonc
{
  "battleId": "bt_runtime",
  "troopId": "troop_slime",
  "party": ["actor_hero"],
  "turn": 1,
  "phase": "input",               // input | action | result
  "canEscape": true
}
```

---

## Item — アイテム

```jsonc
{
  "id": "item_potion",
  "name": "ポーション",
  "effect": { "hp": 15 }
}
```

> Demo 01 では `item_potion` は **宝箱イベントと所持品更新の動作確認用**。
> 戦闘中の「どうぐ」コマンドは Demo 01 では扱わない（→ `40-demo01-scenario.md` §5）。

---

## GameState — ランタイム状態（保存対象は別途）

> プレイ中に変化する状態を持つ実行時オブジェクト。`flags` / `inventory` の保存先がこれにあたる。
> 定義データ（Map / Actor など）とは分離する。Demo 01 ではセーブ機構は作らないが、
> **状態の置き場所は仕様として明示** しておく（イベントエンジンが参照する契約）。

```jsonc
{
  "flags": {                       // 真偽値フラグのストア
    "chest_potion_opened": false,
    "enemy_slime_01_defeated": false,
    "boss_defeated": false
  },
  "inventory": [                   // addItem の反映先
    { "itemId": "item_potion", "amount": 0 }
  ],
  "party": ["actor_hero"],         // 現在のパーティ（HP/MP は victory 後に全回復 / 22-battle-spec.md §11）
  "currentMapId": "map_town",      // 現在のマップ
  "playerPosition": { "x": 5, "y": 8 },  // 主人公の現在位置
  "scene": "field"                 // 現在のシーン/モード: title | jobSelect | field | battle | clear | gameover
}
```

> `scene`（= mode）は遷移管理に使う（`10-architecture.md` §4）。タイトル → ジョブ選択 → フィールド →
> 戦闘 → クリア / ゲームオーバーの遷移先を表す。フェーズ1 の地形移動だけなら `field` 固定で足りるが、
> フェーズ2（戦闘・クリア・ゲームオーバー遷移）の前提として GameState に含める。

### flag の初期値ルール

- **未定義の flag は `false` として扱う**（`initialFlags` を毎回書かなくてよい）
- 明示初期化したい場合のみ `flags` に列挙する
- Demo 01 で使う flag は **3 個**:
  - `chest_potion_opened` … 宝箱の二重取得防止
  - `enemy_slime_01_defeated` … 通常敵シンボルの消滅（勝利後 `visible:false`）
  - `boss_defeated` … クリア記録

> flag が 2→3 個に増えるのは **スコープ拡大ではなく**、敵シンボル消滅をエンジンの暗黙処理にせず
> Event.commands 統一方針の内側（pages + flag）で表現するための **最小修正**。

### New Game 初期化

- `flags` は空（=すべて false）
- `inventory` は空（ポーションは宝箱で入手）
- `currentMapId` / `playerPosition` は Project の `startMapId` / `startPosition` で初期化

---

## 参照関係まとめ

```
Project ──> System
        ──> Map[] ──> Event[] ──(startBattle)──> Troop ──> Enemy[]
Actor ──> Job ──> Skill[]
Actor ──> Skill[]
System ──> Item[]

Event.commands ──(setFlag)──> GameState.flags
               ──(addItem)──> GameState.inventory
               ──(transfer)─> GameState.currentMapId / playerPosition
Event.pages ──(conditions)── 参照 ── GameState.flags
```

---

## Demo 01 では持たないフィールド（意図的に省略）

- 装備スロット / 装備品
- 状態異常・属性
- セーブデータ構造
- ショップ在庫 / 価格テーブル（gold は持つが使い道は最小）
- レベルアップ曲線テーブル（成長は statGrowth の単純加算で代用）
