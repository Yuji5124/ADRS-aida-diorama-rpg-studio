# 22 - 戦闘仕様 (Battle Spec)

> ADRS Demo 01 の戦闘仕様を確定する。`startBattle` で開始されるターン制戦闘の
> **流れ・行動順・ダメージ式・MP・逃走・勝敗・イベントへの戻り契約** を明文化し、戦闘の曖昧さを潰す。
> `21-event-system-spec.md` の `startBattle` 結果契約と**矛盾させない**。

---

## 1. 戦闘の位置づけ

ADRS Demo 01 の戦闘は、**RPGツクールMV 級の複雑な戦闘再現ではない**。
**短編 RPG の縦切りを成立させるための最小ターン制バトル**である。

- 目的は「敵シンボルに触れる → 戦う → 勝つ → 先へ進む」を成立させること。
- 戦闘システムの作り込みより、**一周遊べること**を優先する（→ `01-demo01-scope.md`）。
- 戦闘は **Battle Runtime** が担当し、**Renderer / Editor UI に戦闘ロジックを持たせない**（→ `10-architecture.md`）。

---

## 2. 戦闘開始フロー

`Event.commands` の `startBattle` から Battle Runtime に遷移する。

```jsonc
{ "type": "startBattle", "troopId": "troop_slime", "canEscape": true }
```

1. **Event Runtime** が `startBattle` コマンドを実行する。
2. **Battle Runtime** が `troopId` から **Troop（敵編成）** を読み込む（`11-data-model.md`）。
3. Battle Runtime が **味方・敵の実行時状態**（HP/MP など）を生成する。
   - 味方の現在 HP/MP は GameState の party 状態に基づく（Demo 01 は主人公1人）。
   - 敵の HP/MP は Enemy 定義の `stats` から初期化する。
4. **戦闘画面へ遷移**する（`mode/scene = battle`）。
5. 戦闘終了時に **`victory` / `escape` / `defeat`** のいずれかを返し、Event Runtime に制御を返す。

> `canEscape` は逃走可否（ボス戦は `false`）。`startBattle` のパラメータは `troopId` / `canEscape` のみ（コマンドは増やさない）。

---

## 3. startBattle の結果契約

| 結果 | 意味 | Event.commands の後続処理 |
|---|---|---|
| `victory` | 敵を全滅させた | **後続 commands へ進む** |
| `escape` | 逃走に成功した | **イベントを終了**し、後続 commands は実行しない |
| `defeat` | 味方が全滅した | **ゲームオーバーへ遷移**し、後続 commands は実行しない |

この契約により:
- **通常敵シンボル** は **勝利時だけ** 後続の `setFlag enemy_slime_01_defeated = true` が実行される。
  → 勝利でシンボル消滅（ページ `visible:false`）。**逃走時は後続が走らず、敵シンボルが残る**（再接触で再戦可能）。
- **ボス** は `canEscape:false` のため escape は発生しない。勝利時のみ `setFlag boss_defeated` → `clearGame`（→ §12）。

> これは `21-event-system-spec.md` / `10-architecture.md` の結果契約と**完全一致**（再掲）。

---

## 4. 戦闘参加者

Demo 01 では以下に固定する。

| 区分 | 内容 |
|---|---|
| 味方 | **主人公 1 人**（仲間なし） |
| 敵 | Troop で定義された **1〜2 体** |
| 通常戦闘 | `troop_slime`（スライム ×2） |
| ボス戦 | `troop_boss`（洞窟の主 ×1） |

味方のジョブ候補:
- **ドット剣士**
- **光術士**

> ジョブの初期ステータス・スキル数値などの詳細は **`23-job-skill-spec.md` で扱う**。本書は戦闘の流れと式を確定する。

---

## 5. 戦闘コマンド

Demo 01 のコマンドは **`attack` / `skill` / `escape` の 3 つのみ**。

### attack（こうげき）
- **MP を消費しない**。
- 単体の敵に **通常ダメージ**（§7）。
- 対象はプレイヤーが選ぶ想定。Demo 01 は敵が 1〜2 体なので **簡易選択でよい**（敵1体なら自動選択でも可）。

### skill（スキル）
- スキルを 1 つ選ぶ。
- **MP を消費する**（`mpCost`）。
- **MP 不足なら使用できない**（選び直し。§8）。
- スキル種別は **`attack` / `heal` の 2 種類だけ**。
  - 攻撃スキル → **敵単体**にダメージ
  - 回復スキル → **自分（味方単体）を回復**
