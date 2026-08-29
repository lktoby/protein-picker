# 実装メモ — プロテイン比較・購入アプリ

- 作成日: 2026-08-28
- 入力: `docs/01-requirements/`（承認済み・再承認 2026-08-27）、`docs/03-design/`、`docs/02-prototype/ui-spec.md`（確定版・§11 改訂含む）
- 進め方: **テスト駆動開発（TDD）**。テストケースを洗い出し → テストコード（Red）→ 実装（Green）→ リファクタ

## 1. テスト結果のサマリ

```
$ npx vitest run
 Test Files  9 passed (9)
      Tests  138 passed (138)

$ npx tsc --noEmit     → エラーなし
$ npx eslint src       → エラー・警告なし
```

**洗い出したテストケースは全件テストコード化され、全件パスしている。**

| テストファイル | 対象 | 件数 |
|--------------|------|------|
| `src/server/domain/pricing.test.ts` | F-04, F-05, F-06 の価格計算 | 24 |
| `src/server/domain/recommendation.test.ts` | F-01, F-02 のおすすめ採点 | 26 |
| `src/server/domain/order-rules.test.ts` | F-06, F-10 の入力検証・状態遷移 | 21 |
| `src/lib/criteria.test.ts` | RV-02・RV-15 の条件復元／RV-12 の遷移元検証 | 16 |
| `src/server/services/order-service.test.ts` | F-06, F-10（RV-07 のガード含む） | 15 |
| `src/app/recommend/_components/recommend-view.test.tsx` | 診断画面の操作仕様 | 14 |
| `src/server/domain/search.test.ts` | F-03 商品検索 | 11 |
| `src/components/price-with-shipping.test.tsx` | §6 価格・送料の表示 | 6 |
| `src/components/delivery-status-badge.test.tsx` | F-10 お届け状況バッジ | 5 |
| **合計** | | **138** |

> カバレッジ計測ツールは未導入のため数値なし。代わりに「洗い出したテストケース（TC-xx）が全件テストコードに存在するか」を §3 の対応表で担保している。

## 2. テストケース一覧（洗い出し結果）

分類は 正常系／異常系／境界値。TC-ID はテスト名の先頭に埋め込んであるので `grep TC-P01 -r src` で対応するテストコードに辿れる。

### F-04 / F-05 / F-06 価格計算（`pricing.test.ts`・24 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-P01 | 正常系 | 商品代金 3,480円・送料 500円 | 総額 3,980円 |
| TC-P02 | 境界値 | 送料 0円 | 総額 = 商品代金 |
| TC-P03 | 正常系 | 通販 2 件（総額 3,980 / 4,180） | 最安値 3,980円 |
| TC-P04 | 境界値 | 実店舗 3,500円 が通販より安い | 最安値 3,500円（全チャネルで比較） |
| TC-P05 | 境界値 | 実店舗 0 件 | 通販のみで最安値を算出 |
| TC-P16 | 異常系 | 販売チャネル 0 件 | エラー |
| TC-P06 | 正常系 | 最安値 3,980円・1,000g | 1gあたり 3.98円 |
| TC-P14 | 異常系 | 内容量 0g | エラー（0 除算を防ぐ） |
| TC-P07 | 正常系 | 送料ありの通販が最安 | `内 送料 500円` |
| TC-P08 | 正常系 | 送料無料の通販が最安 | `送料無料` |
| TC-P09 | 正常系 | 実店舗が最安 | `店頭価格・送料なし` |
| TC-P10 | 正常系 | 商品 3,480円・送料 500円 | `商品 3,480円 + 送料 500円`（記号は半角） |
| TC-P11 | 正常系 | 送料 0円 | `送料無料` |
| TC-P12 | 正常系 | 単価 3,480円・数量 2・送料 500円 | 合計 7,460円（**送料は 1 回**） |
| TC-P13 / 13b / 13c | 境界値 | 数量 1 / 5 / 送料 0円 | いずれも送料は 1 回だけ加算 |
| TC-P15 / 15b | 正常系・境界値 | 3480 / 0 | `3,480円` / `0円` |
| TC-P17 | 正常系 | 高安 2 ショップ | 最安のショップ名を返す |
| TC-P18 | 境界値 | 通販と実店舗が同額 | 通販を優先（アプリ内で買える方を案内） |
| TC-P19 | 正常系 | 送料込みで逆転する 2 件 | 総額の昇順に並ぶ |
| TC-P20 | 境界値 | 総額が同じ 2 件 | ショップ名の昇順で安定 |
| TC-P21 | 異常系 | 並べ替え実行 | 元の配列を書き換えない |

