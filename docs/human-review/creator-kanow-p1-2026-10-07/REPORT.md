# P1 加納望 人間回答適用・検証報告

2026-10-07（日本時間）、回答者：タニマチ。最新repository HEAD e014091046bab48008084a5fa9f01076c5a9f693の台帳・実sourceを確認し、P1が加納望1候補のみ、candidateKey b1-e8ea1c155638e47d4330と10recordが一致してから適用しました。

## 受理・登録

- P1候補1件。主体確認1＋record同一性10＋split10＝21個別判断を受理。全体確認3回答も原本・receiptに保存。所属の追加回答1件を保存。
- 正式Creator：**cr-0126 / 加納望 / nozomu-kanow / person / aliases=[]**。reading/sortKey：かのうのぞむ、sortKeyStatus：confirmed。
- nextIdは現在masterの126から取得。既存IDなし回答により新規登録。125件→126件、nextId126→127。
- 原本の所属欄は引用符内が空で閉じ引用符も異なっていたため、補完せず確認し、「所属は『なし』で確定」という追加回答で解決しました。所属なしはreceiptに保存し、組織Creatorの二重参加へ使用していません。
- 備考は引用符内が空なので未回答のnullを保持。任意欄のため正式登録を妨げる未解決P1必須項目は0。
- 「10収録以外へ自動適用してよい」の回答は保存しました。recordごとの同一性＋split両方の「はい」を必須とする規則、および10record限定の明示ルールに従い、この10曲以外には適用していません。

## 適用範囲

| Garupa ID | 曲 | Work | 共同編曲者 |
| --- | --- | --- | --- |
| 19 | 空色デイズ | wk-0019 | 都丸椋太＋加納望 |
| 20 | Alchemy | wk-0020 | 都丸椋太＋加納望 |
| 21 | カルマ | wk-0021 | 母里治樹＋加納望 |
| 22 | Butter-Fly | wk-0022 | 母里治樹＋加納望 |
| 25 | 魂のルフラン | wk-0025 | 都丸椋太＋加納望 |
| 26 | Hacking to the Gate | wk-0026 | 都丸椋太＋加納望 |
| 29 | Don’t say “lazy” | wk-0029 | 母里治樹＋加納望 |
| 31 | 光るなら | wk-0031 | 都丸椋太＋加納望 |
| 37 | ETERNAL BLAZE | wk-0037 | 都丸椋太＋加納望 |
| 40 | Little Busters! | wk-0040 | 母里治樹＋加納望 |

10/10recordに加納望の編曲relationを適用、split10/10解決。加納望ページは10Work・10record・編曲10、作詞0・作曲0です。

適用前は共同欄全体がunresolvedで、都丸椋太・母里治樹もこの10曲の編曲relationに未登録でした。承認済みの境界・既存masterの氏名/aliasを照合し、都丸椋太の既存cr-0019へ6曲、母里治樹の既存cr-0119へ4曲を紐付けました。既存relation/他roleは保持。追加した正式編曲relationは加納望10＋既存共同者10です。Elements Gardenの組織Creatorを共同編曲者として追加した件数は0。

「／」「/」「（Elements Garden）」の記号・括弧・所属・原文・表示順を完全保持。5310回の原文比較（全885record×3role×両配置）と、両配置の40Creatorリンク、Creatorから10収録へのリンクが成功しました。

## 台帳の更新

| 項目 | before | after |
| --- | ---: | ---: |
| Creator master | 125 | 126 |
| nextId | 126 | 127 |
| Work | 823 | 823 |
| record | 885 | 885 |
| ToDo曲数 | 338 | 332 |
| 曲単位ToDo task数 | 1345 | 1305 |
| Creator候補数 | 345 | 343 |
| SPLIT_REVIEW | 63 | 53 |
| GAME_VERSION_REVIEW | 39 | 39 |
| unresolved record/role | 605 | 595 |
| unmappedCurrentUnresolved | 0 | 0 |

曲別・Creator別JSON/Markdown、summary、verification、READMEの7成果物を再生成しました。解決済みP1候補/登録taskを除外。曲taskの減少40件は同一性10・登録10・split10・共同者role10。Creator側も加納望の6taskと母里治樹の1taskを解決し、旧3354taskは3307継続＋47解決、漏れ0。原3432taskの過去対応までTASK_CORRESPONDENCE.jsonに連鎖保存しています。

未回答の別Creator・別record・歌詞/編曲収集・版関係39等は最新台帳に保持。残存ToDoを完了へ書き換えていません。

## 検証

| 検証 | 結果 |
| --- | --- |
| pnpm test | 264/264成功（198＋35＋24＋7） |
| node scripts/migrations/creator-review-regression.mjs | 旧ToDo/P0/登録31/31成功、元assert保持・SHA確認済み適用前sourceで実行 |
| node --test tests/research/creator-credit-human-todo.test.mjs | 現行ToDo専用10/10成功 |
| node --test tests/research/creator-kanow-registration.test.mjs | 新P1 10/10成功、強化後最終再実行済み |
| 固有テスト総数 | 305件成功（現行ToDo10は上記旧31内の同じtestを追加実行） |
| root build / subpath build | 両方成功 |
| root SEO / subpath SEO | 両方1020正規ページ・885収録・797旧URL・18Creator転送、エラー0 |
| Functions | Wrangler4.143.0 pages functions build成功 |
| 全885公開catalog・Creator・Work | 両配置で現行sourceと一致 |
| duplicate Creator ID / duplicate slug / dangling reference | すべて0 |
| Work identity / unrelated credit / unrelated non-credit変更 | すべて0 |
| Elements Garden二重計上 / 対象外加納望binding | すべて0 |
| 既存migration/human-review資料 | 592ファイルSHA一致（A/B1全452を含む） |
| 再apply / 再generate | source/receipt/7台帳すべてbyte変更0 |
| code Prettier / syntax / git diff --check | 4code整形・構文・tracked/untracked差分checkすべて成功 |

