# Creator区切り編集・スマホ表示 公開記録

公開・本番確認完了：2026-10-16（日本時間）。

製品コミット：`b72a22358fe0e3bd8cdfd6ecdfafda17b833cbcc`。

両ゲームの管理ページで、同じ担当に選択したCreator間の区切りを編集できるようにした。「、」「, 」「・」「 / 」などの記号と空白を保持し、Creator ID・表示名・リンクを保持して保存、再読み込み、下書き復元、並べ替えに対応する。未同定者の名前を区切りとして書き換える操作は拒否する。

スマートフォンの選択済みCreator欄を「担当・名前」「表示名の上書きと入力」「前へ・後へ・削除」の3段に変更した。390px幅で上書き入力幅は26pxから219.83pxへ、4行の一覧高は996.63pxから529.94pxへ改善した。

## 公開結果

同じ製品コミットについて、以下の成功をAPIで確認した。

- [GitHub Actions 38905567915](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/38905567915)：build・deploy成功
- GitHub Pages deployment：`7119787910`、success
- Cloudflare Pages deployment：`73d177b9-cc60-485b-a6e5-8cfb348d659d`、success

[独自ドメイン管理ページ](https://tanimachi-bdsongs.com/admin/)と[アワーノーツ管理ページ](https://tanimachi-bdsongs.com/admin/?game=ournotes)を公開済み。独自ドメインとGitHub Pagesで各20 HTTPすべて200、両管理ページの3編集欄・区切り用コンテナと候補を確認した。配信されたJS/CSS 7ファイルは、改行とビルド環境のキャッシュ番号だけを正規化して検証済み生成物と全文一致した。全888曲（ガルパ800・アワーノーツ88）とCreator169・Work826も全値一致した。

本番から取得した9モジュールを生成物と照合して実行し、実データ「神の名を」の作曲区切り4種類でmock保存・再読み込みに成功した。担当者ID、他の担当、他の楽曲情報、Creator・Work・他ゲームを保持し、実GitHubへの追加楽曲保存は行っていない。

隔離Chromeで本番の両管理ページが指定ゲームで初期化され、3欄が編集可能であることを確認した。さらに本番配信と一致を確認したpicker・依存JS・CSSを専用ローカルQAで実行し、320・390・600・1280px全幅で区切り入力、空白、空の区切り、リンク保持、下書き、上書き入力、スマホ3段表示、横はみ出し0を確認した。比較画像も目視確認し、専用ブラウザープロファイルとQAサーバーは終了した。

## 公開前検証と保全

既に完了していた285テスト（215 + 35 + 24 + 11）、ビルド、SEO監査（1066ページ・888曲詳細）、4幅の実画面検証について、最終10ソースのSHAと生成物が今回の公開内容に一致することを再確認した。公開直前のfetchで先行更新はなく、全データ10ファイルのSHAも検証時から不変。再度の全ローカルテストは省略し、自動公開側のbuild/test成功も確認した。公開コミットは11ファイルに限定した。

追加QAの初回mockでは、検証helperが4操作に同一operationIdを使用したため、正常な重複保存抑止によって2回目の確認が失敗した。helperだけを操作ごとの一意IDへ修正し、4種類すべて成功した。製品修正や再デプロイは不要だった。失敗履歴はWORK_LOGとローカル証拠に保持した。

## ローカル証拠

生成証拠はGit管理外の作業ディレクトリに保存している。

- `reports/credit-separators-verification.json`：285テスト・検証済みソースSHA・データ保全
- `reports/credit-separators-browser-verification.json`：公開前の4幅画面検証
- `.cache/separator-publish-status.json`：同SHAの公開成功
- `.cache/separator-public-http.json`、`.cache/separator-github-pages-http.json`：各20 HTTP・全catalog/master・7コード一致
- `.cache/separator-public-save.json`：本番9モジュールによる区切り4種類のmock保存
- `.cache/separator-public-browser.json`：本番の両管理画面初期化
- `reports/separator-production-browser-verification.json`、`reports/separator-production-390.png`：本番確認済み配信コードによる4幅操作・表示検証
- `.cache/separator-public-save-first.log`：初回helperの履歴（詳細原因はWORK_LOG記載）

終了記録は文書のみのskip CIコミットで同期し、公開済み製品への追加差分を作らない。
