# Git セットアップ手順

このリポジトリでは、変更履歴を残すために **ローカルで `git commit` できる状態** にしておきます。
GitHub などのリモートリポジトリへの接続（`git push` や SSH 鍵の設定など）は不要です。

本資料では、Mac / Windows それぞれで Git をインストールし、ローカルでコミットできる状態にする手順をまとめます。

## 事前準備

- ターミナル（Mac）または PowerShell / Git Bash（Windows）で `git` コマンドを利用できること

---

## Mac

### 1. Git をインストールする

ターミナルで以下を実行します。

```bash
git --version
```

未インストールの場合、Xcode Command Line Tools のインストールを促すダイアログが表示されるので、案内に従ってインストールします（数分かかります）。

Homebrew を使っている場合は、以下でも入れられます。

```bash
brew install git
```

### 2. 動作確認

```bash
git --version
```

バージョンが表示されれば OK です。

---

## Windows

### 1. Git をインストールする

1. [Git for Windows](https://git-scm.com/download/win) からインストーラーをダウンロードします。
2. インストーラーを実行します。基本的にはデフォルト設定のまま「Next」で進めて問題ありません。
   - 途中でエディタの選択などの画面が出ますが、迷ったら既定のまま進めて OK です。
3. インストール後、「Git Bash」というアプリが使えるようになります（PowerShell でも `git` コマンドが使えます）。

### 2. 動作確認

Git Bash または PowerShell で以下を実行します。

```bash
git --version
```

バージョンが表示されれば OK です。

---

## 初回だけ行う設定（ユーザー情報の登録）

コミットには「誰が変更したか」を記録するためのユーザー名・メールアドレスの設定が必要です（Mac / Windows 共通）。

```bash
git config --global user.name "あなたの名前"
git config --global user.email "you@example.com"
```

> [!NOTE]
> ここで設定するメールアドレスは、コミット履歴に記録として残るだけのものです。リモートリポジトリへの接続は行わないため、実在するアドレスでなくても動作上は問題ありません。

## 動作確認（ローカルでコミットしてみる）

実際にこのリポジトリでコミットできるか確認します。

```bash
cd /path/to/ai-flow-sample-for-intern
git status
```

変更中のファイルがあれば一覧が表示されます。試しに何かファイルを編集してからコミットしてみます。

```bash
git add .
git commit -m "test commit"
```

`git log` でコミットが記録されていれば OK です。

```bash
git log
```

## うまくいかないとき

- `git: command not found` / `'git' は認識されません`
  - インストールが完了していないか、ターミナルの再起動が必要な場合があります。ターミナル（または PowerShell / Git Bash）を開き直して再度試してください。
- `git commit` 時に `Please tell me who you are` と表示される
  - 上記の「初回だけ行う設定（ユーザー情報の登録）」がまだの場合に出ます。設定してから再度コミットしてください。