Creator masterは開始beforeからPrettierとの差異があり、最初の差異位置706もbefore/after同一です。無関係箇所の整形を避け、既存styleを保持しました。code4fileはPrettier check対象です。

### 実行コマンド

```powershell
node scripts/migrations/register-kanow-creator.mjs plan
node scripts/migrations/register-kanow-creator.mjs apply
node scripts/migrations/register-kanow-creator.mjs verify
node scripts/research/creator-credit-human-todo.mjs generate
node scripts/research/creator-credit-human-todo.mjs verify
pnpm test
node scripts/migrations/creator-review-regression.mjs
node --test tests/research/creator-credit-human-todo.test.mjs
node --test tests/research/creator-kanow-registration.test.mjs
node scripts/build.mjs
$env:BASE_PATH='/bandori-song-atlas/'
$env:SITE_BASE_PATH='/bandori-song-atlas/'
$env:SITE_OUTPUT_DIR='.cache/kanow-p1-subpath'
node scripts/build.mjs
node scripts/qa/audit-build.mjs dist https://tanimachi-bdsongs.com /
node scripts/qa/audit-build.mjs .cache/kanow-p1-subpath https://tanimachi-bdsongs.com /bandori-song-atlas/
pnpm dlx wrangler@4.143.0 pages functions build functions --outdir .cache/kanow-p1-functions
git diff --check
```

## 差分・証拠・途中失敗

data差分はdata/creators.json（1Creator追加・nextId増分）とdata/garupa/songs.json（指定10曲のcredits/creditDisplayだけ）の2ファイル。data/works.json、data/ournotes/songs.json、両admin-stateはbyte不変。distはbuildで生成し、直接編集していません。UI/Functions製品コード・外部設定・依存を変更していません。

再適用guard、限定field patch、台帳receipt読取・README/proof、旧レビュー回帰runner、新P1 mutation test、原本/追加回答/旧source・台帳gzip/SHA/対応表/verification/validation/WORK_LOGを保存しました。

途中失敗と対処：旧31test用コピーのnested.cache不足を追加。旧台帳の生成HEAD/形式と現HEADの差異による反復test失敗は、コピー内だけ初期generateを行い元assertを保って解消。新testの候補キーmutationが説明文を置換していたため、回答行を置換するよう訂正。母里候補のb1キーを既存cr-0119と4限定recordで照合し、対応表のguard拒否を解消。pnpm exec prettierのbin解決失敗は既存Prettier入口の許可実行で対応。初回master format警告は既存差異と証明し、全体整形をしない判断。untracked no-indexの通常diff exit1を失敗と数えた補助処理は出力/終了code検査へ訂正。原失敗TAP2fileのspace-only行は証拠byteを編集せず、その2fileだけ.gitattributesのwhitespace例外を設定しました。初回/再試行logを保持。

最終auditと現行ToDo testに台帳generateを含むため同時起動が重なりましたが、両方PASS・反復byte不変・保護SHA不変を確認しました。再開時は生成を伴う検証を直列実行します。調査時の不存在file/globはWORK_LOGに記録し実体へ訂正。承認拒否0。

原本：[input.txt](input.txt)、所属追加回答：[clarification.json](clarification.json)、受理・適用：[review.json](review.json)、適用前：[baseline.json](baseline.json)とbefore.json.gz、旧課題対応：[TASK_CORRESPONDENCE.json](TASK_CORRESPONDENCE.json)、監査：[verification.json](verification.json)、コマンド出力：[validation/](validation/)。

**初回ローカル適用時点ではcommit / push / deployは未実施。** HEAD不変、index空。全ローカル成功条件を検証済み。本番反映は今回の対象外です。実ゲームの追加観察・新しいWeb照合は行っておらず、人間回答を根拠として保存しています。

## 公開への追加指示（2026-10-07）

ユーザーが全変更・全テスト/確認完了後のcommit・push・deployを明示許可しました。origin/mainに先行更新は0。既存305固有テスト・両build/SEO・Functions・全5310原文と公開catalogの検証済みSHAを再照合し、変更0を確認。公開後も同じsnapshotを再検証できるよう、初回適用にはexact HEADを要求し、適用後はそのHEADのancestor保持を要求するguardへ変更。台帳は入力SHA不変時に生成基準HEADを保持し、実行中HEAD不変・全出力byte・current入力SHAの検証を継続します。guard/現行ToDo20件＋旧レビュー31件を再実行し全成功。既存src/データ/ビルド入力は前回検証時と同一です。現在：commit/push→同SHA GitHub Actions/Cloudflare/GitHub Pages→本番126Creator/10編曲確認。