### F-01 / F-02 おすすめ採点（`recommendation.test.ts`・26 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-R01 | 正常系 | 目的+タイミング一致／片方のみ | 両方一致が最上位 |
| TC-R02 | 正常系 | 目的のみ vs タイミングのみ | 目的一致（+30）が上 |
| TC-R17 | 異常系 | 条件に何も一致しない | 結果に含めない |
| TC-R18 | 異常系 | 商品 0 件 | 空配列（エラーにしない） |
| TC-R22 | 正常系 | 任意の結果 | スコアを返さない |
| TC-R07 / 07b | 正常系 | 乳糖不耐症対応を選択 | 非対応商品を**除外**（減点ではない） |
| TC-R09 | 正常系 | 総額同じ・1gあたり違い | 1gあたりが安い方が上 |
| TC-R10 | 正常系 | 1gあたり同じ・総額違い | 総額が高い方が下がる |
| TC-R09b | 正常系 | タグ有り高額 vs タグ無し安価 | 安価な方が上（**タグでは加点しない**） |
| TC-R11 | 正常系 | 価格重視を選択 | 理由文に 1gあたりと**総額**を明記 |
| TC-R13 | 境界値 | 含有率 85% | 加点対象 |
| TC-R14 | 境界値 | 含有率 84% | 加点されない |
| TC-R12 | 正常系 | 含有率 90% | 理由文に `タンパク質含有率90%` |
| TC-R03 / 03b | 正常系 | 一致条件あり／一部のみ | チップは目的→タイミング→こだわりの順、不一致は入らない |
| TC-R04 | 正常系 | 一致要素が多い商品 | 「。」終わり・断片は最大 3 つ |
| TC-R05 / 05b | 正常系 | ホエイ×運動後 / カゼイン×就寝前 | 種類別の補足文を使う |
| TC-R06 | 正常系 | ミックス×就寝前（補足なし） | `就寝前の一杯に合う` |
| TC-R08 / R21 | 正常系 | 各こだわり一致 | 対応する理由文が入る |
| TC-R15 | 正常系 | 一致 8 件 | 5 件だけ返す |
| TC-R16 | 正常系 | 一致 3 件 | rank が 1,2,3 |
| TC-R19 | 境界値 | 同点・価格違い | 1gあたりが安い方が上 |
| TC-R20 | 境界値 | 同点・同価格 | 商品名→フレーバーの昇順で安定 |

### F-06 / F-10 入力検証・状態遷移（`order-rules.test.ts`・21 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-O01 | 正常系 | 妥当な入力 | 受理 |
| TC-O03 / O04 | 境界値 | 数量 1 / 5 | 受理（`ui-spec.md` §4 の 1〜5） |
| TC-O02 / O05 | 異常系 | 数量 0 / 6 | 不正 |
| TC-O06 / 06b | 異常系 | 数量 1.5 / 文字列 | 不正 |
| TC-O07 | 異常系 | 未知の支払い方法 | 不正 |
| TC-O08 / 08b | 異常系 | productId / shopId が UUID でない | 不正 |
| TC-O09 / 09b | 異常系 | 冪等キーが不正 / 欠落 | 不正 |
| TC-O10 | 異常系 | 全項目が不正 | 5 件以上のエラーをまとめて返す |
| TC-O10b | 異常系 | カード番号を混ぜる | 受理するが**検証済みの値に含めない** |
| TC-O11 / O12 | 正常系 | 注文済み→お届け中 / お届け中→お届け済み | 許可 |
| TC-O13 | 異常系 | 注文済み→お届け済み（飛び越し） | 拒否 |
| TC-O14 / O15 | 異常系 | 逆行 | 拒否 |
| TC-O16 | 異常系 | 同じ状態へ | 拒否（誤操作の検知） |
| TC-O17 | 異常系 | お届け済みから遷移 | 拒否（終端状態） |

