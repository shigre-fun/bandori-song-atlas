# クリエイター個人ページの一覧表示

2026-10-17 本番公開・公開後検証完了。

製品コミット：`3cf23899458b58d462bb9e84a45d0f7c25d4fc3b`。

[織田あすかの参加楽曲](https://tanimachi-bdsongs.com/creators/asuka-oda/)で公開済み。

参加楽曲は収録曲ごとに次の2行で表示する。

1. 太字のタイトルリンクと、右端の担当（作詞・作曲・編曲）。
2. ゲーム名の背景付きラベルと、バンド名。ガルパは赤、アワーノーツは青。バンド名の左線は楽曲検索と同じ `bandColor` と `.band` を使用する。

重複するWork見出し・バンド・担当の段を省き、320・390・768・1280px幅で各行のカード高は70px。長いタイトル・バンド名は1行の省略表示にし、タイトル全文はリンクのテキストとtitle属性に保持する。

50曲を超える一覧は、絞り込み後の収録曲を50件ずつ表示する。同じWorkの複数収録も各楽曲ページへのリンクを保持し、上部の参加楽曲数・収録件数の定義は維持する。既存の楽曲検索と同じページ番号ウィンドウ・スタイルを使い、担当・ゲームの条件をページリンクへ引き継ぐ。絞り込み変更は1ページ目へ戻し、URLのpage指定とブラウザーの戻る・進むに対応する。

全ページのヘッダーは「ガルパ」「アワーノーツ」「クリエイター」「お知らせ」の順。専用ヘッダーの3管理ページにも同じサイト内ナビゲーションを追加した。サイトについてはフッターから引き続き開ける。

## 検証

- 全351テスト成功（canonical 219 + 35 + 24 + 11、レビュー回帰 13 + 31 + 10 + 8）。新規4テストは2行の構造・担当とリンク・ゲーム色・全バンドの検索色一致・0/1/49/50/51/100/101件の境界・不正page指定・条件保持・全公開ヘッダーを検証する。
- 通常配置と `/bandori-song-atlas/` の両ビルド成功。両SEO監査は1268ページ・888曲詳細・18 Creator旧URL転送を検証。
- 両配置の全371 Creatorで1,940件の収録リンク・全タイトル・担当・ゲーム色・バンド線色・Work対応・初期50件を照合。ヘッダーは管理ページを含む各1,273ページで文言・順序・リンク先一致。
- 両配置の隔離Chromeで4幅すべて横はみ出し0、タイトル太字・担当右端・2行・高さ70pxを確認。織田あすかの272収録で次の50件、戻る・進む、ゲーム変更時のページリセット、担当とゲームの複合条件、ページ上限、実タイトルクリックと楽曲ページからの戻る、Creator検索を確認。
- 管理3ページも両配置・320/390/1280pxの計18条件で4リンク・横はみ出し0・実行時エラー0を確認。管理画面の390px画像も目視確認。
- 390px・1280pxの画像を目視確認。全データ10ファイルのSHAは作業開始時と一致し、Creator371・Work826・888曲を保持。

## 証拠

生成証拠はGit管理外のローカル作業ディレクトリに保存する。

- `reports/creator-compact-verification.json`：最終ソースSHA・全テスト・データ保全・要件監査
- `reports/creator-compact-root-audit.json`、`reports/creator-compact-subpath-audit.json`：全Creator・全公開ヘッダー照合
- `reports/creator-compact-browser.json`、`reports/creator-compact-subpath-browser.json`：実ブラウザーの4幅と操作
- `reports/creator-compact-admin-browser.json`：管理3ページの両配置・3幅
- `reports/creator-compact-390.png`、`reports/creator-compact-1280.png`：実画面
- `.cache/creator-compact-*.log`：ビルド・SEO・対象テスト・全回帰の原ログ

補助QAでは実曲名の全角ハイフン、スクロールバー幅、PrettierのHTMLタグ改行、管理用フッターの違いに合わせて検証helper・テスト条件を修正した。並行ビルドの画像生成でメモリ不足が発生したため、直列実行へ変更して両ビルドと最終全回帰を完了した。初回失敗と対処はWORK_LOGに記録した。

## 本番公開の確認

同じ製品コミットの[GitHub Actions 38996712607](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/38996712607)のbuild・deploy、GitHub Pages deployment `7133891106`、Cloudflare Pages deployment `3d4ca725-bc99-45ce-94de-4a8ce599c0f7`の成功を確認した。

独自ドメインとGitHub Pagesで各29 HTTPすべて200。全888曲・Creator371・Work826を検証済み生成物へ全値照合し、JS/CSS 11ファイルも改行とビルドキャッシュ番号だけを正規化して全文一致した。追加の管理更新はなく、公開前に検証済み12ソース・全原ログのSHAが一致したため、ローカルの全351テストを重複実行せず、公開側のbuild/test成功を確認した。

両配信先の各1,273ページについてヘッダー全文、Creator一覧と全371個人ページについて本文全文を生成物へ照合した。1,940件の参加曲リンク・担当・ゲーム色・バンド線色・初期50件を含む本文すべてが一致し、HTTP再試行・照合失敗は0件だった。

隔離Chromeで両本番サイトを実際に開き、320・390・768・1280pxの2行表示・太字タイトル・担当右端・70px高・横はみ出し0、50曲ページ移動、条件保持、絞り込み変更、戻る・進む、タイトルクリック、楽曲からの戻る、Creator検索を確認した。管理3ページも両配信先の3幅、計18条件で成功し、実行時エラー0。専用プロファイルとプロセスは終了済み。

公開証拠は `.cache/creator-layout-publication.json`、`creator-layout-publish-status.json`、`creator-layout-public-http.json`、`creator-layout-pages-http.json`、`creator-layout-{primary,pages}-all-pages.json` と各原ログ、および `reports/creator-layout-{primary,pages}-browser.json`、`creator-layout-{primary,pages}-admin-browser.json` と画面画像に保存した。楽曲・Creator・Workの追加編集は行っていない。
