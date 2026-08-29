import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を結合する。後から渡したクラスが競合する既存クラスを上書きする。
 * 各コンポーネントが `className` で見た目を上書きできるようにするために使う。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