### F-06 / F-10 サービス層（`order-service.test.ts`・15 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-O18 | 正常系 | 妥当な入力 | 注文を作成 |
| TC-O19 | 正常系 | 単価 3,480・数量 2・送料 500 | サーバー側で合計 7,460円 を算出 |
| TC-O20 | 正常系 | 注文作成 | 商品名・ショップ名をスナップショット |
| TC-O21 | 異常系 | 数量 99 | 作成せずエラー |
| TC-O22 | 異常系 | 商品が存在しない | `not_found`・作成しない |
| **TC-O23** | 異常系 | ショップがその商品を扱っていない | **`unprocessable`・フォールバックせず作成しない**（RV-07） |
| **TC-O24** | 正常系 | 同じ冪等キーで再送 | **既存注文を返す・新規作成しない**（RV-07） |
| TC-O25 | 正常系 | 注文作成 | 状態は必ず `ordered`（F-10） |
| TC-O26 | 異常系 | カード情報を混ぜる | 保存対象に含めない |
| TC-O27 | 正常系 | 注文済み→お届け中 | 更新する |
| TC-O28 | 異常系 | 注文が無い | `not_found` |
| TC-O29 / O30 | 異常系 | 飛び越し / 逆行 | `conflict`・更新しない |
| TC-O31 / O32 | 異常系 | 注文 ID が不正 / 未知の状態 | `invalid` |

### RV-02 / RV-12 / RV-15 URL 条件と遷移元（`criteria.test.ts`・16 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-C01 / C02 / C03 | 正常系 | 妥当なクエリ / prefs 無し / カンマ区切り | 条件を復元 |
| TC-C06 | 正常系 | パラメータ無し | `empty`（初期表示。エラーではない） |
| TC-C04 / C05 / C05b | 異常系 | 不正な目的 / タイミング / 欠落 | `invalid`（**黙って無視しない**） |
| TC-C07 | 異常系 | prefs に未知の値 | `invalid` |
| TC-C08 | 正常系 | 条件→クエリ→条件 | 往復できる |
| TC-C09 | 境界値 | prefs 空 | `prefs` パラメータを付けない |
| TC-C10 | 正常系 | `/recommend?...` | 許可 |
| TC-C11 / C12 | 異常系 | 外部 URL / `//evil...` | 拒否（オープンリダイレクト対策） |
| TC-C13 / C15 | 異常系 | `/orders` / `/evil/recommend` | 拒否（前方一致で判定） |
| TC-C14 | 境界値 | null / 空文字 | 拒否 |

### F-03 商品検索（`search.test.ts`・11 件）

| TC-ID | 分類 | 入力 | 期待結果 |
|-------|------|------|---------|
| TC-S01〜S04 | 正常系 | 商品名 / ブランド / フレーバー / 種類ラベル | いずれも部分一致で引ける |
| TC-S05 | 正常系 | `wpi` / `WPI` | 大文字小文字を区別しない |
| TC-S06 / S07 / S09 | 境界値 | 空文字 / 空白のみ / 前後に空白 | 全件 / 全件 / トリムして一致 |
| TC-S08 | 異常系 | 一致なし | 空配列 |
| TC-S10 | 正常系 | 未ソートの配列 | 商品名→フレーバーの昇順 |
| TC-S11 | 異常系 | 検索実行 | 元の配列を書き換えない |

### UI（`price-with-shipping.test.tsx` 6 件・`delivery-status-badge.test.tsx` 5 件・`recommend-view.test.tsx` 14 件）

