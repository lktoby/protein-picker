# Claude Code設定手順

## （利用者）事前準備
- Claude Codeをインストールしており、CLI（ターミナルなど）で`claude`を利用できること
- アカウントは付与するため、Claude Codeのログイン(`/login`)は不要

### インストール手順（公式）
https://code.claude.com/docs/ja/quickstart

## （運営）認証情報発行

### 前提
Claude Platform on AWSが利用できること

### APIキー発行

> [!NOTE]
> AWSアカウントの認証（IAMユーザーなど）が不要な、APIキー方式を採用

---

1. AWSコンソール > Claude Platform on AWS > APIキーを開く
2. 長期キーを生成する
    - 有効期限（`API key expiration`）を最短の`1 day`にする
    - `AeaApiKey-xxx`というキーが生成されるが、自動的に同じprefixを持つIAMユーザーが作成される（内部的にIAMユーザーを通して認証する仕組み）
3. 生成したキーを配布する
4. 利用終了後は、IAMから対応するユーザーを削除する
    - 有効期限で自動で失効するが、1日未満の場合は手動削除を推奨

---

> [!NOTE] 
> キー発行時、AWSコンソールで`export ANTHROPIC_API_KEY=xxx`と案内が出るが、正しくは`export ANTHROPIC_AWS_API_KEY=xxx`

## （利用者）利用開始

### 1. ターミナルで専用の環境変数を設定

#### Mac
```
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
export ANTHROPIC_AWS_WORKSPACE_ID=XXX # 実際のワークスペースID
export AWS_REGION=ap-northeast-1　
export ANTHROPIC_AWS_API_KEY=xxx # 前項で発行したAPIキー
```

> [!NOTE]
> キー発行時、AWSコンソールで`export ANTHROPIC_API_KEY=xxx`と案内が出るが、正しくは`export ANTHROPIC_AWS_API_KEY=xxx`


#### Windows

> [!WARNING]
> 以下の手順は**未検証**です（Windows 環境での動作確認ができていません）。実際に試して不具合があれば、この資料を更新してください。

Claude Code は WSL（Windows Subsystem for Linux）上での利用を推奨します。WSL2 のセットアップ方法は [`docker_setup.md`](./docker_setup.md) の「Windows」節を参照してください。

**WSL（Ubuntu など）のターミナルを使う場合（推奨）**

Mac と同じく `export` で設定します。WSL 内の `~/.bashrc` や `~/.zshrc` に追記しておくと、ターミナルを開くたびに自動で設定されます。

```bash
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
export ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_016pLskGKScscDPjEqihJFPu
export AWS_REGION=ap-northeast-1
export ANTHROPIC_AWS_API_KEY=AEAAQWVhQXBpS2V5LTc2aXg2dGtvLWF0LTk0MTI4MTQ0NjA1Njp3eVFjL1ArRjlSb3crTmllYXlrby9LQUcxR1R0cVg1a2dWazRVUlA1dHRJQzd3MVpWcFNvREU3VjhQMD0=
```

**PowerShell を直接使う場合**

現在のターミナルだけで一時的に設定する場合:

```powershell
$env:CLAUDE_CODE_USE_ANTHROPIC_AWS = "1"
$env:ANTHROPIC_AWS_WORKSPACE_ID = "XXX" # 実際のワークスペースID
$env:AWS_REGION = "ap-northeast-1"
$env:ANTHROPIC_AWS_API_KEY = "xxx" # 前項で発行したAPIキー
```

新しいターミナルでも有効になるよう恒久的に設定する場合:

```powershell
setx CLAUDE_CODE_USE_ANTHROPIC_AWS "1"
setx ANTHROPIC_AWS_WORKSPACE_ID "XXX"
setx AWS_REGION "ap-northeast-1"
setx ANTHROPIC_AWS_API_KEY "xxx"
```

> [!NOTE]
> `setx` で設定した環境変数は、既に開いているターミナルには反映されません。ターミナルを開き直してから `claude` を実行してください。

### 2. claude利用開始

```
claude
```

添付のように`Claude Platform on AWS` と表示されればOK

![image](./images/claude_code.png)
