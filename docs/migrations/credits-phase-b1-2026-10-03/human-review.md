# Phase B1 人間レビュー

2026-10-03。ユーザー添付0b9ba143の明示確認を保存。sourceType=human-review。Webの一次資料とは区別する。正式適用は行わずPhase A履歴を保持する。

## human-mela

対象：ournotes:75

小林 壱誓をcomposerとしたPhase A結果はrole取り違え。現composer peppe／穴見真吾を正しいと確認し、削除・置換提案を禁止。

`roles`: {"lyricist":["長屋晴子","小林壱誓"],"composer":["peppe","穴見真吾"]}

`sameIdentity`: null

## human-flower

対象：garupa:176, garupa:218, garupa:738

作曲欄と編曲欄の連結/role解析によるPhase A conflictを解消。FULL/パラレルを含む。竹田祐介をcomposerへ計上しない。

`roles`: {"composer":["末益涼太"],"arranger":["竹田祐介"]}

`sameIdentity`: null

## human-samfree

対象：garupa:249

同一人物をユーザーが確定。現masterで該当既存IDの有無を調べ、旧表示は将来も維持。

`roles`: null

`sameIdentity`: ["SAM(samfree)","samfree"]

## human-sasunso

対象：ournotes:14

所属を主体から分離。CURRENT_MISSINGの共同作曲者なし補完候補、会社の二重計上禁止。

`roles`: {"composer":["槇島隆人"]}

`sameIdentity`: null

## human-symbol-earth

対象：ournotes:33

共同作曲2主体。長谷川大介は既存IDへ統合、会社の二重計上禁止。

`roles`: {"composer":["長谷川大介","Diggy-MO'"]}

`sameIdentity`: null

## human-carnation

対象：ournotes:66

同一人物名義差を人間レビューで解消、瀬名水紀は既存ID。発売版編曲をOurNotesゲーム版へ昇格しない。

`roles`: {"lyricist":["Aira"],"composer":["瀬名水紀","Aira"]}

`sameIdentity`: [["Aira(Dream Monster)","Aira"],["瀬名水紀(Dream Monster)","瀬名水紀"]]

所属括弧とcredit主体を分離し、会社を二重計上しない。OurNotesゲーム版編曲は現在の確定5件だけを対象にする。既存91ID、nextId92、songs/works/master/公開coverage/UIを保持。短名はrecord scopeで照合する。