| TC-ID | 分類 | 期待結果 |
|-------|------|---------|
| TC-U01〜U03 | 正常系 | 3 形式の送料注記（`内 送料 N円` / `送料無料` / `店頭価格・送料なし`）を表示 |
| TC-U04 | 正常系 | 「送料込み」だけの表記を使わない（RV-18①） |
| TC-U05 / U06 | 正常系 | `〜` 接尾辞 / `最安値: ショップ名` を出せる |
| TC-U07〜U09 | 正常系 | お届け状況 3 状態のラベル |
| TC-U10 | 正常系 | 3 状態すべてにアイコンを併記（色だけに依存しない） |
| TC-U11 | 正常系 | 3 状態の見た目（塗りの強さ）が互いに異なる |
| TC-U12 / U13 | 正常系 | 必須未選択なら非活性 → 選択で活性 |
| TC-U14 | 正常系 | 実行で条件を URL に反映（RV-02） |
| TC-U15 | 正常系 | URL の条件が選択状態に復元される（RV-02） |
| TC-U16 | 正常系 | こだわりの下に用語説明ヒントリンク（RV-15） |
| TC-U17 / U18 | 異常系・正常系 | 不正リンクは通知／正常時は出さない（RV-15） |
| TC-U19 / U20 | 正常系 | 順位の根拠の説明文・件数を表示（RV-09） |
| TC-U21 | 正常系 | 結果の下に用語説明リンク（RV-04） |
| TC-U22 | 境界値 | 0 件で回復策メッセージ |
| TC-U23 | 正常系 | 条件変更で警告＋再実行ボタン（RV-05） |
| TC-U24 | 正常系 | 古い結果が `inert`（操作不可）になる（RV-13） |
| TC-U25 | 正常系 | 再実行ボタンで新条件を URL に反映 |

## 3. テストケースとテストコードの対応

TC-ID はテスト名の先頭に埋め込んである。対応表は「TC-ID の接頭辞 → ファイル」で辿れる。

| TC 接頭辞 | テストファイル | 対象機能 |
|----------|--------------|---------|
| TC-P | `src/server/domain/pricing.test.ts` | F-04, F-05, F-06 |
| TC-R | `src/server/domain/recommendation.test.ts` | F-01, F-02 |
| TC-O01〜O17 | `src/server/domain/order-rules.test.ts` | F-06, F-10 |
| TC-O18〜O32 | `src/server/services/order-service.test.ts` | F-06, F-10 |
| TC-C | `src/lib/criteria.test.ts` | RV-02, RV-12, RV-15 |
| TC-S | `src/server/domain/search.test.ts` | F-03 |
| TC-U01〜U06 | `src/components/price-with-shipping.test.tsx` | §6（RV-16, RV-18①） |
| TC-U07〜U11 | `src/components/delivery-status-badge.test.tsx` | F-10（RV-17） |
| TC-U12〜U25 | `src/app/recommend/_components/recommend-view.test.tsx` | F-01, F-02（RV-02/04/05/09/13/15） |

確認コマンド: `grep -rn "TC-O23" src` → RV-07 のガードのテストに辿れる。

## 4. 機能と実装の対応（トレーサビリティ）

| 機能ID | 実装の中心 |
|--------|-----------|
| F-01 おすすめ条件の選択 | `src/app/recommend/_components/recommend-view.tsx`（ToggleGroup 3 問） |
| F-02 おすすめ商品の提示 | `src/server/domain/recommendation.ts`（採点）＋ `recommendation-carousel.tsx`（表示） |
| F-03 商品検索 | `src/server/domain/search.ts`＋`src/app/products/page.tsx` |
| F-04 商品情報の一気見 | `src/server/services/product-service.ts`＋`src/app/products/[id]/page.tsx` |
| F-05 実店舗情報の表示 | 同上（商品詳細の実店舗セクション） |
| F-06 購入手続き | `src/server/services/order-service.ts`＋`src/app/purchase/[productId]/`＋`/api/orders` |
| F-07 注文履歴の表示 | `src/app/orders/page.tsx`＋`src/server/services/order-view.ts` |
| F-08 お問い合わせ先の表示 | `src/app/orders/_components/order-card.tsx`（Accordion） |
| F-09 サンプル商品データ | `src/server/db/seed-data.ts`＋`scripts/db-seed.ts`（商品 12・ショップ 9・実店舗 6） |
| F-10 お届け状況の表示 | `src/components/delivery-status-badge.tsx`＋`/api/admin/orders/[id]/delivery-status` |

## 5. UI/UX 仕様（ui-spec.md）の反映状況

