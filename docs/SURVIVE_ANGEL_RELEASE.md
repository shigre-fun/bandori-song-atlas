# 限界現実サバイブ天使の値更新・保存修正 公開記録

公開・本番検証完了：2026-10-13（日本時間）。

製品コミット：`b4a2e75d475e42c2b44dc709c13d869683e808b9`。

[限界現実サバイブ天使（アワーノーツ46）](https://tanimachi-bdsongs.com/ournotes/songs/46/)をユーザー指定の値へ更新した。

- 演奏時間：未確認 → 121秒（表示は`2:01`）
- EASYのノーツ数：268 → 269（レベル8は保持）

楽曲データの変更はこの2値だけで、OurNotesのデータセット更新日時も更新した。既存の担当表記、credits、Work、他の曲、Creator169件を保持した。

登録済み・未登録の担当者が混在する曲で、管理画面が担当別の表示名を共有表示名へ再構成すると、保存処理が担当者の変更と誤判定していた不具合も修正した。Creator IDと担当ごとの実効表示名を比較し、格納形式だけが変わった場合は保存できる。未同定トークンや実際の担当表示の変更は引き続き保護する。人物の追加登録・同定は行っていない。

## 公開結果

同一の製品コミットについて、GitHub Actionsのbuild/deploy、GitHub Pages、Cloudflare Pagesの成功を確認した。

- [GitHub Actions run 38268028673](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/38268028673)
- GitHub Pages deployment：`7017273669`
- Cloudflare Pages deployment：`492cf714-435d-4c1f-ad54-2a30c7680f45`

独自ドメインとGitHub Pagesの各20 HTTPリクエストはすべて200。両方の公開catalogで121秒・269ノーツを確認し、対象詳細ページの演奏時間`2:01`とEASYのレベル8・ノーツ269も確認した。全887曲のcatalogとCreator・Workは検証済み生成物と全フィールド一致した。

保存コードを含む6ファイルは、改行とビルド環境によるキャッシュ番号差だけを正規化して生成物と全文一致。両配信先で対象曲を含む全種類の代表8曲について、全楽曲情報と人物リンクの全文一致を確認した。

本番から取得した保存処理と依存モジュール8件を生成物へ照合してからmockで実行し、対象曲の他項目変更・保存・再読み込みに成功した。実効表示名・Creator ID・未同定トークン・Work・他ゲームを保持し、追加の実GitHub楽曲保存は行っていない。両管理ページはChromeでもゲーム選択・初期化・3編集欄を確認した。

## 公開前検証と保全

最新`a322f5a`の正規管理更新を保持し、指定値への変更後に全277テスト（208 + 35 + 24 + 10）、ビルド、SEO監査（1065ページ・887曲詳細）、書式・差分チェックが成功した。指定2値と更新日時以外の全データを保持し、前回検証した保存修正のソースSHAも一致した。公開は7ファイルだけのコミットで行った。

## ローカル証拠

生成証拠はGit管理外の作業ディレクトリに保存している。

- `reports/survive-publication-guard.json`：277テスト・指定2値・既存データ保全・ソースSHA
- `.cache/survive-publish-change.json`：変更前後と更新日時
- `.cache/survive-publish-status.json`：同一コミットの公開成功
- `.cache/survive-public-http.json`、`.cache/survive-github-pages-http.json`：公開値・コード・全catalog一致
- `.cache/survive-public-details.json`、`.cache/survive-github-pages-details.json`：代表8曲の詳細表示
- `.cache/survive-public-save.json`：配信済みコードの対象曲mock保存
- `.cache/survive-public-browser.json`：両管理画面のChrome確認

終了記録は文書のみのコミットで保存し、公開済み製品コード・データを変更しない。
