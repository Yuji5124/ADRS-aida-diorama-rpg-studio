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
  "id": "ev_chest_potion",
  "mapId": "map_town",
  "position": { "x": 10, "y": 6 },
  "trigger": "action",            // 起動条件（下表）
  "appearance": { "tile": "chest_closed", "visible": true },  // デフォルト見た目
  "pages": [                      // 状態ごとの分岐（Demo 01 は最大2ページ程度）
    {
      "conditions": [             // このページが有効になる条件
        { "flag": "chest_potion_opened", "value": false }
      ],
      "appearance": { "tile": "chest_closed", "visible": true },  // 任意。ページ優先
      "commands": [ /* コマンド列（下記） */ ]
    },
    {
      "conditions": [
        { "flag": "chest_potion_opened", "value": true }
      ],
      "appearance": { "tile": "chest_opened", "visible": true },  // 開封後の見た目
      "commands": [
        { "type": "message", "text": "宝箱は空っぽだ。" }
      ]
    }
  ]
}
```

### appearance（見た目）の優先ルール

> 新コマンドを増やさず、見た目の切り替え（宝箱の開閉・敵シンボルの消滅）を表現するための規約。

| 場所 | 役割 |
|---|---|
| `Event.appearance` | デフォルトの見た目（必須） |
| `EventPage.appearance` | **任意**。採用ページにあれば優先。未指定なら Event 直下を継承 |

- `appearance.visible` が `false` の場合、そのイベントは **非表示・当たり判定なし・trigger 発火なし**
- 有効なページが 1 つも無い場合も、同様に **非表示・当たり判定なし・trigger 発火なし**
- これにより `chest_closed`→`chest_opened`、敵シンボルの勝利後 `visible:false` 消滅を **データ駆動** で表現できる

### trigger（起動条件）

| 値 | 意味 | 通行（標準） | 典型例 |
|---|---|---|---|
| `action` | プレイヤーが隣接して決定キーを押したとき | **踏めない**（衝突する） | NPC 会話 / 宝箱 |
| `touch` | プレイヤーがそのマスへ侵入したとき発火 | **踏める**（侵入で発火） | 敵シンボル / 床ワープ |
| `auto` | 条件を満たすと自動実行（Demo 01 は最小利用） | — | マップ入場時の演出 |

#### 通行・当たり判定の標準ルール（Demo 01）

- `action` イベント（NPC・宝箱）は **通行不可**。隣接して決定キーで起動。
- `touch` イベント（敵シンボル・ワープ）は **そのマスに乗れる**。侵入した瞬間に commands 実行。
- `appearance.visible` が `false` のイベントは **当たり判定なし・trigger 発火なし**（踏み抜けられる）。
- 上記で足りない個別調整が要る場合のみ、Event に `passable`（真偽）を持たせて上書きする（Demo 01 は基本不要）。

### conditions（ページ条件）

Demo 01 では **フラグ条件のみ**。

```jsonc
{ "flag": "chest_potion_opened", "value": true }
```

- 条件は AND 評価（すべて満たすページが有効）
- flag のストア・初期値（未定義=false）は `11-data-model.md` の **GameState** を参照
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
{ "type": "setFlag", "flag": "chest_potion_opened", "value": true }
```
- フラグは真偽値。宝箱の開封済み管理・敵シンボル消滅・クリア記録に使う（Demo 01 で必須）
- 反映先は GameState.flags（`11-data-model.md`）

### `transfer`

```jsonc
{ "type": "transfer", "mapId": "map_cave", "x": 3, "y": 12 }
```

### `startBattle`

```jsonc
{ "type": "startBattle", "troopId": "troop_slime", "canEscape": true }
```
- 戦闘の挙動は `22-battle-spec.md`（詳細版・別途作成）に従う

#### 結果契約（重要 / 後続コマンドの実行可否）

`startBattle` は **victory / escape / defeat** の結果を返す。後続コマンドの扱いは結果で決まる。

| 結果 | 後続コマンド | 画面遷移 |
|---|---|---|
| `victory`（勝利） | **続行**（次の commands を実行） | イベントへ復帰 |
| `escape`（逃走） | **実行しない**（イベント即終了） | マップへ復帰。イベントは未消化のまま残る（再接触可） |
| `defeat`（敗北） | **実行しない** | ゲームオーバーへ遷移 |

- この契約により、**勝利時だけ** `setFlag` などの後続が走る。
  - 例: 通常敵は victory 時のみ `enemy_slime_01_defeated=true` → 逃走時はシンボルが残る。
  - 例: ボスは victory 時のみ `boss_defeated=true` → `clearGame`。敗北前にクリアが走るバグを防ぐ。
- `canEscape: false` の戦闘では `escape` 結果は発生しない（ボス戦）。

### `clearGame`

```jsonc
{ "type": "clearGame" }
```
- ボス撃破イベントの末尾で呼ぶ → クリア画面へ