`ui-spec.md` の全項目を節ごとに記載する。**未実装は 0 件。**

### §1 全体・共通

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| — | 7 画面構成（＋購入完了の独立 URL） | `src/app/{page,recommend,products,products/[id],purchase/[productId],orders,orders/[orderId]/complete,glossary}` | 実装済み |
| RV-14 | 共通ヘッダー 4 ナビ・sticky・現在地のアクティブ表示 | `src/components/site-header.tsx` | 実装済み |
| — | モック・個人情報を入力させない旨のバナーを常時表示 | `src/app/layout.tsx`（`Alert variant="inverted"`） | 実装済み |
| RV-08① / RV-14 | `<html lang="ja">`／metadata をひな形のままにしない | `src/app/layout.tsx` | 実装済み |
| — | トーン（モノクロ基調・余白の広いカード型） | `src/app/globals.css`＋`src/components/ui/card.tsx` | 実装済み |
| RV-14 / RV-15 | タップ領域 44px 目安 | `src/components/ui/button.tsx`（`HIT_AREA_44`）、`site-header.tsx`（`py-2`） | 実装済み |

### §2 おすすめ診断

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| — | 3 問（目的・タイミングは必須単一／こだわりは任意複数）・ピル型 | `recommend-view.tsx`（`ToggleGroup` single/multiple） | 実装済み |
| — | 必須未選択の間は「おすすめを見る」を非活性 | 同上（`disabled={!purpose \|\| !timing}`）・TC-U12 | 実装済み |
| RV-06 | カルーセルで 1 件ずつ・矢印／ドット／スワイプの 3 手段 | `recommendation-carousel.tsx`＋`ui/carousel.tsx`（embla のドラッグ） | 実装済み |
| RV-06 / RV-14 | ドットのタップ領域 44px | `recommendation-carousel.tsx`（`p-4` で確保） | 実装済み |
| RV-09 / RV-18① | カード構成 8 要素の順序 | `recommendation-carousel.tsx` の `RecommendationCard` | 実装済み |
| RV-18① | 価格注記は送料額を明記＋「最安値: ショップ名」 | `src/components/price-with-shipping.tsx`・TC-U01〜U06 | 実装済み |
| RV-09 | 順位付けの根拠の説明文 | `recommend-view.tsx`・TC-U19 | 実装済み |
| RV-04 | 結果の下に「用語説明はこちら」リンク | `recommend-view.tsx`・TC-U21 | 実装済み |
| — | 最大 5 件・順位つき／0 件時の回復策 | `recommendation.ts`（TC-R15）・`recommend-view.tsx`（TC-U22） | 実装済み |
| RV-02 | 条件を URL クエリに保持し復元 | `src/lib/criteria.ts`＋`recommend/page.tsx`・TC-C01〜C09, TC-U14/U15 | 実装済み |
| RV-05 | 実行後に結果セクションへ自動スクロール | `recommend-view.tsx`（`scrollIntoView`） | 実装済み |
| RV-05 / RV-13 / RV-15 | 条件変更で古い結果をグレーアウト＋**操作不可**＋バナーに再実行ボタン | `recommend-view.tsx`（`inert` + `pointer-events-none`）・TC-U23〜U25 | 実装済み |
| RV-15 | カルーセルの左右矢印キー操作＋フォーカスリング | `ui/carousel.tsx`（`onKeyDown` + `tabIndex`） | 実装済み |
| RV-15 | 不正な条件付きリンクの通知 | `criteria.ts`（`invalid`）＋`recommend-view.tsx`・TC-C04〜C07, TC-U17 | 実装済み |
| RV-15 | こだわりの下に用語説明ヒントリンク | `recommend-view.tsx`・TC-U16 | 実装済み |
| RV-09 | 価格重視は実価格で総合評価・理由文に総額 | `recommendation.ts`・TC-R09/R09b/R10/R11 | 実装済み |
| — | 乳糖不耐症のハードフィルタ | `recommendation.ts`・TC-R07/R07b | 実装済み |
| — | 採点方式は `/design` で決定 → ローカルのルールベース | `recommendation.ts`（純関数・外部 API 不使用） | 実装済み |

