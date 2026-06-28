# 40 - Demo 01 シナリオ台本 (Scenario)

> ADRS Demo 01 の成功条件「タイトル → 村 → 会話 → 宝箱 → 洞窟 → 戦闘 → ボス撃破 → クリア」を
> **実際に一周できる短編 RPG 台本** として具体化する。
> 本書は `21-event-system-spec.md` の **6 コマンドのみ**（message / addItem / setFlag / transfer / startBattle / clearGame）で表現する。
> ストーリーは軽く、**3〜5 分で一周** できることを最優先する。
>
> **更新（Codex レビュー反映）:** 通常敵シンボルの消滅を flag `enemy_slime_01_defeated` で表現（flag は計 3 個）。
> 宝箱は `chest_closed`→`chest_opened` をページ別 appearance で切り替え。ポーションは戦闘中に使わない。

---

## 1. 短編シナリオ概要

| 項目 | 内容 |
|---|---|
| タイトル案 | **「光る洞窟と小さな勇者」**（Pixel Diorama RPG / Demo 01） |
| 舞台 | はじまりの村と、その東にある小さな洞窟 |
| 目的 | 村人と老人の話を聞き、洞窟に巣食う「洞窟の主」を倒す |
| クリア条件 | ボス（洞窟の主）を撃破し、クリア画面に到達する |
| プレイ時間 | 3〜5 分 |
| トーン | 重くしない。短く・分かりやすく・テンポ重視 |

### あらすじ（最小）
村に魔物が出るようになった。村の老人が「洞窟の奥に魔物の主がいる」と告げる。
主人公はポーションを手に入れ、洞窟へ向かい、道中の魔物を退け、洞窟の主を倒して村を救う。

> ストーリー分岐・サブクエスト・複数結末は **作らない**（Demo 01 スコープ外）。

---

## 2. マップ構成（2 枚のみ）

### map_town — はじまりの村

| 項目 | 内容 |
|---|---|
| 役割 | スタート地点。会話・宝箱・チュートリアル的導線 |
| 広さの目安 | 20 × 15 マス程度 |
| 置くタイル | `grass`(草) / `road`(道) / `water`(水) / `tree`(木) / `house`(家) / `wall`(壁) |
| 置くイベント | NPC村人 / NPC老人 / 宝箱 / 洞窟入口（ワープ） |
| 入場位置 | プレイヤー開始位置（System の startPosition） |

**配置イメージ（概念図）**
```
 上部：家・木（村の景観、通行不可で奥行きを出す）
 中央：道(road) でNPCと宝箱をつなぐ
 右端：洞窟入口(cave_entrance) → map_cave へワープ
 下部：開始地点
```

### map_cave — 小さな洞窟

| 項目 | 内容 |
|---|---|
| 役割 | 戦闘エリア。通常敵 → ボスへ一本道 |
| 広さの目安 | 15 × 12 マス程度 |
| 置くタイル | `cave_floor`(洞窟床) / `wall`(壁) / `rock`(岩) / `water`(水・少量) |
| 置くイベント | 通常敵シンボル / ボスシンボル |
| 入場位置 | 洞窟入口（村から transfer された着地点） |

**配置イメージ（概念図）**
```
 入口(下) → 一本道(cave_floor) → 通常敵シンボル → 奥 → ボスシンボル(最奥)
 壁(wall)・岩(rock) で道を絞り、迷わせない（3〜5分前提の一本道）
```

> マップは **2 枚を超えない**。村の戻り道・分岐路は作らない。

---

## 3. プレイ導線（途切れず一周）

| # | プレイヤー操作 | 起きること | 関与イベント |
|---|---|---|---|
| 1 | タイトルで New Game | ジョブ選択画面へ | （タイトル画面） |
| 1.5 | ジョブを選ぶ | ドット剣士 / 光術士 から1つ → `actor_hero.jobId` 確定 → map_town へ | ジョブ選択（→ `23-job-skill-spec.md`） |
| 2 | 村に入場 | 主人公を操作開始 | startPosition |
| 3 | 村人に話す | 村の状況を聞く | `ev_npc_villager` |
| 4 | 老人に話す | 洞窟と主の存在を聞く（クエスト文） | `ev_npc_oldman` |
| 5 | 宝箱を調べる | ポーション入手 + 開封フラグ | `ev_chest_potion` |
| 6 | 洞窟入口へ移動 | 入口に接触 | `ev_warp_cave` |
| 7 | 洞窟へワープ | map_cave へ遷移 | `ev_warp_cave` |
| 8 | 通常敵に接触 | 戦闘（逃走可）。勝利でシンボル消滅 | `ev_enemy_slime_01` |
| 9 | ボスに接触 | ボス戦（逃走不可） | `ev_boss` |
| 10 | ボス撃破 | クリア画面へ | `ev_boss` → `clearGame` |

