# 管理ページの作詞・作曲・編曲欄 公開記録

公開・本番検証完了：2026-10-09（日本時間）。終了記録：2026-10-10。

製品コミット：`4fc0c72898b8579f8866dbef211f8aac0e34dcd1`。

ガルパ・アワーノーツの楽曲編集フォームに、作詞者・作曲者・編曲者を個別に入力できる欄を追加した。既存値の読み込み、ゲーム別下書き、再読み込み、保存後の再編集に対応。直接入力で書き換えた担当だけ既存の人物リンクを外し、入力文字列を未同定の表記として保存する。他の担当は保持し、登録済みCreatorを明示的に選んで関連付けることもできる。

- [ガルパ管理ページ](https://tanimachi-bdsongs.com/admin/)
- [アワーノーツ管理ページ](https://tanimachi-bdsongs.com/admin/?game=ournotes)
- [成功したGitHub Actions](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/37947421258)

## 公開結果

同一の製品コミットについて、GitHub Actionsのbuild/deploy、GitHub Pages、Cloudflare Pagesの成功を確認した。

- GitHub Actions run：`37947421258`
- GitHub Pages deployment：`6963750124`
- Cloudflare Pages deployment：`f9119ede-f572-415c-8614-4c11a03fcccf`

独自ドメインとGitHub Pagesの各18 HTTPリクエストはすべて200。両管理ページの3つの編集可能な入力欄とnoindexを確認した。公開された4つのJSONは検証済み生成物と全フィールド一致し、ガルパ800曲・アワーノーツ87曲、Creator、Workを確認した。JavaScript・CSSの5ファイルは、改行とビルド環境によるキャッシュ番号差だけを正規化して全文一致を確認した。

独自ドメインをChromeで開き、両ゲームの管理画面初期化と3欄の編集可能状態を実DOMで確認した。本番での楽曲保存操作は行っていない。保存と再編集はmockによる回帰テストで検証した。

## 公開前検証とデータ保持

全269テスト（203 + 35 + 24 + 7）、ビルド、SEO監査（1022ページ・887曲詳細）、対象ファイルの書式と差分チェックが成功した。ローカルChromeでは1280px・390pxの画面、入力、ゲーム切り替え、再読み込みによる下書き復元を確認した。

公開前に先行していた6つの楽曲更新を取り込み、全887曲の既存フィールドとグループ、既存823件のWork、Creator、管理採番値を保持した。新曲「Sky full of Miracle」「Odd Dice」に不足していたworkId・credits・creditDisplayと独立Work2件だけを追加した。人物の同定は推測していない。

最初のビルドは上記新曲の不足構造により停止し、限定修復後に成功した。また、歴史データの回帰テストで現行の採番値を参照していた1件が失敗したため、隔離した歴史fixture内だけ採番値を歴史データに合わせた。実際の管理採番値と既存assertは変更せず、再実行で全件成功した。

## ローカル検証証拠

生成証拠はGit管理外の作業ディレクトリに保存している。

- `reports/admin-credits-publish-guard.json`：対象差分・269テスト・データ保持
- `.cache/admin-credits-publish-status.json`：同一コミットの公開成功
- `.cache/admin-credits-public-http.json`：独自ドメインのHTTP・コード・データ一致
- `.cache/admin-credits-github-pages-http.json`：GitHub PagesのHTTP・コード・データ一致
- `.cache/admin-credits-public-browser.json`：両ゲームの本番Chrome確認
- `reports/admin-credits-browser-verification.json`：ローカル画面・下書き確認

この終了記録の保存は文書のみのコミットとし、公開済み製品コード・データを変更しない。