### §3 商品検索・商品詳細

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| — | 部分一致検索・0 件時は検索語を引用 | `search.ts`＋`products/page.tsx`・TC-S01〜S11 | 実装済み |
| — | 一覧カードの項目 | `src/components/product-card.tsx` | 実装済み |
| — | 詳細の構成（サマリー＋スペック 4 点→通販→実店舗、0 件表示） | `products/[id]/page.tsx` | 実装済み |
| RV-11 | 通販は価格の安い順＋最安に「最安」バッジ | `product-service.ts`（`isCheapest`）＋`products/[id]/page.tsx`・TC-P19/P20 | 実装済み |
| RV-02 | 戻り導線を遷移元で切り替える | `products/[id]/page.tsx`＋`isSafeRecommendPath`・TC-C10〜C15 | 実装済み |

### §4 購入手続き

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| — | 構成（警告→注文内容→支払い→確定→完了）・数量 1〜5 | `purchase-form.tsx`＋`orders/[orderId]/complete/page.tsx` | 実装済み |
| RV-08③ | カード欄は readOnly（実在情報を入力できない） | `purchase-form.tsx`（`readOnly`）＋API がカード情報を受け取らない・TC-O10b/O26 | 実装済み |
| RV-08③ | 「ダミー値をランダム生成」ボタン | `purchase-form.tsx`（`randomDummyCard`） | 実装済み |
| RV-12 | `from` を購入フローまで引き回し、完了画面に「診断結果に戻る」 | `purchase/[productId]/page.tsx`＋`complete/page.tsx` | 実装済み |
| RV-03 | 確認ステップは追加しない | `purchase-form.tsx`（この画面で内容確認して確定） | 実装済み（見送りを維持） |
| RV-07 | 不正パラメータの拒否・二重送信防止 | `order-service.ts`・TC-O23/O24、`purchase/page.tsx`（エラー表示）、送信中のボタン無効化 | 実装済み |

### §5 注文履歴・お問い合わせ

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| — | 注文カードの項目 | `orders/_components/order-card.tsx` | 実装済み |
| RV-17 | お届け状況 3 段階 | `delivery-status-badge.tsx`・TC-U07〜U09 | 実装済み |
| RV-17 | 商品名の上はブランドではなくお届け状況 | `order-card.tsx`（ブランドを表示しない） | 実装済み |
| RV-17 | 状態ごとにアイコン＋塗りの強さを変える | `delivery-status-badge.tsx`・TC-U10/U11 | 実装済み |
| RV-17 | 注文直後は「注文済み」・完了画面にも表示 | `order-service.ts`（TC-O25）＋`complete/page.tsx` | 実装済み |
| — | 状況の更新は管理側のみ・**利用者が進める画面は作らない** | `/api/admin/orders/[id]/delivery-status`（トークン保護）。UI は未提供 | 実装済み |
| RV-10 | 商品部分クリックで商品詳細へ（明示リンク付き） | `order-card.tsx` | 実装済み |
| — | お問い合わせは同時に 1 件のみ展開・送信しない | `order-card.tsx`（`Accordion type="single" collapsible`） | 実装済み |
| RV-15 | 空状態の第一 CTA は診断・第二 CTA は検索 | `orders/page.tsx` | 実装済み |

### §6 価格表示ルール

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| RV-01 | 表示価格は送料込みに統一・その旨を明記 | `pricing.ts`＋各画面の注記 | 実装済み |
| RV-16 / RV-18① | 送料額を必ず明記（3 形式）・適用箇所 3 つ | `price-with-shipping.tsx`（一覧・おすすめ・詳細スペック欄で共用）・TC-P07〜P09, TC-U01〜U04 | 実装済み |
| RV-16 | ショップ行の内訳 `商品 N円 + 送料 M円`（0 円は送料無料を強調） | `pricing.ts` の `breakdownLabel`＋`products/[id]/page.tsx`・TC-P10/P11 | 実装済み |
| RV-16 | 購入画面の合計は 3 行内訳 | `purchase-form.tsx` | 実装済み |
| — | 実店舗に「店頭でのお渡しのため送料はかかりません」 | `products/[id]/page.tsx` | 実装済み |
| — | 送料はショップごとの値 | `db/schema.ts`（`shops.shipping_fee`） | 実装済み |
| — | 1gあたり価格を常に併記 | `pricing.ts`＋各カード・TC-P06 | 実装済み |
| — | 最安値は全チャネルの最低価格 | `pricing.ts` の `cheapestSource`・TC-P03/P04 | 実装済み |
| RV-18② | 金額の式の記号は半角 | `pricing.ts`（`+`）、`order-card.tsx`（`×` `=`）・TC-P10 | 実装済み |

