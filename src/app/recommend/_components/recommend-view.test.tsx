// ============================================================
// F-01 / F-02 のおすすめ診断画面の操作仕様
// 根拠: docs/02-prototype/ui-spec.md §2（RV-02, RV-04, RV-05, RV-09, RV-13, RV-15）
// ============================================================
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendView } from "./recommend-view";
import type { RecommendationResponse } from "@/server/services/recommendation-service";
import type { RecommendCriteria } from "@/server/domain/recommendation";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

// ロールの違い: 単一選択（目的・タイミング）は role="radio"、
// 複数選択（こだわり）は通常の button になる（Radix ToggleGroup の仕様）。
const criteria: RecommendCriteria = { purpose: "muscle", timing: "post_workout", prefs: [] };

function makeResult(itemCount: number): RecommendationResponse {
  return {
    criteria: {
      purpose: "muscle",
      purposeLabel: "筋肉をつけたい",
      timing: "post_workout",
      timingLabel: "運動後",
      prefs: [],
      prefLabels: [],
    },
    total: itemCount,
    items: Array.from({ length: itemCount }, (_, i) => ({
      rank: i + 1,
      cheapestShopName: "プロテインマート",
      matches: ["筋肉をつけたい"],
      reason: "「筋肉をつけたい」にぴったり。",
      product: {
        id: `p${i}`,
        name: `商品${i}`,
        brand: "ブランド",
        type: "whey" as const,
        typeLabel: "ホエイ",
        flavor: "プレーン",
        weightG: 1000,
        proteinContent: 75,
        imageUrl: "/images/products/whey.svg",
        lowestPrice: 3980,
        pricePerGram: 3.98,
        shippingNote: { kind: "included" as const, fee: 500, label: "内 送料 500円" },
        cheapestSourceName: "プロテインマート",
      },
    })),
  };
}

beforeEach(() => replace.mockClear());

describe("RecommendView — 条件選択（ui-spec.md §2）", () => {
  it("TC-U12 正常系: 必須 2 問が未選択の間は「おすすめを見る」が押せない", () => {
    render(<RecommendView appliedCriteria={null} result={null} invalidLink={false} />);
    expect(screen.getByRole("button", { name: "おすすめを見る" })).toBeDisabled();
  });

  it("TC-U13 正常系: 目的とタイミングを選ぶと押せるようになる", async () => {
    const user = userEvent.setup();
    render(<RecommendView appliedCriteria={null} result={null} invalidLink={false} />);
    await user.click(screen.getByRole("radio", { name: "筋肉をつけたい" }));
    await user.click(screen.getByRole("radio", { name: "運動後" }));
    expect(screen.getByRole("button", { name: "おすすめを見る" })).toBeEnabled();
  });

  it("TC-U14 正常系: 実行すると条件を URL クエリに反映する（RV-02）", async () => {
    const user = userEvent.setup();
    render(<RecommendView appliedCriteria={null} result={null} invalidLink={false} />);
    await user.click(screen.getByRole("radio", { name: "筋肉をつけたい" }));
    await user.click(screen.getByRole("radio", { name: "運動後" }));
    await user.click(screen.getByRole("button", { name: "おすすめを見る" }));
    expect(replace).toHaveBeenCalledWith(
      "/recommend?purpose=muscle&timing=post_workout",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("TC-U15 正常系: URL から復元した条件が選択状態として反映される（RV-02）", () => {
    render(
      <RecommendView appliedCriteria={criteria} result={makeResult(2)} invalidLink={false} />,
    );
    expect(screen.getByRole("radio", { name: "筋肉をつけたい" })).toHaveAttribute(
      "data-state",
      "on",
    );
  });

  it("TC-U16 正常系: こだわり質問の下に用語説明へのヒントリンクがある（RV-15）", () => {
    render(<RecommendView appliedCriteria={null} result={null} invalidLink={false} />);
    expect(screen.getByRole("link", { name: "用語説明" })).toHaveAttribute("href", "/glossary");
  });
});

describe("RecommendView — 不正リンクの通知（RV-15）", () => {
  it("TC-U17 異常系: 条件が不正だった場合は通知を表示する（黙って無視しない）", () => {
    render(<RecommendView appliedCriteria={null} result={null} invalidLink />);
    expect(screen.getByText(/診断条件が無効だったため/)).toBeInTheDocument();
  });

  it("TC-U18 正常系: 条件が正常なら通知は出さない", () => {
    render(<RecommendView appliedCriteria={null} result={null} invalidLink={false} />);
    expect(screen.queryByText(/診断条件が無効だったため/)).not.toBeInTheDocument();
  });
});

describe("RecommendView — 結果の表示（RV-09）", () => {
  it("TC-U19 正常系: 順位付けの根拠の説明文を表示する", () => {
    render(<RecommendView appliedCriteria={criteria} result={makeResult(2)} invalidLink={false} />);
    expect(screen.getByText(/順位は「選んだ条件との一致度」/)).toBeInTheDocument();
  });

  it("TC-U20 正常系: 件数を表示する", () => {
    render(<RecommendView appliedCriteria={criteria} result={makeResult(3)} invalidLink={false} />);
    expect(screen.getByText(/3件・おすすめ順/)).toBeInTheDocument();
  });

  it("TC-U21 正常系: 結果の下に用語説明へのリンクを置く（RV-04）", () => {
    render(<RecommendView appliedCriteria={criteria} result={makeResult(1)} invalidLink={false} />);
    expect(screen.getByRole("link", { name: /用語説明はこちら/ })).toBeInTheDocument();
  });

  it("TC-U22 境界値: 0 件のときは回復策を示すメッセージを出す", () => {
    render(<RecommendView appliedCriteria={criteria} result={makeResult(0)} invalidLink={false} />);
    expect(screen.getByText(/こだわり条件を減らして/)).toBeInTheDocument();
  });
});

describe("RecommendView — 条件変更後の古い結果（RV-05・RV-13）", () => {
  it("TC-U23 正常系: 条件を変えると警告と再実行ボタンが現れる", async () => {
    const user = userEvent.setup();
    render(<RecommendView appliedCriteria={criteria} result={makeResult(2)} invalidLink={false} />);

    expect(screen.queryByText(/条件が変更されています/)).not.toBeInTheDocument();
    // こだわりを 1 つ足して条件をずらす
    await user.click(screen.getByRole("button", { name: /低糖質/ }));

    expect(screen.getByText(/条件が変更されています/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "新しい条件でおすすめを見る" }),
    ).toBeInTheDocument();
  });

  it("TC-U24 正常系: 古い結果は操作不可（inert）になる（見た目と挙動を一致させる）", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RecommendView appliedCriteria={criteria} result={makeResult(2)} invalidLink={false} />,
    );
    await user.click(screen.getByRole("button", { name: /低糖質/ }));

    const inertRegion = container.querySelector("[inert]");
    expect(inertRegion).not.toBeNull();
    // 結果の見出しが inert 領域の中にあること
    expect(inertRegion?.textContent).toContain("あなたへのおすすめ");
  });

  it("TC-U25 正常系: バナーの再実行ボタンで新しい条件を URL に反映できる", async () => {
    const user = userEvent.setup();
    render(<RecommendView appliedCriteria={criteria} result={makeResult(2)} invalidLink={false} />);
    await user.click(screen.getByRole("button", { name: /低糖質/ }));
    await user.click(screen.getByRole("button", { name: "新しい条件でおすすめを見る" }));
    expect(replace).toHaveBeenCalledWith(
      "/recommend?purpose=muscle&timing=post_workout&prefs=low_sugar",
      expect.objectContaining({ scroll: false }),
    );
  });
});
