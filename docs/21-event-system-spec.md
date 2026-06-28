# 21 - イベントシステム仕様 (Event System Spec)

> ADRS の **心臓部**。会話・宝箱・ワープ・戦闘開始を個別機能にせず、
> **すべて Event の `commands`（コマンド列）で統一表現** する。
> このエンジンを 1 つ作れば、複数の RPG 機能が同時に成立する。

---

## 基本思想

> 「会話イベント」「宝箱イベント」「ワープイベント」という **別々のシステムは作らない。**
> あるのは **Event 1 種類** だけ。違いは `commands` の中身だけ。

これにより:
- 実装すべきエンジンは「コマンド列インタプリタ」1 個で済む
- 新しい挙動はコマンドを 1 つ足すだけで拡張できる
- データ（JSON）だけで多様なイベントを表現できる

---

## Event の構造

```jsonc
{
  "id": "ev_chest_01",
  "mapId": "map_town",
  "position": { "x": 10, "y": 6 },
  "trigger": "action",            // 起動条件（下表）
  "appearance": { "tile": "chest_closed" },
  "pages": [                      // 状態ごとの分岐（Demo 01 は最大2ページ程度）
    {
      "conditions": [             // このページが有効になる条件
        { "flag": "chest_01_opened", "value": false }
      ],
      "commands": [ /* コマンド列（下記） */ ]
    },
    {
      "conditions": [
        { "flag": "chest_01_opened", "value": true }
      ],
      "commands": [
        { "type": "message", "text": "宝箱は空っぽだ。" }
      ]
    }
  ]
}
```

### trigger（起動条件）

| 値 | 意味 | 典型例 |
|---|---|---|
| `action` | プレイヤーが隣接して「調べる」操作をしたとき | NPC 会話 / 宝箱 |
| `touch` | プレイヤーが接触したとき | 敵シンボル / 床ワープ |
| `auto` | 条件を満たすと自動実行 | マップ入場時の演出（Demo 01 は最小利用） |

### conditions（ページ条件）

Demo 01 では **フラグ条件のみ**。

```jsonc
{ "flag": "chest_01_opened", "value": true }
```

- 条件は AND 評価（すべて満たすページが有効）
- 上から最初に条件を満たしたページが採用される
- 条件分岐コマンド（if）や変数は **Demo 01 では後回し**

---

## Demo 01 の最小コマンドセット（6 種）

| type | 役割 | 主なパラメータ |
|---|---|---|
| `message` | メッセージウィンドウ表示 | `text` |
| `addItem` | アイテムを所持品に追加 | `itemId`, `amount` |
| `setFlag` | フラグの設定 | `flag`, `value` |
| `transfer` | マップ間移動（ワープ） | `mapId`, `x`, `y` |
| `startBattle` | 戦闘開始 | `troopId`, `canEscape` |
| `clearGame` | クリア画面へ遷移 | （なし） |

> これ以外のコマンド（`if` / `setVariable` / `playSE` / `wait` / `moveRoute` など）は
> **Demo 01 では実装しない**（後続デモで追加）。

---

### `message`

```jsonc
{ "type": "message", "text": "村へようこそ！" }
```
- 1 コマンド = 1 ウィンドウ（複数行はテキスト内改行 or message を並べる）

### `addItem`

```jsonc
{ "type": "addItem", "itemId": "item_potion", "amount": 1 }
```

### `setFlag`

```jsonc
{ "type": "setFlag", "flag": "chest_01_opened", "value": true }
```
- フラグは真偽値。宝箱の開封済み管理などに使う（Demo 01 で必須）

### `transfer`

```jsonc
{ "type": "transfer", "mapId": "map_cave", "x": 3, "y": 12 }
```

### `startBattle`

```jsonc
{ "type": "startBattle", "troopId": "troop_slime", "canEscape": true }
```
- 戦闘の挙動は `22-battle-spec.md`（詳細版・別途作成）に従う
- 勝利後はイベントの続きのコマンドに戻る想定

### `clearGame`

