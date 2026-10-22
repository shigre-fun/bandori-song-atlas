# Node.jsセキュリティ更新（2026-10-22）

## 方針と変更

標準ビルド版を **22.23.4** とし、ルートの `.node-version` を指定元とする。GitHub Pages向け `actions/setup-node@v4` は `node-version-file: ".node-version"` を参照する。workflowのtrigger・権限・pnpm 10・ビルド・GitHub Pagesへの配信手順は維持する。Cloudflare Pages本番は従来のGit連携で、GitHub Pagesとは別の配信である。

`package.json` の `engines.node: ">=22"` は互換範囲として維持する。依存パッケージと `pnpm-lock.yaml` は変更しない。Netlify用の既存 `NODE_VERSION = "22"` はCloudflareへの指定ではなく、今回の実運用対象外のため維持する。

今回の対象は[Node.js公式の2026-10-21セキュリティ更新](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)。22系の修正版は[22.23.4](https://nodejs.org/en/blog/release/v22.23.4/)、既存24系の修正版は[24.22.1](https://nodejs.org/en/blog/release/v24.22.1/)。26系への移行は行わない。

## ローカル実行環境

開始時にPATHから確認できたNode.jsは、Codex同梱の24.19.0だった。通常のProgram Files配下の候補には別のNode.jsは確認されなかった。PC全体の全実行ファイルを網羅した調査ではない。

既存Codex実行ファイルは上書きせず、WindowsのUser/Machine PATHも変更しない。公式配布ZIPをHTTPSで取得し、同じ公式配布先の `SHASUMS256.txt` とSHA-256を照合してから、次の独立した場所へ展開した。

| 用途 | バージョン | プロジェクトからの場所 |
| --- | --- | --- |
| 標準ビルド・検証 | 22.23.4 | `.cache/node-security/runtimes/node-v22.23.4-win-x64/node.exe` |
| 修正済み24系の代替 | 24.22.1 | `.cache/node-security/runtimes/node-v24.22.1-win-x64/node.exe` |
| プロジェクト専用pnpm | 10.34.7 | `.cache/node-security/tools/node_modules/pnpm/` |

両portable版の `--version` と `process.execPath` を確認済み。pnpmは既存CIと同じ10系を専用cacheへ導入し、Codex配下のpnpm shimが古い同梱Nodeを起動することも回避する。

通常の `node` コマンドは既存24.19.0を選ぶ可能性が残る。このプロジェクトでは、次のlauncherを使用する。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 node --version
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 node -p process.execPath
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 pnpm install --frozen-lockfile
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 pnpm test
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 node scripts/build.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/with-node.ps1 node scripts/serve.mjs
```

`scripts/with-node.ps1` は `.node-version` とportable実体の版を照合し、起動したprocessとその子processに限ってPATHとプロジェクト専用pnpm storeを選択する。終了時に元の環境変数へ復元し、OSの環境変数へ保存しない。指定版のportable実体がなければ停止し、古いNodeへのfallbackは行わない。キャッシュ削除後や別PCで使う場合は、次の手順で用意する。

1. `.node-version` の版に対応するWindows向けZIPと `SHASUMS256.txt` を `https://nodejs.org/dist/v{version}/` から取得する。
2. `Get-FileHash -Algorithm SHA256` で当該ZIPの公式ハッシュと照合する。不一致なら実行・展開しない。
3. `.cache/node-security/runtimes/` へ展開する。x64では `node-v{version}-win-x64/node.exe` になる。
4. 以下をプロジェクトルートで実行し、専用pnpm 10を用意する。`$taskVersion` は `.node-version` から読み、固定値の重複を避ける。

```powershell
$taskVersion = (Get-Content -LiteralPath .node-version -Raw).Trim()
$taskRuntime = Join-Path (Get-Location) ".cache/node-security/runtimes/node-v$taskVersion-win-x64"
& "$taskRuntime/node.exe" "$taskRuntime/node_modules/npm/bin/npm-cli.js" install --prefix .cache/node-security/tools pnpm@10 --no-save --package-lock=false --ignore-scripts --cache .cache/node-security/npm-cache
```

ARM64の場合は対応する公式ZIPと `win-arm64` のパスを使う。今回の実機検証対象はWindows x64。Codex本体の24.19.0の更新は今回実施していない。ここに用意した24.22.1は既存実行ファイルの置換ではなく代替であり、選択しなければ同梱環境の更新にはならない。

## Cloudflare Pagesと公開前の操作

[Cloudflare公式のビルド指定](https://developers.cloudflare.com/pages/configuration/build-image/)では `.node-version` が利用できる。2026-10-22に運営者からProduction/Previewとも `NODE_VERSION` は「未設定」と回答を受領した。環境変数との競合はないという運営者確認に基づき、ファイル指定で公開を進める。エージェント自身による管理画面の直接確認はサインイン要求で未実施。公開後の実使用版はビルドログで別途確認する。

同日、ユーザーから「Node.js更新だけ公開を許可」と明示許可を受領した。対象7ファイルだけを公開し、秘密変数・ドメイン・Analytics・転送・build commandは維持する。新しいビルドログで実際に22.23.4が選ばれたことを確認する。

Pages FunctionsはWorkersの実行基盤で、ビルド用Nodeの版指定によって稼働基盤がNode.js 22へ変わるわけではない。実環境の互換フラグやCloudflare内部の共通Brotliライブラリの修正状況は確認していない。お問い合わせFunctionのコード・route・依存・秘密設定は変更せず、実メール送信は実施しない。

## 検証の現在地

22.23.4とpnpm 10.34.7で固定lockfileからのインストールに成功。既存node_modulesが異なるpnpm major/store由来だったため、最初の一度だけ `--force --store-dir .cache/node-security/pnpm-store` を付けてプロジェクト内へ再導入した。解決処理はskipされ、canvas 1.0.9とPrettier 3.6.2を維持した。

22.23.4で次の検証に成功した。実行ログは `.cache/node-security/` に保存する。

- 標準 `pnpm test`：289件（219+35+24+11）すべて成功。過去段階を検証する既存の隔離fixture運用を維持。
- 現在のデータに対するお問い合わせAPI/UI・OGP・Creatorレイアウト：26件すべて成功。実メール・実Siteverifyは模擬する。
- 通常配置と `/bandori-song-atlas/` 配置のbuild/SEO：両方成功。ガルパ801曲・アワーノーツ89曲、正規URL1,345件・詳細890件・旧曲URL797件・旧Creator URL19件。
- `@napi-rs/canvas` 1.0.9で全OGPを生成。全890楽曲の1200×630画像・参照とアイコンをテストし、日本語・記号・色のサンプル画像をdecodeして確認。
- 現在のデータで直前に生成されていたNode24.19版のdistと、22.23.4で生成したdistの全3,110ファイルを正規化なしで比較し、差分0。HTML・JS・CSS・JSON・PNGを含む。
- 既存と同じWrangler 4.143.0で `pages functions build` 成功。お問い合わせの共有validation、ルーティング、秘密値を読まない構成を維持。
- `pnpm audit --json`：既知の脆弱性は全深刻度0件。これはNode.js本体やCloudflare基盤の監査とは区別する。
- 実ブラウザー：トップの801/89/446表示、横断検索、OurNotes89詳細とCreator導線/担当絞り込み、ガルパ次50件・検索・詳細・条件付き戻り先、お知らせ、両ゲーム/Creator/お知らせの管理画面、Site Keyなしの問い合わせ準備中表示を確認。管理画面のGitHub保存・問い合わせ送信は実行せず、API/UIの送信分岐は模擬テストで検証。確認したconsole errorは0件。

検証runnerのFunctionステップは最初にpnpm dlx非対応の `store-dir` CLIオプションで停止した。初回logを保持し、当該オプションだけを外してコンパイル成功を確認。pnpm dlxはesbuild/workerdのinstall scriptを実行しない旨を警告したが、Functionのコンパイルは成功した。不要な `approve-builds` やアプリの依存更新は行っていない。

失敗経緯：portable初回取得はWindows PowerShellのHTML解析NullReferenceで停止し、終端確認後 `-UseBasicParsing` で再取得成功。launcher初版はPowerShellの共通parameterがNodeの `-p` を消費したため、plain `$args` の転送に変更して `process.execPath` の取得成功を確認した。拒否・未確認事項を隠して完了扱いにしない。

継続監査ではWindows PowerShell 5が `node -e` の引用符を除去する問題も検出した。launcherをネイティブargvの明示的な引用処理へ修正し、stdout/stderrを非同期で転送する。引用符・空引数・日本語・空白・末尾バックスラッシュ・stderr・終了コード7の保持を実機で確認し、現行26テストも再実行して全成功。修正途中のstdout未接続と、検証用PowerShellファイルのUTF-8日本語をANSI解釈した失敗は、stream転送と検証文字列の文字コード生成で対処した。サイト本体のコード・データの修正は不要だった。

終了監査で、開始時1,014ファイルのうち今回の編集対象外がすべて同じSHA-256であることを確認した。既存の未コミット楽曲・Creator・人間レビュー資料を保全し、package/lock・Codex実行ファイル・User/Machine PATH・Git HEAD・空indexを維持した。集約結果は `reports/node-security-update-2026-10-22.json`。24.22.1でも起動パスとcanvasのPNG生成を確認したが、全回帰検証の実行版は22.23.4である。

**ローカルの実装・検証は完了。2026-10-22の明示許可に基づき公開を進行中。** 全体の完了は、修正版によるGitHub/Cloudflareの公開ビルド成功後に判断する。既存Codexの裸の `node` は24.19.0のままなので、このプロジェクトではlauncherを使用する。
