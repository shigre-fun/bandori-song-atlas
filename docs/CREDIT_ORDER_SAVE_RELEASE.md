# 担当表示順・未登録担当の保存修正 公開記録

公開・本番検証完了：2026-10-10（日本時間）。

製品コミット：`dd0589b72243ceeb243d02bf9a2f44f131dd4b2a`。

両ゲームの全楽曲詳細を「作詞 → 作曲 → 編曲」の順にし、カバー・エクストラも見出しを「作曲」に統一した。既存の未登録担当者名が複数のトークンで保存されていても、その担当を変更せずに他の楽曲情報を編集・保存できるよう修正した。Creatorの追加登録や人物同定は行っていない。

- [ガルパ楽曲一覧](https://tanimachi-bdsongs.com/garupa/songs/)
- [アワーノーツ楽曲一覧](https://tanimachi-bdsongs.com/ournotes/songs/)
- [夢我夢中](https://tanimachi-bdsongs.com/ournotes/songs/85/)
- [アワーノーツ管理ページ](https://tanimachi-bdsongs.com/admin/?game=ournotes)
- [成功したGitHub Actions](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/37959763728)

## 公開と検証

同一の製品コミットについて、GitHub Actionsのbuild/deploy、GitHub Pages、Cloudflare Pagesの成功を確認した。

- GitHub Actions run：`37959763728`
- GitHub Pages deployment：`6965862042`
- Cloudflare Pages deployment：`2cf97388-643e-41ff-826d-5dbbe589645c`

独自ドメインの全887曲（ガルパ800・アワーノーツ87）をHTTPで取得し、担当欄の順序と旧見出し0件を確認した。全ページの楽曲情報欄は、担当者名・リンク・配信日などを含め検証済み生成物と全文一致した。GitHub Pagesでも全種類を含む代表7曲を確認した。

両配信先の各19 HTTPリクエストはすべて200。公開された全catalog・Creator・Workは検証済み生成物と全フィールド一致し、保存コードと共通詳細rendererを含む6ファイルも、改行とビルド環境のキャッシュ番号差だけを正規化して全文一致した。

本番から取得した保存処理と依存モジュール8件について生成物との全文一致を確認してからmockで実行し、「夢我夢中」の演奏時間変更・保存・再読み込みが成功した。変更は模擬データの演奏時間と保存revisionだけで、担当表記、Creator、Work、他ゲームは保持された。実リポジトリへの楽曲保存は行っていない。

Chromeで両管理ページを開き、指定ゲームの初期化と3つの編集可能な担当欄を確認した。

## 公開前の保全

先行コミット`60035ab14330ffab81d47051bcd5d16a2fa7a255`の「Resound the Way」更新をfast-forwardで取り込んで保持した。更新後データで全273テスト（205 + 35 + 24 + 9）、ビルド、SEO監査（1022ページ・887曲詳細）、書式・差分チェックが成功した。全データ10ファイルのSHAは更新取り込み後のbaselineと一致し、Creator126件の登録状態を維持した。

GitHub Pagesの詳細HTML検証では、サブパスでURLが長くなったため整形による改行差を初回に検出した。検証側でビルドと同じformatter（printWidth 100）を使って期待HTMLを再現し、表示文字列とリンクの全文一致を確認した。製品コードの追加変更はない。初回失敗ログとWindows Nodeの終了時assertを保存した。

## ローカル証拠

生成証拠はGit管理外の作業ディレクトリに保存している。

- `reports/credit-order-publish-verification.json`：273テスト・全887生成ページ・データ保全・ソースSHA
- `.cache/credit-order-publish-status.json`：同一コミットの公開成功
- `.cache/credit-order-public-http.json`、`.cache/credit-order-github-pages-http.json`：公開コード・全catalog一致
- `.cache/credit-order-public-details.json`：本番全887曲の表示順・楽曲情報一致
- `.cache/credit-order-github-pages-details.json`：サブパスの代表7曲
- `.cache/credit-order-public-save.json`：配信済みコードの夢我夢中mock保存
- `.cache/credit-order-public-browser.json`：両管理画面のChrome確認

終了記録は文書のみのコミットで保存し、公開済み製品コード・データを変更しない。
