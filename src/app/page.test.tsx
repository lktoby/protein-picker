import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

// テスト環境の疎通確認用サンプル。実装工程で実際のテストに置き換える。
describe("Home", () => {
  it("レンダリングできる", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