> 老人の会話（#4）と宝箱（#5）は **順不同でも成立** するよう、相互に依存させない。
> ボス撃破だけがクリアのトリガー。
> ジョブ選択（#1.5）は導線を 1 ステップ増やすが、**スコープ拡大ではなくジョブ機能を見せる最小 UI**
> （ジョブチェンジは作らない / `23-job-skill-spec.md`）。3〜5 分の範囲は維持。

---

## 4. イベント一覧

> すべて `21-event-system-spec.md` の 6 コマンドのみで表現。
> 条件分岐コマンド・変数は不使用。flag は 3 個（**宝箱の開封** / **通常敵の撃破** / **ボス撃破**）。

---

### ev_npc_villager — 村人

| 項目 | 値 |
|---|---|
| イベントID | `ev_npc_villager` |
| マップID | `map_town` |
| 位置の目安 | 村の中央付近 (x:7, y:6) |
| trigger | `action` |
| appearance | `npc_villager` |
| 使う flag | なし |

```jsonc
"commands": [
  { "type": "message", "text": "最近、東の洞窟から魔物が出るんだ…" },
  { "type": "message", "text": "村長のおじいさんに話を聞いてみて。" }
]
```

---

### ev_npc_oldman — 老人（クエスト提示）

| 項目 | 値 |
|---|---|
| イベントID | `ev_npc_oldman` |
| マップID | `map_town` |
| 位置の目安 | 家の前 (x:11, y:4) |
| trigger | `action` |
| appearance | `npc_oldman` |
| 使う flag | なし |

```jsonc
"commands": [
  { "type": "message", "text": "洞窟の奥に『洞窟の主』が棲みついておる。" },
  { "type": "message", "text": "あれを倒さねば、村に平穏は戻らん。" },
  { "type": "message", "text": "東の入口から洞窟へ行けるぞ。気をつけてな。" }
]
```

> 🟢 **AI サポート対象**（後述 §6）。このセリフ／クエスト文は AI 提案候補。

---

### ev_chest_potion — 宝箱（開封済み管理つき）

| 項目 | 値 |
|---|---|
| イベントID | `ev_chest_potion` |
| マップID | `map_town` |
| 位置の目安 | 道の脇 (x:9, y:8) |
| trigger | `action` |
| appearance | デフォルト `chest_closed` / 開封後ページで `chest_opened` |
| 使う flag | `chest_potion_opened` |

```jsonc
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
    "commands": [
      { "type": "message", "text": "宝箱は空っぽだ。" }
    ]
  }
]
```

---

### ev_warp_cave — 洞窟入口（村 → 洞窟）

| 項目 | 値 |
|---|---|
| イベントID | `ev_warp_cave` |
| マップID | `map_town` |
| 位置の目安 | 村の東端 (x:18, y:7) |
| trigger | `touch` |
| appearance | `cave_entrance` |
| 使う flag | なし |

```jsonc
"commands": [
  { "type": "message", "text": "洞窟に入った。" },
  { "type": "transfer", "mapId": "map_cave", "x": 7, "y": 11 }
]
```

---

### ev_enemy_slime_01 — 通常敵シンボル（勝利で消滅）

| 項目 | 値 |
|---|---|
| イベントID | `ev_enemy_slime_01` |
| マップID | `map_cave` |
| 位置の目安 | 一本道の中ほど (x:7, y:6) |
| trigger | `touch` |
| appearance | デフォルト `symbol_slime` / 撃破後ページで `visible:false` |
| 使う flag | `enemy_slime_01_defeated` |

```jsonc
"appearance": { "tile": "symbol_slime", "visible": true },
"pages": [
  {
    "conditions": [{ "flag": "enemy_slime_01_defeated", "value": false }],
    "appearance": { "tile": "symbol_slime", "visible": true },
    "commands": [
      { "type": "startBattle", "troopId": "troop_slime", "canEscape": true },
      { "type": "setFlag", "flag": "enemy_slime_01_defeated", "value": true }
    ]
  },
  {
    "conditions": [{ "flag": "enemy_slime_01_defeated", "value": true }],
    "appearance": { "visible": false },
    "commands": []
  }
]
```