### §8 踏襲しなくてよい部分（デモの割り切り）→ 本実装での対応

| 指摘ID | 内容 | 本実装での対応 | 状態 |
|--------|------|--------------|------|
| RV-08② | 絵文字の商品画像 → 実画像に置換 | `next/image`＋`public/images/products/*.svg`。**実写は未入手のため、描かれたモノクロのプレースホルダー画像を暫定で使用**（§7 の TODO-1） | 対応（画像素材は要提供） |
| RV-08② | UI の絵文字 → 統一されたアイコンセット | `lucide-react` に全面置換（絵文字は 0 箇所） | 実装済み |
| — | メモリ保存 → データベース保存 | PostgreSQL＋Drizzle。`docker-compose.yml` に `db` サービスを追加 | 実装済み |
| — | 「デモ用: お届け状況を次に進める」は作らない | 作っていない（更新は管理用 API のみ） | 実装済み |
| — | バリデーション・エラー処理の作り込み | `api-error.ts`＋各サービスの検証・画面のエラー表示 | 実装済み |
| — | フォント選定 | `Noto Sans JP`（`layout.tsx`）。金額は `tabular-nums` | 実装済み |

### §10 用語説明ページ

| 指摘ID | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|--------|----------------|---------|------|
| RV-04 | 独立ページ | `src/app/glossary/page.tsx` | 実装済み |
| RV-04 | 導線（ナビ＋おすすめ結果下＋こだわりのヒント） | `site-header.tsx`／`recommend-view.tsx` 2 箇所 | 実装済み |
| RV-04 | 内容（種類 5 つ＋こんな人に／数値の見方／乳糖不耐症／医学的助言でない注記） | `glossary/page.tsx` | 実装済み |
| RV-04 | 末尾に診断・検索への導線 | `glossary/page.tsx` | 実装済み |

### §11 改訂（ダークモード・モノクロ配色）

| 節 | UI/UX 仕様の内容 | 実装箇所 | 状態 |
|----|----------------|---------|------|
| §11-1 | ダークモード（クラス方式・トークン・OS 設定に追従） | `globals.css`（`@custom-variant dark`＋2 セットのトークン）、`layout.tsx`（`ThemeProvider`, `suppressHydrationWarning`） | 実装済み |
| §11-1 | 切替はメニューバーのアイコン 1 つ・既定は OS 設定 | `theme-toggle.tsx`（アイコンは CSS で切替） | 実装済み |
| §11-2 | 緑ボタンのコントラスト未達 → モノクロ化で解消 | 緑は 0 箇所。主ボタンは `bg-primary`（17.93:1 / 17.18:1） | 実装済み |
| §11-3 | モノクロ配色・強調は塗りの強さ／太さで作る | `globals.css` のトークン、`badge.tsx`（outline/muted/solid） | 実装済み |
| §11-3 | 状況バッジは塗りの強さで 3 段階＋アイコン併記 | `delivery-status-badge.tsx`・TC-U10/U11 | 実装済み |
| §11-3 | 警告・エラーは反転バー＋アイコン＋太字 | `layout.tsx`／`purchase-form.tsx`／`recommend-view.tsx`（`Alert variant="inverted"`） | 実装済み |
| §11-3 | 送料無料は太字で強調（色を変えない） | `price-with-shipping.tsx` | 実装済み |
| §11-3 | 商品画像に薄い枠を敷く | `product-card.tsx`／`order-card.tsx`／`purchase-form.tsx` | 実装済み |

## 6. 動作確認（Docker で実施）

```bash
docker compose up --build      # db（healthcheck 待ち）→ web
npm run db:setup               # マイグレーション ＋ サンプルデータ投入
```

