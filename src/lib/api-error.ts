// API の共通エラー形式（docs/03-design/api-spec.md §1-4）
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/** message は利用者に見せられる日本語にする。技術的な詳細は返さない */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Array<{ field: string; message: string }>,
) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, {
    status: STATUS[code],
  });
}
