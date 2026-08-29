// ============================================================
// ui-spec.md §6（RV-16・RV-18①）: 価格は「送料込み」で終わらせず、送料の金額を必ず明記する
// この部品に表示ルールを閉じ込め、画面ごとの適用漏れを防ぐ（screen-flow.md §1-2）
// ============================================================
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceWithShipping } from "./price-with-shipping";

describe("PriceWithShipping — 価格と送料の注記（ui-spec.md §6）", () => {
  it("TC-U01 正常系: 送料がかかる場合は「内 送料 N円」を併記する", () => {
    render(
      <PriceWithShipping
        price={3980}
        shippingNote={{ kind: "included", fee: 500, label: "内 送料 500円" }}
      />,
    );
    expect(screen.getByText("3,980円")).toBeInTheDocument();
    expect(screen.getByText(/内 送料 500円/)).toBeInTheDocument();
  });

  it("TC-U02 正常系: 送料無料の場合は「送料無料」を表示する", () => {
    render(
      <PriceWithShipping price={4180} shippingNote={{ kind: "free", fee: 0, label: "送料無料" }} />,
    );
    expect(screen.getByText(/送料無料/)).toBeInTheDocument();
  });

  it("TC-U03 正常系: 実店舗が最安の場合は「店頭価格・送料なし」を表示する", () => {
    render(
      <PriceWithShipping
        price={3500}
        shippingNote={{ kind: "store", fee: 0, label: "店頭価格・送料なし" }}
      />,
    );
    expect(screen.getByText(/店頭価格・送料なし/)).toBeInTheDocument();
  });

  it("TC-U04 正常系: 「最安値・送料込み」のような送料額のない表記は使わない（RV-18①）", () => {
    const { container } = render(
      <PriceWithShipping
        price={3980}
        shippingNote={{ kind: "included", fee: 500, label: "内 送料 500円" }}
      />,
    );
    expect(container.textContent).not.toContain("送料込み");
  });

  it("TC-U05 正常系: 「〜」の接尾辞を付けられる（一覧カードの表記）", () => {
    render(
      <PriceWithShipping
        price={3980}
        shippingNote={{ kind: "included", fee: 500, label: "内 送料 500円" }}
        suffix="〜"
      />,
    );
    expect(screen.getByText("3,980円〜")).toBeInTheDocument();
  });

  it("TC-U06 正常系: 販売元の名前を添えられる（RV-18①「最安値: ショップ名」）", () => {
    render(
      <PriceWithShipping
        price={3980}
        shippingNote={{ kind: "included", fee: 500, label: "内 送料 500円" }}
        sourceName="プロテインマート"
      />,
    );
    expect(screen.getByText(/最安値: プロテインマート/)).toBeInTheDocument();
  });
});