実際に確認した結果:

| 確認項目 | 結果 |
|---------|------|
| 全画面の応答 | `/` `/recommend` `/products` `/products/[id]` `/purchase/[id]` `/orders` `/glossary` すべて 200 |
| API の応答 | 一覧・詳細・おすすめ・注文履歴すべて 200 |
| **RV-15 不正条件** | `?purpose=BAD` → API は **400**、画面は通知を表示 |
| **§6 送料の明記** | 一覧で `内 送料 500円` ×10・`内 送料 600円` ×6・`内 送料 800円` ×2・`送料無料` ×6 を確認 |
| **§6 ショップ行の内訳** | `商品 3,280円 + 送料 500円`（半角 `+`）を確認 |
| **RV-11 最安バッジ** | 商品詳細に `最安` を確認 |
| **RV-09 順位の根拠** | 「順位は『選んだ条件との一致度』…」を確認。おすすめ 1〜3 位のバッジ・1gあたり価格（3.2 / 3.8 / 4.0 / 6.1 / 7.1 円）・✓チップ・ドット 5 件を確認 |
| **RV-07 不正 shop** | 画面に「指定された販売ショップではこの商品を購入できません」、API は **422**（フォールバックしない） |
| **RV-07 二重送信** | 同じ冪等キーで 2 回 POST → 1 回目 201・2 回目 200 で**同じ注文番号 ORD-0001**、注文総数は **1 件** |
| 注文の金額 | 合計 9,460円（単価×数量 + 送料 1 回）で `deliveryStatus: ordered` |

## 7. 既知の制約・TODO

| # | 内容 |
|---|------|
| TODO-1 | **商品画像が実写ではない。** `ui-spec.md` §8 は実画像への置換を求めているが、実写素材が無いため種類ごとのモノクロのプレースホルダー画像（`public/images/products/*.svg`）を暫定で置いている。**画像素材の提供が必要**（絵文字は使っていない） |
| TODO-2 | **明暗両モードでの全画面の目視確認が未実施。** `ui-spec.md` §11 は「視覚的な結果は `/implement` で実際の画面を見て確認する」と定めている。HTTP 応答とトークンの実測コントラストは確認済みだが、ブラウザでの目視は人が行う必要がある（`/acceptance-test` の確認項目にすることを推奨） |
| TODO-3 | **モノクロの警告表示が「警告と伝わるか」の確認が未実施**（`ui-spec.md` §11-3 の申し送り）。伝わりにくい場合は警告のみ 1 色を例外にする再検討が必要 |
| TODO-4 | カバレッジ計測ツール（`@vitest/coverage-v8`）は未導入。数値によるカバレッジ確認は未実施 |
| TODO-5 | お届け状況の更新は管理用 API のみ。動作確認するには `ADMIN_API_TOKEN` を `.env` に設定して `PATCH /api/admin/orders/{id}/delivery-status` を呼ぶ必要がある（未設定時は 503 で無効） |
| TODO-6 | `db` サービスのポート 5432 をホストに公開している（`npm run db:setup` を実行するため）。本番運用では公開しない |

## 8. TDD の実施状況（正直な記録）

- **ドメインロジック（F-01〜F-06, F-10 の計算・検証・状態遷移）と `criteria`・`order-service` は完全にテストファーストで実装した。** テストを書いて Red（モジュール未実装）を確認してから実装している
- **例外 1**: `pricing.ts` の `cheapestSourceName` / `sortShopOffersByTotal` は最初の実装に含めてしまい、テスト（TC-P17〜P21）を後から追加した
- **例外 2**: 画面のコンポーネント（`recommend-view.tsx` など）は実装後にテスト（TC-U12〜U25）を書いた。`price-with-shipping` と `delivery-status-badge` はテストファーストで実装している
- **テストケースを弱めたり削除したことは無い。** 1 度だけテストを修正したが、内容は「Radix の `ToggleGroup` 単一選択が `role="radio"` を付ける」というロールの取り違えの修正で、**アサーションは変更していない**（`src/app/recommend/_components/recommend-view.test.tsx` のコメントに記録）