- 詳細なスキル定義（power/mpCost/対象）は **`23-job-skill-spec.md` へ接続**。

### escape（にげる）
- **`canEscape: true` の戦闘でのみ選べる**。
- Demo 01 では **逃走成功率 100%**（必ず成功）。
- `canEscape: false`（ボス戦）では **選択不可**。
  - **推奨: ボス戦ではコマンドを表示しない**（選んでも失敗、でも可）。

---

## 6. 行動順

Demo 01 では **速度順を使わない**。以下に **固定**する。

1. プレイヤーがコマンド選択
2. **味方が行動**
3. 敵が生存していれば **敵が行動**
4. **勝敗判定**
5. 次ターンへ

> `spd` ステータスは将来用に残してよいが、**Demo 01 の行動順には使わない**。
> 味方→敵の固定順。敵が複数体の場合は配列順に行動する。

---

## 7. ダメージ式

Demo 01 の **固定式**（乱数なし）。

### 通常攻撃
```text
damage = max(1, attacker.atk * 2 - target.def)
```

### 攻撃スキル
```text
damage = max(1, attacker.atk + skill.power - target.def)
```

### 回復スキル
```text
heal = skill.power
```

補足ルール:
- **乱数は入れない**（Demo 01 は決定論的）。
- **クリティカルなし / 属性相性なし / 防御コマンドなし**。
- **HP は 0 未満にならない**（0 で停止）。
- **回復で最大 HP を超えない**（max HP でクランプ）。
- **スキルの消費 MP は行動前にチェック**する（不足なら使用不可）。

> 通常攻撃は `atk*2-def`、攻撃スキルは `atk+power-def`。`System.damageFormula`（`11-data-model.md`）の `atk*2-def` は
> **通常攻撃の式**として解釈し、攻撃スキルは power を足す上式を用いる。

---

## 8. MP 処理

- スキル使用時に **`mpCost` を消費**する。
- **MP が足りないスキルは使用不可**（グレーアウト/選択不可）。
- 使用不可時は **コマンドを選び直す**（ターンは消費しない）。
- 敵も MP を持てるが、**Demo 01 では敵の MP 管理は最小**（敵はスキルを使わない＝§9）。
- （将来拡張メモ）敵がスキルを使う場合も **MP 不足なら通常攻撃にフォールバック**する設計余地を残す。

---

## 9. 敵行動

Demo 01 では **敵 AI を複雑にしない**。

- **通常敵は通常攻撃のみ**。
- **ボスも基本は通常攻撃のみ**。
- 敵スキル・行動パターンは **後続デモで拡張**。

### `Enemy.skills` の扱い（Codex 懸念の明文化）

`11-data-model.md` の Enemy は `skills` フィールドを持つ。Demo 01 では以下とする。

- **`Enemy.skills` は Demo 01 では「予約フィールド」扱い**。
- **Battle Runtime は Demo 01 では敵の通常攻撃のみを実行**する（敵の `skills` は参照しない）。
- **敵スキルの実行は後続デモで扱う**。

> これにより「敵スキルの扱い」（Codex Important I5）を確定。敵行動は `attack` 固定で実装負荷を下げる。
> 敵の対象は **味方単体（主人公）**。

---

## 10. ターゲット解釈

`Skill.target` の意味（Demo 01）。**「使用者から見た相手側/味方側」**として定義する。

| target | 意味 |
|---|---|
| `enemy_single` | **使用者から見た敵側の単体** |
| `ally_single` | **使用者から見た味方側の単体** |

- 主人公が `enemy_single` を使う → **敵単体**。
- 敵が（将来）`enemy_single` を使う → **味方単体（主人公）**。
- つまり「プレイヤー側の敵」ではなく、**「使用者から見た相手側」**で解釈する（陣営相対）。
- 回復スキル `ally_single` は Demo 01 では **使用者自身**（味方1人のため）。

---

## 11. 勝敗判定

毎ターンの行動後（手順4）に判定する。

