// ============================================================
// F-10 お届け状況（RV-17）
// ui-spec.md §5・§11-3: 色相ではなく「塗りの強さ」で 3 段階を区別し、
// アイコンとラベルを常に併記する（色覚特性のある利用者でも区別できるようにする）
// ============================================================
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeliveryStatusBadge } from "./delivery-status-badge";

describe("DeliveryStatusBadge — お届け状況のバッジ（ui-spec.md §5 / RV-17）", () => {
  it("TC-U07 正常系: 注文済みのラベルを表示する", () => {
    render(<DeliveryStatusBadge status="ordered" />);
    expect(screen.getByText("注文済み")).toBeInTheDocument();
  });

  it("TC-U08 正常系: お届け中のラベルを表示する", () => {
    render(<DeliveryStatusBadge status="shipping" />);
    expect(screen.getByText("お届け中")).toBeInTheDocument();
  });

  it("TC-U09 正常系: お届け済みのラベルを表示する", () => {
    render(<DeliveryStatusBadge status="delivered" />);
    expect(screen.getByText("お届け済み")).toBeInTheDocument();
  });

  it("TC-U10 正常系: 3 状態それぞれにアイコンを併記する（色だけに依存しない / §11-3）", () => {
    for (const status of ["ordered", "shipping", "delivered"] as const) {
      const { container, unmount } = render(<DeliveryStatusBadge status={status} />);
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });

  it("TC-U11 正常系: 3 状態で見た目（塗りの強さ）が互いに異なる", () => {
    const classNames = (["ordered", "shipping", "delivered"] as const).map((status) => {
      const { container, unmount } = render(<DeliveryStatusBadge status={status} />);
      const cls = container.firstElementChild?.className ?? "";
      unmount();
      return cls;
    });
    expect(new Set(classNames).size).toBe(3);
  });
});
