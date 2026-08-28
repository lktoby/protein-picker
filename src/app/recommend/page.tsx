// F-01 おすすめ条件の選択 / F-02 おすすめ商品の提示（US-01, US-02）
// 根拠: docs/02-prototype/ui-spec.md §2、docs/03-design/screen-flow.md §5-2
import type { Metadata } from "next";
import { parseCriteria } from "@/lib/criteria";
import { getRecommendations } from "@/server/services/recommendation-service";
import { RecommendView } from "./_components/recommend-view";

// DB を参照するため静的プリレンダリングしない（ビルド時に DB が無いため）
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "おすすめ診断 | プロテインえらび" };

export default async function RecommendPage({
  searchParams,
}: {
  // Next.js 15 以降 searchParams は Promise（api-spec.md §1-5）
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") search.set(key, value);
  }

  const parsed = parseCriteria(search);

  // 条件が復元できたときだけサーバー側で採点する（RV-02）
  const result = parsed.status === "valid" ? await getRecommendations(parsed.criteria) : null;

  return (
    <RecommendView
      appliedCriteria={parsed.status === "valid" ? parsed.criteria : null}
      result={result}
      invalidLink={parsed.status === "invalid"}
    />
  );
}
