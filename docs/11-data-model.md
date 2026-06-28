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
  "startingJob": "job_swordsman",   // 開始時固定ジョブ（または選択の初期値）
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
  "events": ["ev_npc_01", "ev_chest_01", "ev_warp_cave", "ev_enemy_slime"]
}
```

### 最小タイル種別（Demo 01）
`grass`(草) / `road`(道) / `water`(水) / `wall`(壁) / `tree`(木) / `house`(家) / `cave_floor`(洞窟床) / `rock`(岩)

---

## Event — 会話/宝箱/ワープ/戦闘を統一表現

> 詳細は `21-event-system-spec.md` を参照。ここでは構造のみ。

```jsonc
{
  "id": "ev_npc_01",
  "mapId": "map_town",
  "position": { "x": 7, "y": 4 },
  "trigger": "action",            // action(調べる) | touch(接触) | auto
  "appearance": { "tile": "npc_villager" },
  "pages": [
    {
      "conditions": [],           // Demo 01 はフラグ条件のみ（空=常時）
      "commands": [
        { "type": "message", "text": "村へようこそ！" }
      ]
    }
  ]
}
```

---

## Actor — 主人公

```jsonc
{
  "id": "actor_hero",
  "name": "主人公",
  "jobId": "job_swordsman",       // ドット剣士 or 光術士
  "level": 1,
  "stats": { "hp": 30, "mp": 8, "atk": 7, "def": 5, "spd": 6 },
  "skills": ["skill_power_strike", "skill_guard_break"]
}
```

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

---

## Skill — スキル（各ジョブ 2 個）

```jsonc
[
  { "id": "skill_power_strike", "name": "パワーストライク", "type": "attack", "mpCost": 3, "power": 12, "target": "enemy_single" },
  { "id": "skill_guard_break",  "name": "ガードブレイク",   "type": "attack", "mpCost": 4, "power": 8,  "target": "enemy_single" },
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
    "stats": { "hp": 18, "mp": 0, "atk": 5, "def": 2, "spd": 4 },
    "exp": 5, "gold": 3,
    "skills": ["skill_power_strike"]
  },
  {
    "id": "enemy_boss",
    "name": "洞窟の主",
    "stats": { "hp": 60, "mp": 10, "atk": 10, "def": 4, "spd": 5 },
    "exp": 50, "gold": 30,
    "skills": ["skill_power_strike"]
  }
]
```

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

---

## 参照関係まとめ

```
Project ──> System
        ──> Map[] ──> Event[] ──(startBattle)──> Troop ──> Enemy[]
Actor ──> Job ──> Skill[]
Actor ──> Skill[]
System ──> Item[]
```

---

## Demo 01 では持たないフィールド（意図的に省略）

- 装備スロット / 装備品
- 状態異常・属性
- セーブデータ構造
- ショップ在庫 / 価格テーブル（gold は持つが使い道は最小）
- レベルアップ曲線テーブル（成長は statGrowth の単純加算で代用）
