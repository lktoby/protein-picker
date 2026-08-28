# ai-flow-sample-for-intern

Next.js（TypeScript / App Router / Tailwind CSS）で作るサンプルアプリです。
開発フロー（要件定義 → 設計 → 実装 → 受け入れ）については `CLAUDE.md` を参照してください。

## 動作環境

- Docker（Docker Desktop）
  - Mac / Windows のセットアップ手順: [`onboarding/docker_setup.md`](./onboarding/docker_setup.md)

Node.js や npm を直接インストールしなくても、Docker だけでアプリを起動できます。

## Docker で起動する

リポジトリのルートで以下を実行します。

```bash
docker compose up --build
```

起動したらブラウザで以下を開きます。

- http://localhost:3000

停止するときはターミナルで `Ctrl + C`、または別ターミナルから以下を実行します。

```bash
docker compose down
```

コードを変更した場合は、イメージの再ビルドが必要です。

```bash
docker compose up --build
```

Docker Compose を使わず、イメージのビルドとコンテナ起動を個別に行うこともできます。

```bash
docker build -t ai-flow-sample-for-intern .
docker run -p 3000:3000 --env-file .env ai-flow-sample-for-intern
```

---

## プロトタイプ（デモ）を見る

`master` は**本実装**のためのブランチです。関係者レビューに使ったプロトタイプ（モックデータで動くデモ）は、
レビュー完了時点のスナップショットとして別に保存してあります。

| 保存場所 | 用途 |
|---------|------|
| タグ `prototype-reviewed-2026-08-28` | レビュー完了時点の状態を固定して残したもの |
| ブランチ `archive/prototype` | 同じ内容。ブランチ一覧から見つけやすくするためのもの（**更新しません**） |

デモを動かすには、どちらかをチェックアウトしてから起動します。

```bash
git checkout archive/prototype     # または git checkout prototype-reviewed-2026-08-28
docker compose up --build
```

起動したら http://localhost:3000/prototype を開きます。
本実装に戻るときは `git checkout master` します。

- デモの見方・モックで済ませた範囲: [`docs/02-prototype/prototype-notes.md`](./docs/02-prototype/prototype-notes.md)
- レビューの指摘と対応（RV-01〜RV-18）: [`docs/02-prototype/review-feedback.md`](./docs/02-prototype/review-feedback.md)
- レビューで確定した UI/UX 仕様: [`docs/02-prototype/ui-spec.md`](./docs/02-prototype/ui-spec.md)

> プロトタイプは**捨てる前提のコード**です。本実装に流用しませんが、合意した UI/UX（`ui-spec.md`）は後工程が踏襲します。
> 実装前後のコードを見比べたいときは `git diff archive/prototype master -- src/` が使えます。

---

## （オプション）Node.js / npm でローカル起動する

Docker を使わず、ホスト環境に直接 Node.js をインストールして動かすこともできます。

### 動作環境

- Node.js 20 以上（推奨: 22）
- npm

### セットアップ

初回、またはリポジトリを clone した直後は依存関係をインストールします。

```bash
npm install
```

### ローカル起動と確認

開発サーバーを起動します。

```bash
npm run dev
```

起動したらブラウザで以下を開きます。

- http://localhost:3000

`src/app/page.tsx` などを編集すると、保存時に自動で画面へ反映されます（ホットリロード）。
サーバーを止めるときはターミナルで `Ctrl + C` を押します。

### その他のコマンド

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバーを起動する（ローカル確認用） |
| `npm run build` | 本番向けにビルドする |
| `npm start` | ビルド済みアプリを起動する（本番相当の確認） |
| `npm test` | テストを実行する（TDD で使用） |
| `npm run test:watch` | テストを監視モードで実行する |
| `npm run lint` | ESLint でコードをチェックする |

本番相当で確認したい場合は、ビルドしてから起動します。

```bash
npm run build
npm start
```
