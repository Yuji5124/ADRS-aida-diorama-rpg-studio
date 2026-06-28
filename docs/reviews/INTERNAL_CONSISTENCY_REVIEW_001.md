# INTERNAL_CONSISTENCY_REVIEW_001 — ADRS Demo 01 仕様 内部整合レビュー

> 実装フェーズに入る前に、フェーズ0仕様一式（README + docs 12 本 + Codex レビュー記録）の
> **ID・flag・契約・数値・用語・導線・スコープ** の食い違いを横断チェックした記録。
> 軽微な不整合はこのレビュー内で修正済み（→ §6）。

対象:
README.md / 00-overview / 01-demo01-scope / 10-architecture / 11-data-model / 21-event-system-spec /
22-battle-spec / 23-job-skill-spec / 24-diorama-rendering / 30-ai-support-spec / 40-demo01-scenario /
41-roadmap / reviews/CODEX_REVIEW_001

---

## 1. Summary

**全体整合は良好。Blocking（実装を止める矛盾）はゼロ。**

仕様一式は ID・flag・startBattle 結果契約・戦闘数値・ジョブ選択導線・AI サポートの責務分離が
おおむね一貫している。検出されたのは **早期作成ドキュメントの取り残し**（`01-demo01-scope.md` のジョブ記述、
README の docs 索引・次ステップ）と **軽微な表現ゆれ**（バランス文言）のみで、すべて本レビューで修正した。

`docs/reviews/CODEX_REVIEW_001.md` には旧 ID/旧数値（`ev_enemy_slime` / boss atk10 等）が残るが、
これは **レビュー時点の記録（過去の引用）として正しい**ため変更しない。

→ **結論: 実装フェーズ1へ進んでよい状態。**（最終確認として Codex 2 回目レビューを推奨）

---

## 2. Blocking Issues

**なし。** 一周導線（タイトル→ジョブ選択→村→会話→宝箱→ワープ→通常戦→ボス→クリア）を
途中で止める矛盾、データとイベントの致命的な食い違いは検出されなかった。

---

## 3. Important Issues（実装前に直すべき・本レビューで修正済み）

| # | 箇所 | 内容 | 対応 |
|---|---|---|---|
| I-1 | `01-demo01-scope.md` | 「開始時に固定ジョブ、またはサンプル上は固定でよい」が、後の決定（**New Game 後にジョブ選択**）と矛盾 | ✅ ジョブ選択＋ジョブチェンジなしに修正 |
| I-2 | `README.md` docs 索引 | 新規 5 仕様（10/22/23/24/30）が未掲載。「今後追加予定」が全作成済みなのに残存 | ✅ 全 docs を索引に追加、文言更新 |
| I-3 | `README.md` 次のステップ | Codex レビュー前提の古いステップ（残り仕様書 10/22/23/24/30 へ進む 等） | ✅ 現状（フェーズ0完了・最終レビューへ）に更新 |

---

## 4. Nice to Have（軽微・本レビューで修正済み / 一部許容）

| # | 箇所 | 内容 | 対応 |
|---|---|---|---|
| N-1 | `01-demo01-scope.md` | flag の言及が「宝箱の開封済み管理」のみで 3 flag 化を反映していない | ✅ 3 flag（chest/enemy/boss・未定義=false）に拡充 |
| N-2 | `40-demo01-scenario.md` §5 | ターン表「光術士はヒールでしのぐ」が検証結果（ヒールは安全網／4 ターンで勝てる）と微妙にずれ | ✅ 文言を検証結果に整合（通常 2T / ボス 4〜5T） |
| N-3 | `01-demo01-scope.md` 成功条件 1〜9 | ジョブ選択ステップは未記載（高レベルの成功条件のため） | 許容（詳細導線は `40` にあり） |
| N-4 | `40` §5 「ダメージ式は System 固定 `atk*2-def`」 | 攻撃スキルは `atk+power-def`。System 式は通常攻撃用 | 許容（`22` §7 で明確化済み） |

