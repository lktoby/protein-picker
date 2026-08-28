"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Dices } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatYen, orderTotal } from "@/server/domain/pricing";
import { MAX_QUANTITY, MIN_QUANTITY } from "@/server/domain/order-rules";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/server/domain/types";

type Props = {
  productId: string;
  productName: string;
  productFlavor: string;
  productBrand: string;
  imageUrl: string;
  shopId: string;
  shopName: string;
  itemPrice: number;
  shippingFee: number;
  /** 診断経由なら診断結果の URL（RV-12） */
  from: string | null;
};

/** ダミーのカード情報を作る（RV-08③）。実在の情報を入力させないため readOnly にする */
function randomDummyCard() {
  const block = () => String(Math.floor(1000 + Math.random() * 9000));
  const names = ["PROTEIN TARO", "DUMMY HANAKO", "SAMPLE ICHIRO", "MOCK YUKI"];
  return {
    number: `4${block().slice(1)} ${block()} ${block()} ${block()}`,
    name: names[Math.floor(Math.random() * names.length)],
    expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${28 + Math.floor(Math.random() * 4)}`,
  };
}

export function PurchaseForm(props: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("credit_card");
  const [card, setCard] = useState({
    number: "4111 1111 1111 1111",
    name: "PROTEIN TARO",
    expiry: "12/30",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RV-07: 画面表示時に 1 つ作り、同じ購入操作では同じ値を送る（二重送信防止）
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const itemsTotal = props.itemPrice * quantity;
  // 送料は注文単位で 1 回（design questions.md Q-01）
  const total = orderTotal({
    unitItemPrice: props.itemPrice,
    quantity,
    shippingFee: props.shippingFee,
  });

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // カード情報は送らない（要件スコープ外 #2 / api-spec.md §5）
        body: JSON.stringify({
          productId: props.productId,
          shopId: props.shopId,
          quantity,
          paymentMethod: payment,
          idempotencyKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? "注文の作成に失敗しました。");
        return;
      }
      const fromQuery = props.from ? `?from=${encodeURIComponent(props.from)}` : "";
      router.push(`/orders/${data.id}/complete${fromQuery}`);
    } catch {
      setError("通信に失敗しました。時間をおいて試してください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="inverted">
        <AlertTriangle aria-hidden />
        <AlertDescription>
          これはダミーの購入画面です。実際の支払いは発生しません。
          <b>実在のカード番号・氏名などの個人情報は入力しないでください。</b>
        </AlertDescription>
      </Alert>

      {/* 注文内容（ui-spec.md §4） */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-bold">注文内容</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={props.imageUrl}
              alt={`${props.productName} ${props.productFlavor}`}
              width={64}
              height={64}
              className="rounded-card border border-border bg-muted"
            />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{props.productBrand}</p>
              <p className="font-bold">
                {props.productName}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {props.productFlavor}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {props.shopName}・{formatYen(props.itemPrice)}
                {props.shippingFee === 0 ? "（送料無料）" : ""}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              数量
              <Select
                value={String(quantity)}
                onValueChange={(v) => setQuantity(Number(v))}
              >
                <SelectTrigger className="w-20" aria-label="数量">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: MAX_QUANTITY - MIN_QUANTITY + 1 },
                    (_, i) => i + MIN_QUANTITY,
                  ).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <Separator />

          {/* 合計の内訳 3 行（ui-spec.md §6 / RV-16） */}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                商品代金（{formatYen(props.itemPrice)} × {quantity}）
              </dt>
              <dd className="tabular-nums">{formatYen(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">送料</dt>
              <dd className="tabular-nums">
                {props.shippingFee === 0 ? (
                  <span className="font-bold">無料</span>
                ) : (
                  formatYen(props.shippingFee)
                )}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <dt>合計</dt>
              <dd className="tabular-nums">{formatYen(total)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* お支払い方法（ダミー・ui-spec.md §4） */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-bold">お支払い方法（ダミー）</h2>
          <ToggleGroup
            type="single"
            value={payment}
            onValueChange={(v) => v && setPayment(v as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((method) => (
              <ToggleGroupItem key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {payment === "credit_card" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  入力欄は編集できません（実在のカード情報を入力させないため）
                </p>
                <Button variant="link" size="sm" onClick={() => setCard(randomDummyCard())}>
                  <Dices aria-hidden className="size-4" />
                  ダミー値をランダム生成
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">カード番号（ダミー値）</span>
                  <Input value={card.number} readOnly className="font-mono" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">カード名義（ダミー値）</span>
                  <Input value={card.name} readOnly className="font-mono" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">有効期限（ダミー値）</span>
                  <Input value={card.expiry} readOnly className="font-mono" />
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {PAYMENT_METHOD_LABELS[payment]}を選択しました。デモのため、このまま注文を確定できます。
            </p>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="inverted">
          <AlertTriangle aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* 送信中は無効化して多重クリックを防ぐ（RV-07） */}
      <Button size="lg" className="w-full" onClick={submit} disabled={submitting}>
        {submitting ? "処理中…" : "注文を確定する（ダミー決済）"}
      </Button>
    </div>
  );
}
