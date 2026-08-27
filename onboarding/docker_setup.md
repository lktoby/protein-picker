# Docker セットアップ手順

このリポジトリの Next.js アプリは、Docker があれば Node.js や npm をインストールしなくても起動できます。
本資料では、Mac / Windows それぞれで Docker（正確には Docker Desktop）をセットアップする手順をまとめます。

## 事前準備

- Docker Desktop をインストールしており、ターミナル（Mac）または PowerShell（Windows）で `docker` コマンドを利用できること
- ディスク空き容量: 数 GB 程度（アプリのビルドイメージ用）

---

## Mac

### 1. Docker Desktop をインストールする

1. [Docker 公式サイト](https://www.docker.com/products/docker-desktop/) から Docker Desktop for Mac をダウンロードします。
   - Apple Silicon（M1/M2/M3/M4）と Intel Mac でインストーラーが異なるので、自分の Mac のチップに合ったものを選びます。
   - チップの確認方法: 画面左上の Apple メニュー →「この Mac について」
2. ダウンロードした `.dmg` を開き、`Docker.app` を `Applications` フォルダへドラッグします。
3. `Applications` から `Docker.app` を起動します。
   - 初回起動時に権限の許可やライセンスへの同意を求められるので、案内に従って進めます。
4. メニューバーの鯨（クジラ）アイコンが表示され、動作が安定したら準備完了です。

### 2. 動作確認

ターミナルで以下を実行し、バージョンが表示されれば OK です。

```bash
docker --version
docker compose version
```

---

## Windows

Windows では、Docker Desktop の実行に **WSL2（Windows Subsystem for Linux 2）** が必要です。先に WSL2 を有効化してからインストールします。

### 1. WSL2 を有効化する

1. PowerShell を**管理者として実行**します。
2. 以下を実行します。

   ```powershell
   wsl --install
   ```

3. インストール後、PC を再起動します。
   - すでに WSL が入っている場合は `wsl --update` で最新化してください。

### 2. Docker Desktop をインストールする

1. [Docker 公式サイト](https://www.docker.com/products/docker-desktop/) から Docker Desktop for Windows をダウンロードします。
2. インストーラーを実行します。
   - 設定確認画面で「Use WSL 2 instead of Hyper-V」（WSL2 バックエンドを使う）にチェックが入っていることを確認します（既定で有効な場合が多いです）。
3. インストール後、PC を再起動します。
4. Docker Desktop を起動し、初回はライセンスへの同意など案内に従って進めます。
5. Docker Desktop の `Settings > Resources > WSL Integration` を開き、利用している WSL ディストロ（Ubuntu など）との統合が有効になっていることを確認します。

> [!NOTE]
> ターミナルは PowerShell でも、WSL 内の Ubuntu などのシェルでも、`docker` コマンドが使えれば問題ありません。社内では WSL 側での作業を推奨します。

### 3. 動作確認

PowerShell または WSL のターミナルで以下を実行し、バージョンが表示されれば OK です。

```powershell
docker --version
docker compose version
```

---

## アプリを起動する

Docker のセットアップができたら、リポジトリのルートで以下を実行します（Mac / Windows 共通）。

```bash
docker compose up --build
```

起動したらブラウザで http://localhost:3000 を開きます。詳しい起動方法・停止方法は [リポジトリ直下の README.md](../README.md#docker-で起動する) を参照してください。

## うまくいかないとき

- `docker: command not found` / `'docker' は認識されません`
  - Docker Desktop が起動していない可能性があります。アプリを起動し、鯨アイコンが安定してから再度試してください。
- Windows で `wsl --install` が失敗する
  - 仮想化支援機能（Virtualization）が BIOS/UEFI で無効になっている場合があります。PC メーカーの手順を参照し、BIOS 設定で有効化してください。
- ポート `3000` が使用中というエラーが出る
  - 別のアプリ（例: `npm run dev` で起動したままの Next.js）がポート 3000 を使っていないか確認してください。
