# Phase B1 Creator identity normalization

正本入力は変更しないPhase A（docs/migrations/credits-phase-a-2026-10-03）、baseline.json、human-review.json、identity-evidence.json。

再生成：

`node scripts/research/credits-phase-b1.mjs generate`

検証：

`node scripts/research/credits-phase-b1.mjs verify`

raw-token-mapはraw+roleにoccurrencesを持ち、元原文と暫定splitを保存。normalized-recordsは人間override後のrecord、creator-identity-researchはrole横断identity index。CONFIRMEDでも短名はrecord scopeを持つ。candidateKeyは正式IDではない。

B2はphase-b2-package.jsonのrecord別CONFIRMEDだけを扱う。新Creatorはid=null、既存IDは固定、未確定除外を必ず読む。raw単位で短名を全recordにglobal解決しない。displayOverrideCandidatesを含め旧表示を保存する。aliasは実raw/一次活動名のみ。所属は参加ではない。OurNotes編曲は5baselineだけ。公開役割coverageはunprepared/ready/unpreparedのまま。

Phase B1はsongs/master/Work/UI write0、commit/push/deploy0。検証結果と54項目はPHASE_B1_REPORT.md・verification.jsonへ保存。
