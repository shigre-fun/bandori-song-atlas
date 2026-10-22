# Creator・クレジット更新の公開記録

人間確認済みの残375タスクと、OurNotes:89「アイライク・ユアライク」の最終6タスクを反映する。Creatorは371件から446件へ増加し、人間ToDoは曲数・タスク数・候補数とも0、未対応の未解決項目も0となった。

- 新規Creator75件。重複候補は承認済みの既存IDへ統合し、cr-0372〜cr-0446を維持。
- 残375回答による206件と最終6回答による3件、合計209件の担当関係を追加。
- 「アイライク・ユアライク」は牧野太洋（cr-0375）へ作詞・作曲・編曲を関連付け。
- 890収録のクレジット原文2670欄、Work identity、既存関係を保全。ナユタン星人の承認済みslug変更は旧URLから転送。

Node.js更新後の22.23.4で再検証してから通常のGit連携で公開する。Codex同梱のNode.jsとOSのPATHは変更しない。

## 公開前の確認

Node.js 22.23.4で標準289件、人間レビュー82件、問い合わせ・画像・レイアウト26件の計397テストが成功。ルートとサブパスのビルド、SEO（1345ページ・890詳細）、全446 Creator・全890収録の表示、Functions compile（Wrangler 4.143.0）、14ソースの整形確認も成功した。過去のレビュー資料274ファイルは元のバイト列を維持し、今回の検証証拠は別ディレクトリへ保存した。既存のページ監査が歴史資料へ出力するため、今回の出力を新ディレクトリへ退避して歴史資料の元バイト列を復元した。

検証結果と公開状況は [verification.json](human-review/creator-credits-publication-2026-10-22/verification.json)、原ログは同ディレクトリの `validation/` に記録する。

## 公開状況

製品commit `24bfd5e6687cd6140c37253846dc2efba4183e2c` をmainへcommit・pushし、同じSHAの [GitHub Actions 39712793626](https://github.com/shigre-fun/bandori-song-atlas/actions/runs/39712793626) のbuild/deploy、Cloudflare Pages、GitHub Pagesがすべて成功した。[本番サイト](https://tanimachi-bdsongs.com/)へ反映済み。

GitHubの実buildログで `.node-version` の22.23.4解決と `node: v22.23.4` を確認した。Cloudflareは同じ `.node-version` 設定で今回のcheck成功を確認したが、今回のCloudflare内部buildログは直接閲覧していない。同日先行したNode更新時の運営者提供ログと、今回の成功checkを区別して記録する。

- 本番・Cloudflare標準ホスト・GitHub Pagesの各36項目、計108 HTTP確認が成功。全カタログ、11モジュール、画像・アイコンが検証済みビルドと一致。
- 本番とGitHub Pagesの各890曲詳細、各446 Creatorの本文・表示原文・リンクを全件比較し一致。
- OGP画像3件は1200×630、Twitter画像・canonicalが一致。robots・sitemap全文、検索noindex、404、ナユタン星人を含む旧slugの301転送も成功。
- 人間ToDoは全0、全11データと14対象ソースの検証時SHA、過去274レビュー資料の元バイト列を再確認。実際の問い合わせ送信は行っていない。

公開後のJSON・原ログは同ディレクトリの `publication/` に保存した。終了記録だけをskip CIの文書commitで同期し、製品の再デプロイは行わない。今回の再検証・公開確認で失敗や自動承認拒否は発生しなかった。過去作業の失敗・回復記録は既存資料に保持している。
