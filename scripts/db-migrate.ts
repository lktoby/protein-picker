// マイグレーションを適用する（npm run db:migrate）
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL が設定されていません。");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });

  // 注文番号の採番シーケンス（db-design.md §5-8）。
  // アプリ側でカウントすると同時実行で衝突するため、DB のシーケンスを使う。
  await pool.query("CREATE SEQUENCE IF NOT EXISTS orders_number_seq");

  console.log("マイグレーションを適用しました。");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