---

## 5. Checked Items（10 観点の結果）

| 観点 | 結果 | 備考 |
|---|---|---|
| 1. ID 整合 | ✅ 一致 | spec 群は `ev_enemy_slime_01` / `ev_chest_potion` 等で統一。旧 ID は Codex 記録内のみ（正しい） |
| 2. flag 整合 | ✅ 一致 | 3 flag（chest_potion_opened / enemy_slime_01_defeated / boss_defeated）、未定義=false、宝箱見た目・敵 visible:false・ボス clearGame の流れ一致 |
| 3. startBattle 結果契約 | ✅ 一致 | victory=後続継続 / escape=終了 / defeat=ゲームオーバー、victory のみ HP/MP 全回復 が 10/21/22/23/40 で一致 |
| 4. 戦闘仕様整合 | ✅ 一致 | コマンド attack/skill/escape、item/guard/装備/状態/属性なし、敵 skills 予約、spd 不使用、通常2〜3T・ボス4〜6T、勝利後回復 |
| 5. ジョブ・スキル数値整合 | ✅ 一致 | 剣士 hp36/mp8/atk8/def5/spd5、光術士 hp30/mp20/atk5/def3/spd6、スキル4種の mpCost/power/type/target が 11↔23 一致 |
| 6. 敵ステータス整合 | ✅ 一致 | slime hp12/atk3/def1、boss hp56/atk5/def4 が 11↔22↔23↔40 一致。boss atk10→5 調整も全 doc 反映 |
| 7. ジョブ選択導線 | ✅ 一致（I-1 修正後） | New Game→選択→jobId 反映、startingJob フォールバック、ジョブチェンジなし |
| 8. AI サポート整合 | ✅ 一致 | Editor 専用・Play 非依存、NPC セリフのみ、3 案、採用のみ message.text 反映、commands 不変、擬似 AI 可 |
| 9. ジオラマ・表示整合 | ✅ 一致 | 固定見下ろし・回転なし・1 灯・擬似影、visible:false（描画/影/当たり/trigger なし・Editor 一覧に残す）が 11/21/24/30 一致 |
| 10. スコープ外混入 | ✅ なし | DB GUI / セーブ / 装備 / ショップ / 仲間 / ジョブチェンジ / 状態異常 / 属性 / どうぐ / カメラ回転 / 複数光源 / 実 API 必須 / マップ自動生成 / プラグイン / Tauri 必須 はいずれも「やらない」側で一貫 |

---

## 6. Recommended Fixes（本レビューで実施した修正）

| ファイル | 修正 |
|---|---|
| `README.md` | docs 索引に 10/22/23/24/30/reviews を追加、「今後追加予定」削除、次のステップを現状に更新 |
| `01-demo01-scope.md` | ジョブ記述を「開始時ジョブ選択＋ジョブチェンジなし」に修正、flag を 3 個に拡充 |
| `40-demo01-scenario.md` | §5 ターン表の文言を検証結果（通常 2T / ボス 4〜5T、ヒール=安全網）に整合 |

> 大きな仕様変更は行っていない。すべて「古い記述の追従」と「表現ゆれの統一」に限定。

### 要判断事項（残課題）

**なし。** 本レビュー時点で、実装前に人間の追加判断を要する未解決の仕様分岐は検出されなかった。
（戦闘数値・勝利後回復・ジョブ選択は確定済み。今後の調整は「後続デモで可」と各 doc に明記済み。）

---

## 7. 結論

- **Blocking: 0 / Important: 3（修正済み）/ Nice to have: 4（2 修正・2 許容）**
- 仕様一式は実装に進める整合状態。
- 次アクション: **Codex 2 回目レビュー（実装可否の最終審査）** を経て、フェーズ1（マップ表示・移動・カメラ）着手。
