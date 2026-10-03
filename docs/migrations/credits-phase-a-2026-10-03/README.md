# Phase A credit research

884収録の収集・監査のみ。songs/creators/works/roleCoverageへの書込み、commit/push/deployは行わない。

- `node scripts/research/collect-credit-sources.mjs`：公式indexの実hrefを巡回し詳細credit/短いcontextを保存。cacheで再開。
- `node scripts/research/collect-band-credits.mjs`：MyGO公式著作者表記欄を収集。保存済み結果を保持。
- `node scripts/research/credits-phase-a.mjs generate`：保存された一次抽出から資料生成。保全hash gate付き。ネットワークなし。
- `node scripts/research/credits-phase-a.mjs verify`：schema、884参照、raw/provenance、game編曲、候補、source保全を検証。

ゲームMUSICは通常web取得のInternal Error後、実ブラウザーDOMで本文確認。二つともBROWSER_CONFIRMED。396詳細と26index、MyGO著作者表記はHTTP本文。Dream Monster公式作品詳細はbrowser DOM。検索snippetは根拠に使用しない。

`credit-research.json`がrecord正本。rolesごとに原文variant/sourceScope/statusを保存。CONFIRMED件数にはMULTI_SOURCE_CONFIRMEDを含む。raw取得件数には未確定version原文も含む。競合時はscalar rawをnullとして全rawValuesとvariantを保持。作品creditは同一Work参照を明示し、arrangerへ別ゲームの値を転用しない。

source-indexのrecordCountはcreditまたは明示track contextで使用した収録数、investigationRecordCountは探索対象。公式bodyMatchedは対象/候補欄の原文を取得した収録数で、全role確定ではない。source URL使用数はcredit/track contextのあるURL、全426読取URLは別記。

[最終52項目報告](PHASE_A_REPORT.md)、[優先review](credit-review.md)、[未確定全件](unresolved.md)、[composer監査](composer-audit.md)、[conflict全件](conflicts.md)。原文uniqueを人数と解釈しない。