### victory（勝利）
- Troop 内の **すべての敵 HP が 0**。
- **`victory` を返す** → Event Runtime へ戻る → **後続 commands を実行**。
- **`victory` の場合のみ、戦闘終了後に味方の HP/MP を最大値まで全回復する**（Demo 01 専用の簡略ルール）。
  - `escape` / `defeat` では回復しない。
  - 目的: `item`/どうぐ を増やさずに、通常戦で MP を使ってもボス戦に万全で入れるようにし、3〜5 分の縦切りをどちらのジョブでも安定クリアさせる。
  - 後続デモでは宿屋・アイテム・回復ポイント等に置き換え可能（→ `23-job-skill-spec.md` §7）。

### defeat（敗北）
- **味方全員の HP が 0**（Demo 01 は主人公の HP が 0）。
- **`defeat` を返す** → **ゲームオーバーへ遷移** → 後続 commands は実行しない。

### escape（逃走）
- `escape` コマンドにより逃走（`canEscape:true` 時のみ、成功率 100%）。
- **`escape` を返す** → Event Runtime へ戻るが、**そのイベントを終了扱い**にする → 後続 commands は実行しない。

> 判定優先順位: 敵全滅(victory) / 味方全滅(defeat) は行動解決後に確認。escape はコマンド選択時に即確定。

---

## 12. ボス撃破後の扱い

`ev_boss` のイベントは以下の流れになる。

```jsonc
[
  { "type": "message", "text": "洞窟の主が立ちはだかった！" },
  { "type": "startBattle", "troopId": "troop_boss", "canEscape": false },
  { "type": "setFlag", "flag": "boss_defeated", "value": true },
  { "type": "message", "text": "洞窟の主を倒した！" },
  { "type": "clearGame" }
]
```

- **勝利時だけ** `setFlag boss_defeated` と `clearGame` に進む。
- **敗北時はゲームオーバー**（後続未実行 → `boss_defeated`/`clearGame` は走らない）。
- **逃走は不可**（`canEscape:false`）。

> これにより「敗北前にクリアが走る」バグを仕様レベルで排除する。

---

## 13. 戦闘 UI の最小仕様（表示要件のみ）

> 実装コードではなく **表示要件**のみ。最終的な UI 実装は後で決める。

- 味方 **HP / MP**
- 敵の **名前**と HP の有無（数値 or バーは後で決定）
- **コマンド欄**（attack / skill / escape）
- **スキル選択**（MP 不足は選択不可表示）
- **メッセージ欄**（行動結果のテキスト）
- **勝利 / 敗北 / 逃走メッセージ**
- 演出は **最小でよい**（Demo 01）。
- 戦闘背景は **専用画面でも、ジオラマ上の簡易オーバーレイでもよい**（どちらか後で決定）。

> 最終的な戦闘 UI（レイアウト/演出/背景方式）は実装フェーズで確定する。

---

## 14. Demo 01 でやること / やらないこと

| ✅ やること | ❌ やらないこと |
|---|---|
| `attack` / `skill` / `escape` | item / どうぐ |
| HP / MP | guard / 防御 |
| 通常攻撃 | equipment / 装備 |
| 攻撃スキル | state / 状態異常 |
| 回復スキル | attribute / 属性 |
| victory / escape / defeat | speed order / 速度順 |
| canEscape | random variance / 乱数ぶれ |
| ボス撃破後の clearGame 導線 | critical / クリティカル |
| 敵は通常攻撃のみ（skills は予約） | enemy AI pattern |
| | animation editor / battle plugins |

---

## 15. `23-job-skill-spec.md` への引き継ぎ

次の `23-job-skill-spec.md` で決めるべき事項:

1. **ドット剣士 / 光術士の初期ステータス**（hp/mp/atk/def/spd）の確定値
2. **各ジョブ 2 スキルの数値**（power / mpCost / type / target）
3. **`Skill.type`（attack / heal）の詳細**と戦闘側（§5/§7）の接続
4. **`Skill.target`（enemy_single / ally_single）** と戦闘側ターゲット解釈（§10）の接続
5. **`mpCost` と `power` の最終値**（§7 の式に入れて 2〜3T / 4〜6T が成立するか検証）
6. **主人公の開始ジョブを固定にするか選択制にするか**（System.startingJob）
7. **`11-data-model.md` の Actor / Job / Skill サンプルとの整合**
8. **`40-demo01-scenario.md` の戦闘バランス**（通常 2〜3T / ボス 4〜6T、ポーション非戦闘）との整合
