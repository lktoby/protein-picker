"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildCriteriaQuery, buildRecommendUrl } from "@/lib/criteria";
import type { RecommendCriteria } from "@/server/domain/recommendation";
import {
  PREFERENCES,
  PREFERENCE_LABELS,
  PURPOSES,
  PURPOSE_LABELS,
  TIMINGS,
  TIMING_LABELS,
  type Preference,
  type Purpose,
  type Timing,
} from "@/server/domain/types";
import type { RecommendationResponse } from "@/server/services/recommendation-service";
import { RecommendationCarousel } from "./recommendation-carousel";

type Props = {
  /** URL から復元できた条件（RV-02）。無い場合は null */
  appliedCriteria: RecommendCriteria | null;
  /** 復元した条件での結果 */
  result: RecommendationResponse | null;
  /** URL の条件が不正だった（RV-15） */
  invalidLink: boolean;
};

export function RecommendView({ appliedCriteria, result, invalidLink }: Props) {
  const router = useRouter();
  const resultsRef = useRef<HTMLElement>(null);

  // 選択中の条件。URL から復元した条件を初期値にする（RV-02）
  const [purpose, setPurpose] = useState<Purpose | null>(appliedCriteria?.purpose ?? null);
  const [timing, setTiming] = useState<Timing | null>(appliedCriteria?.timing ?? null);
  const [prefs, setPrefs] = useState<Preference[]>(appliedCriteria?.prefs ?? []);

  // RV-05: 結果が表示されたら結果セクションへスクロールする
  const shouldScroll = useRef(false);
  useEffect(() => {
    if (result && shouldScroll.current) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      shouldScroll.current = false;
    }
  }, [result]);

  // RV-05・RV-13: 表示中の結果と選択中の条件がずれているか
  const dirty =
    appliedCriteria !== null &&
    (appliedCriteria.purpose !== purpose ||
      appliedCriteria.timing !== timing ||
      appliedCriteria.prefs.length !== prefs.length ||
      appliedCriteria.prefs.some((p) => !prefs.includes(p)));

  const run = () => {
    if (!purpose || !timing) return;
    shouldScroll.current = true;
    // RV-02: 条件を URL に持たせる。履歴を汚さないよう replace を使う
    router.replace(`/recommend?${buildCriteriaQuery({ purpose, timing, prefs })}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">おすすめ診断</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          3つの質問に答えると、あなたに合ったプロテインをおすすめ順に表示します。
        </p>
      </div>

      {/* RV-15: 不正な条件付きリンクは黙って無視せず通知する */}
      {invalidLink ? (
        <Alert variant="inverted">
          <AlertTriangle aria-hidden />
          <AlertDescription>
            リンクに含まれていた診断条件が無効だったため、復元できませんでした。条件を選び直してください。
          </AlertDescription>
        </Alert>
      ) : null}

      {/* 条件選択（ui-spec.md §2） */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <fieldset className="space-y-3">
            <legend className="font-bold">
              1. プロテインを飲む目的は？ <span className="text-xs font-normal">必須</span>
            </legend>
            <ToggleGroup
              type="single"
              value={purpose ?? ""}
              onValueChange={(v) => setPurpose((v || null) as Purpose | null)}
            >
              {PURPOSES.map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {PURPOSE_LABELS[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-bold">
              2. 主に飲みたいタイミングは？ <span className="text-xs font-normal">必須</span>
            </legend>
            <ToggleGroup
              type="single"
              value={timing ?? ""}
              onValueChange={(v) => setTiming((v || null) as Timing | null)}
            >
              {TIMINGS.map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {TIMING_LABELS[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-bold">
              3. こだわりはありますか？{" "}
              <span className="text-xs font-normal text-muted-foreground">複数選択可・任意</span>
            </legend>
            <ToggleGroup
              type="multiple"
              value={prefs}
              onValueChange={(v) => setPrefs(v as Preference[])}
            >
              {PREFERENCES.map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {PREFERENCE_LABELS[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {/* RV-15: 用語がわからない人への導線 */}
            <p className="text-xs text-muted-foreground">
              「乳糖不耐症」など用語がわからないときは{" "}
              <Link href="/glossary" className="underline underline-offset-4 hover:no-underline">
                用語説明
              </Link>{" "}
              をどうぞ
            </p>
          </fieldset>

          {/* ui-spec.md §2: 必須が未選択の間は非活性 */}
          <Button size="lg" onClick={run} disabled={!purpose || !timing} className="w-full sm:w-auto">
            おすすめを見る
          </Button>
        </CardContent>
      </Card>

      {result && result.items.length === 0 ? (
        <section ref={resultsRef} className="scroll-mt-24">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              条件に合う商品が見つかりませんでした。こだわり条件を減らして試してみてください。
            </CardContent>
          </Card>
        </section>
      ) : null}

      {result && result.items.length > 0 && appliedCriteria ? (
        <section ref={resultsRef} className="space-y-4 scroll-mt-24">
          {/* RV-05・RV-13・RV-15: 条件変更後は再実行ボタンをバナー側に用意する */}
          {dirty ? (
            <Alert variant="inverted">
              <AlertTriangle aria-hidden />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>条件が変更されています。この結果は古い条件のものです。</span>
                <Button variant="outline" size="sm" onClick={run}>
                  新しい条件でおすすめを見る
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* RV-13: 古い結果はクリックもキーボードフォーカスも受け付けない */}
          <div
            className={cnDirty(dirty)}
            {...(dirty ? { inert: true } : {})}
          >
            <div>
              <h2 className="text-lg font-bold">
                あなたへのおすすめ{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  （{result.total}件・おすすめ順）
                </span>
              </h2>
              {/* RV-09: 順位付けの根拠 */}
              <p className="mt-1 text-xs text-muted-foreground">
                順位は「選んだ条件との一致度」と「価格（1gあたり・総額）」の総合で決まります。カードの
                ✓ が一致した条件です。
              </p>
            </div>

            <RecommendationCarousel
              items={result.items}
              backUrl={buildRecommendUrl(appliedCriteria)}
            />

            {/* RV-04: 結果の下に用語説明への導線 */}
            <p className="text-center text-sm">
              <Link
                href="/glossary"
                className="inline-flex items-center gap-1 underline underline-offset-4 hover:no-underline"
              >
                <BookOpen aria-hidden className="size-4" />
                用語説明はこちら（ホエイ？WPI？という方へ）
              </Link>
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** dirty のときは見た目も操作も無効にする（見た目と挙動を一致させる。RV-13） */
function cnDirty(dirty: boolean): string {
  return dirty
    ? "space-y-4 opacity-40 pointer-events-none select-none transition-opacity"
    : "space-y-4";
}