> **消滅はデータ駆動**: 勝利（victory）時のみ後続 `setFlag` が走り、2 ページ目が採用されて `visible:false`＝消滅。
> 逃走（escape）時は後続が実行されずシンボルが残る（再接触で再戦可能）。エンジンの暗黙処理にはしない。

---

### ev_boss — ボスシンボル（撃破でクリア）

| 項目 | 値 |
|---|---|
| イベントID | `ev_boss` |
| マップID | `map_cave` |
| 位置の目安 | 最奥 (x:7, y:2) |
| trigger | `touch` |
| appearance | `symbol_boss` |
| 使う flag | `boss_defeated` |

```jsonc
"appearance": { "tile": "symbol_boss", "visible": true },
"pages": [{
  "conditions": [{ "flag": "boss_defeated", "value": false }],
  "commands": [
    { "type": "message", "text": "洞窟の主が立ちはだかった！" },
    { "type": "startBattle", "troopId": "troop_boss", "canEscape": false },
    { "type": "setFlag", "flag": "boss_defeated", "value": true },
    { "type": "message", "text": "洞窟の主を倒した…！ 村に平和が戻った。" },
    { "type": "clearGame" }
  ]
}]
```

> `startBattle` の **後ろ** のコマンドは **victory（勝利）時のみ実行**（→ `21-event-system-spec.md` 結果契約）。
> `canEscape:false` なので escape は発生しない。defeat（敗北）＝ゲームオーバーへ遷移し後続は実行しない。
> よって敗北時に `boss_defeated` や `clearGame` が誤って走ることはない。

---

### イベント × flag まとめ

| イベント | 使う flag | 用途 |
|---|---|---|
| ev_npc_villager | — | — |
| ev_npc_oldman | — | — |
| ev_chest_potion | `chest_potion_opened` | 宝箱の二重取得防止 + 見た目切り替え |
| ev_warp_cave | — | — |
| ev_enemy_slime_01 | `enemy_slime_01_defeated` | 通常敵シンボルの消滅（勝利後） |
| ev_boss | `boss_defeated` | クリア記録（実質的なゴール印） |

> Demo 01 で使う flag は **3 個**（`chest_potion_opened` / `enemy_slime_01_defeated` / `boss_defeated`）。
> 変数・数値カウンタは使わない。flag を 2→3 にしたのは、敵シンボル消滅をデータ駆動で表すための最小修正
> （エンジンの暗黙処理を避け、Event.commands 統一を守るため）。初期値は未定義=false（→ `11-data-model.md` GameState）。

---

## 5. 戦闘内容

### 編成

| 区分 | 内容 |
|---|---|
| 味方 | 主人公 1 人（仲間なし） |
| ジョブ | ドット剣士 / 光術士 の 2 候補（開始時固定 or 選択） |
| 通常敵 | スライム（`enemy_slime`）1 種 |
| ボス | 洞窟の主（`enemy_boss`）1 種 |
| トループ | `troop_slime`（スライム ×2）/ `troop_boss`（洞窟の主 ×1） |

### ジョブ別スキル（各 2 個）

| ジョブ | 特徴 | スキル |
|---|---|---|
| ドット剣士 | 通常攻撃が強い | パワーストライク / ガードブレイク |
| 光術士 | MP スキルが得意 | ライトボルト / ヒール |

### 仮バランス（3〜5 分でクリア前提）

> ダメージ式は System 固定 `atk * 2 - def`。数値は仮。

| 戦闘 | 想定ターン数 | 狙い |
|---|---|---|
| スライム ×2 | 2〜3 ターン | 操作・コマンドに慣れる肩慣らし |
| 洞窟の主 | 4〜6 ターン | 光術士はヒールでしのぐ緊張感 |

