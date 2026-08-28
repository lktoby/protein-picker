import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * DB 接続。
 *
 * 接続は**最初のクエリまで遅延**させる。モジュール読み込み時に接続を作ると、
 * `next build` がページ情報を収集する段階（DB が無い環境）でビルドが失敗する。
 *
 * 開発時のホットリロードで接続が増え続けないよう、Pool はグローバルに 1 つだけ持つ。
 */
const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

function getDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL が設定されていません。docker compose up --build で起動してください。",
      );
    }
    globalForDb.pool ??= new Pool({ connectionString });
    globalForDb.db = drizzle(globalForDb.pool, { schema });
  }
  return globalForDb.db;
}

/** 呼び出し側は従来どおり `db.select()` のように使える（実際の接続は初回クエリ時） */
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