---

## 実行モデル

1. `pages` を上から評価し、`conditions` を満たす **最初のページ** を採用（見た目は採用ページの `appearance`、無ければ Event 直下）
2. 採用ページが `visible:false`、または有効ページが無い → **非表示・当たり判定なし・trigger 発火なし**（起動しない）
3. プレイヤー操作（`action`）or 侵入（`touch`）で Event 起動
4. 採用ページの `commands` を **上から順に 1 つずつ実行**
5. `message` などは完了（ウィンドウ送り）を待ってから次へ
6. `startBattle` は結果契約に従う（victory のみ後続続行 / escape・defeat は後続中断）
7. `transfer` / `clearGame` は画面遷移を伴う
8. 全コマンド実行で Event 終了 → 次回起動時は再度ページ評価（flag が変われば別ページ＝別の見た目/挙動）

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

### ② 宝箱（開封済み管理 + 見た目切り替え）

```jsonc
{
  "id": "ev_chest_potion", "trigger": "action",
  "appearance": { "tile": "chest_closed", "visible": true },
  "pages": [
    {
      "conditions": [{ "flag": "chest_potion_opened", "value": false }],
      "appearance": { "tile": "chest_closed", "visible": true },
      "commands": [
        { "type": "addItem", "itemId": "item_potion", "amount": 1 },
        { "type": "setFlag", "flag": "chest_potion_opened", "value": true },
        { "type": "message", "text": "ポーションを手に入れた！" }
      ]
    },
    {
      "conditions": [{ "flag": "chest_potion_opened", "value": true }],
      "appearance": { "tile": "chest_opened", "visible": true },
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
// 通常敵シンボル（勝利で消滅 / 逃走で残る）
{
  "id": "ev_enemy_slime_01", "trigger": "touch",
  "appearance": { "tile": "symbol_slime", "visible": true },
  "pages": [
    {
      "conditions": [{ "flag": "enemy_slime_01_defeated", "value": false }],
      "appearance": { "tile": "symbol_slime", "visible": true },
      "commands": [
        { "type": "startBattle", "troopId": "troop_slime", "canEscape": true },
        // victory のみここへ到達 → シンボル消滅。escape は後続未実行でシンボル残存
        { "type": "setFlag", "flag": "enemy_slime_01_defeated", "value": true }
      ]
    },
    {
      "conditions": [{ "flag": "enemy_slime_01_defeated", "value": true }],
      "appearance": { "visible": false },   // 消滅：非表示・当たり判定なし・trigger なし
      "commands": []
    }
  ]
}

// ボスシンボル（勝利後にクリア）
{
  "id": "ev_boss", "trigger": "touch",
  "appearance": { "tile": "symbol_boss", "visible": true },
  "pages": [{
    "conditions": [{ "flag": "boss_defeated", "value": false }],
    "commands": [
      { "type": "message", "text": "洞窟の主が立ちはだかった！" },
      { "type": "startBattle", "troopId": "troop_boss", "canEscape": false },
      // victory のみここへ到達（canEscape:false なので escape は発生しない）
      { "type": "setFlag", "flag": "boss_defeated", "value": true },
      { "type": "message", "text": "洞窟の主を倒した！" },
      { "type": "clearGame" }
    ]
  }]
}
```

> **ポイント:** 敵シンボルの消滅を「エンジンの暗黙処理」にせず、`setFlag` + ページの `visible:false` で
> **データ駆動** で表現する。これにより「敵だけ特別扱い」が生まれず、Event.commands 統一が保たれる。

---

## ✅ Demo 01 でやること / ❌ やらないこと

| やること | やらないこと（後回し） |
|---|---|
| Event 1 種類 + commands インタプリタ | イベントエディタ GUI（手書き JSON で可） |
| 6 コマンド（message/addItem/setFlag/transfer/startBattle/clearGame） | if / setVariable / playSE / wait / moveRoute |
| trigger 3 種（action/touch/auto）+ 標準当たり判定 | リージョン起動 / 並列処理イベント |
| pages + flag 条件 | 変数条件 / 複雑なマルチページ分岐 |
| フラグ（真偽値・GameState.flags） | 数値変数システム |
| ページ別 appearance（visible 切り替え含む） | アニメーション付き出現演出 |
| startBattle の victory/escape/defeat 契約 | 戦闘内 item / 複雑な戦闘結果分岐 |

> **コマンドは 6 種のまま増やしていない。** 追加したのは「ページ別 appearance」「startBattle 結果契約」
> という **データ規約** であり、新コマンドではない点に注意。

---

## 拡張の指針（後続デモ向けメモ）

- コマンドは「type で分岐する 1 配列」を維持する → 追加が容易
- `if` を入れるなら「commands のネスト」で表現する（`then` / `else`）
- 変数は flag と同じストアに数値として追加する
- これらは **Demo 01 のスコープ外**。設計余地として残すだけ。