**バランス指針**
- 通常戦は **ノーダメージ気味でも勝てる** 軽さ
- ボスは **ドット剣士は安定 / 光術士はライトボルト連打＋ヒールが安全網** の緊張感ある削り合い
- ドット剣士＝通常攻撃で押す / 光術士＝ライトボルト＋ヒールで戦う、と役割が体感できる差をつける
- **`victory`（勝利）後に HP/MP 全回復**（Demo 01 簡略ルール。escape/defeat では回復しない）。ポーションは戦闘中に使わず、所持品デモの位置づけのまま
- **確定した数値とターン検証は `23-job-skill-spec.md` §6** にある（通常 2T / ボス 4〜5T、両ジョブクリア可）

### 戦闘コマンドとポーションの扱い（Codex I4 反映）

> **Demo 01 ではアイテムを戦闘中に使用しない。**
> 戦闘コマンドは `attack` / `skill` / `escape` の 3 種に固定（「どうぐ」は追加しない）。
> `item_potion` は **宝箱イベントと所持品（inventory）更新の動作確認用** アイテムであり、
> 回復が必要な場面は光術士の `skill_heal`、またはフィールド（戦闘外）での使用で賄う想定。
> 戦闘中の「どうぐ」コマンドは後続デモで扱う。

---

## 6. AI サポートの使用場面

Demo 01 の AI サポートは **1 機能のみ**: **NPC セリフ・クエスト文の提案**。

| ルール | 内容 |
|---|---|
| 提示数 | 3 案 |
| 反映 | 採用ボタンを押した案 **のみ** イベントへ反映 |
| 自動反映 | しない（必ず人間が承認） |
| 実装 | 擬似 AI・テンプレート生成でもよい（実 API は後回し可） |

### この台本での AI 使用想定箇所

| 対象 | 用途タグ | AI に出させる内容 |
|---|---|---|
| `ev_npc_oldman` | 「洞窟前の老人 / クエスト提示」 | 洞窟の主を倒してほしいと依頼するセリフ 3 案 |
| `ev_npc_villager` | 「村人 / 世間話」 | 魔物が出て困っている雰囲気のセリフ 3 案 |
| `ev_boss`（戦闘前メッセージ） | 「ボス前の警告」 | 主人公を威圧する登場セリフ 3 案 |

**フロー（例: 老人のクエスト文）**
1. ユーザーが用途「洞窟前の老人 / クエスト提示」を選ぶ
2. ADRS がセリフ案を 3 つ提示
3. ユーザーが気に入った 1 案を「採用」
4. その文面が `ev_npc_oldman` の `message` コマンドに入る

> AI はあくまで **下書き支援**。ゲーム進行ロジック（flag / 戦闘 / 遷移）には関与しない。

---

## Codex にレビューさせるべき観点（7 項目）

このシナリオ台本＋既存 docs（`01` / `11` / `21`）を渡し、以下を重点的にレビューさせる。

1. **一周成立性** — タイトル→村→会話→宝箱→洞窟→通常戦→ボス→クリアが、途中で詰まらず通るか。デッドロック（進めなくなる状態）が無いか。
2. **6 コマンドで十分か** — message / addItem / setFlag / transfer / startBattle / clearGame **だけ** でこの台本が本当に成立するか。隠れて必要なコマンド（戦闘勝敗後の分岐、シンボル消滅、ゲームオーバー遷移など）が無いか。
3. **データモデルの過不足** — `11-data-model.md` の Project/Map/Event/Actor/Job/Skill/Enemy/Troop/Battle/Item で、この台本を表現するのに足りないフィールドが無いか（例: 開始ジョブ選択、シンボル消滅状態、所持品）。
4. **flag 設計の妥当性** — `chest_potion_opened` / `boss_defeated` の 2 flag で管理が破綻しないか。変数なしで本当に足りるか。
5. **戦闘・クリア導線の破綻** — `startBattle` の後続コマンド実行（勝利後に戻る／敗北時の扱い）が仕様として曖昧でないか。ボス撃破＝クリアの単一トリガーで問題ないか。
6. **戦闘バランスの現実性** — ジョブ2種×スキル各2、敵2種、固定ダメージ式で「3〜5 分・ボスは緊張感あり」が成立するか。明らかな詰み／作業化が無いか。
7. **スコープ逸脱の検出** — 台本がこっそり Demo 01 の WONT（条件分岐・変数・複数マップ・仲間・装備・AI多機能）に踏み込んでいないか。

> （任意の 8 項目目）**実装リスクの優先度付け** — 上記の中で「フェーズ2のイベントエンジン着手前に必ず潰すべき仕様欠落」はどれか、を Codex に序列化させると次の修正が楽になる。