```jsonc
{ "type": "clearGame" }
```
- ボス撃破イベントの末尾で呼ぶ → クリア画面へ

---

## 実行モデル

1. プレイヤー操作 or 接触で Event が起動
2. `pages` を上から評価し、`conditions` を満たす **最初のページ** を選ぶ
3. そのページの `commands` を **上から順に 1 つずつ実行**
4. `message` などは完了（ウィンドウ送り）を待ってから次へ
5. `transfer` / `startBattle` / `clearGame` は画面遷移を伴う
6. 全コマンド実行で Event 終了

---

## 4 つの代表イベントを「コマンド列だけ」で表現

### ① NPC 会話

```jsonc
{
  "id": "ev_npc_oldman", "trigger": "action",
  "appearance": { "tile": "npc_oldman" },
  "pages": [{
    "conditions": [],
    "commands": [
      { "type": "message", "text": "洞窟の奥に魔物の主がおる。" },
      { "type": "message", "text": "気をつけて行くのじゃぞ。" }
    ]
  }]
}
```

### ② 宝箱（開封済み管理つき）

```jsonc
{
  "id": "ev_chest_01", "trigger": "action",
  "appearance": { "tile": "chest_closed" },
  "pages": [
    {
      "conditions": [{ "flag": "chest_01_opened", "value": false }],
      "commands": [
        { "type": "addItem", "itemId": "item_potion", "amount": 1 },
        { "type": "setFlag", "flag": "chest_01_opened", "value": true },
        { "type": "message", "text": "ポーションを手に入れた！" }
      ]
    },
    {
      "conditions": [{ "flag": "chest_01_opened", "value": true }],
      "commands": [{ "type": "message", "text": "宝箱は空っぽだ。" }]
    }
  ]
}
```

### ③ ワープ（村 → 洞窟）

```jsonc
{
  "id": "ev_warp_cave", "trigger": "touch",
  "appearance": { "tile": "cave_entrance" },
  "pages": [{
    "conditions": [],
    "commands": [
      { "type": "message", "text": "洞窟に入った。" },
      { "type": "transfer", "mapId": "map_cave", "x": 3, "y": 12 }
    ]
  }]
}
```

### ④ 敵シンボル接触 → 戦闘 → ボス撃破でクリア

```jsonc
// 通常敵シンボル
{
  "id": "ev_enemy_slime", "trigger": "touch",
  "appearance": { "tile": "symbol_slime" },
  "pages": [{
    "conditions": [],
    "commands": [
      { "type": "startBattle", "troopId": "troop_slime", "canEscape": true }
    ]
  }]
}

// ボスシンボル（勝利後にクリア）
{
  "id": "ev_boss", "trigger": "touch",
  "appearance": { "tile": "symbol_boss" },
  "pages": [{
    "conditions": [],
    "commands": [
      { "type": "message", "text": "洞窟の主が立ちはだかった！" },
      { "type": "startBattle", "troopId": "troop_boss", "canEscape": false },
      { "type": "setFlag", "flag": "boss_defeated", "value": true },
      { "type": "message", "text": "洞窟の主を倒した！" },
      { "type": "clearGame" }
    ]
  }]
}
```

---

## ✅ Demo 01 でやること / ❌ やらないこと

| やること | やらないこと（後回し） |
|---|---|
| Event 1 種類 + commands インタプリタ | イベントエディタ GUI（手書き JSON で可） |
| 6 コマンド（message/addItem/setFlag/transfer/startBattle/clearGame） | if / setVariable / playSE / wait / moveRoute |
| trigger 3 種（action/touch/auto） | リージョン起動 / 並列処理イベント |
| pages + flag 条件 | 変数条件 / 複雑なマルチページ分岐 |
| フラグ（真偽値） | 数値変数システム |

---

## 拡張の指針（後続デモ向けメモ）

- コマンドは「type で分岐する 1 配列」を維持する → 追加が容易
- `if` を入れるなら「commands のネスト」で表現する（`then` / `else`）
- 変数は flag と同じストアに数値として追加する
- これらは **Demo 01 のスコープ外**。設計余地として残すだけ。
