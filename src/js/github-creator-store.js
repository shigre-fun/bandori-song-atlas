import { GitHubStore } from "./github-store.js";
import { GAMES } from "./site-config.js";
import { listGarupaSongs } from "./garupa-data.js";
import {
  CREATORS_PATH,
  WORKS_PATH,
  CREDIT_ROLES,
  validateCreatorDatabase,
  validateCreators,
  creditText,
} from "./creators-data.js";
export class GitHubCreatorStore extends GitHubStore {
  async loadCreators() {
    const snapshot = await this.snapshot();
    const data = validateCreators(await this.readJSON(snapshot, CREATORS_PATH));
    return {
      data,
      sha: snapshot.entries.find((e) => e.path === CREATORS_PATH)?.sha,
    };
  }
  async loadCreatorDatabase(snapshot = null) {
    snapshot ??= await this.snapshot();
    const creators = await this.readJSON(snapshot, CREATORS_PATH),
      works = await this.readJSON(snapshot, WORKS_PATH);
    const documents = Object.fromEntries(
      await Promise.all(
        Object.values(GAMES).map(async (g) => [
          g.id,
          await this.readJSON(snapshot, g.dataFile),
        ]),
      ),
    );
    const songs = Object.values(GAMES).flatMap((g) =>
      listGarupaSongs(documents[g.id], g.id).map((s) => ({
        ...s,
        gameId: g.id,
      })),
    );
    validateCreatorDatabase(creators, works, songs);
    return { snapshot, creators, works, documents, songs };
  }
  async saveCreator({
    creator = null,
    deleteId = null,
    expectedSha,
    operationId,
  }) {
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(operationId ?? ""))
      throw new Error("送信識別子が不正です。");
    const database = await this.loadCreatorDatabase();
    const { snapshot, creators, works, documents } = database;
    if (creators.lastOperationId === operationId)
      return { head: snapshot.head, data: creators, alreadySaved: true };
    if (
      !expectedSha ||
      snapshot.entries.find((e) => e.path === CREATORS_PATH)?.sha !==
        expectedSha
    )
      throw new Error(
        "Creator masterが更新されています。最新データを読み直してください。上書きは行っていません。",
      );
    const existing = creator?.id
      ? creators.creators.find((c) => c.id === creator.id)
      : null;
    if (deleteId) {
      if (!creators.creators.some((c) => c.id === deleteId))
        throw new Error("削除するCreatorが見つかりません。");
      const references = database.songs.filter((s) =>
        s.credits.some((c) => c.creatorId === deleteId),
      );
      if (references.length)
        throw new Error(
          `このクリエイターは${new Set(references.map((s) => s.workId)).size}曲（${references.length}収録）から参照されているため削除できません。`,
        );
      if (
        creators.creators.find((c) => c.id === deleteId).previousSlugs?.length
      )
        throw new Error(
          "旧URL履歴を持つCreatorは削除できません。転送先と履歴を保持してください。",
        );
      creators.creators = creators.creators.filter((c) => c.id !== deleteId);
    } else {
      if (!creator || (creator.id && !existing))
        throw new Error(
          "編集対象Creatorが見つかりません。固定IDは変更できません。",
        );
      const next = {
        ...(existing ?? {}),
        ...creator,
        id: existing?.id ?? `cr-${String(creators.nextId++).padStart(4, "0")}`,
      };
      if (existing) {
        if (
          creator.previousSlugs !== undefined &&
          JSON.stringify(creator.previousSlugs) !==
            JSON.stringify(existing.previousSlugs ?? [])
        )
          throw new Error("旧slug履歴は通常編集で変更できません。");
        const history = [...(existing.previousSlugs ?? [])];
        if (next.slug !== existing.slug) history.push(existing.slug);
        if (history.length) next.previousSlugs = history;
        else delete next.previousSlugs;
      } else if (creator.previousSlugs?.length) {
        throw new Error("新規Creatorに旧slug履歴は登録できません。");
      }
      if (existing)
        creators.creators[creators.creators.indexOf(existing)] = next;
      else creators.creators.push(next);
    }
    creators.lastOperationId = operationId;
    validateCreators(creators);
    // Canonical nameの変更は、overrideのないrelationのdeprecated文字列だけ更新する。
    const changed = [];
    for (const g of Object.values(GAMES)) {
      let modified = false;
      for (const group of documents[g.id].groups)
        for (const s of group.songs)
          for (const role of CREDIT_ROLES) {
            const display = creditText(s, role, creators.creators) || null;
            if ((s[role] ?? null) !== display) {
              s[role] = display;
              modified = true;
            }
          }
      if (modified)
        changed.push({
          path: g.dataFile,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(documents[g.id], null, 2) + "\n",
        });
    }
    const songs = Object.values(GAMES).flatMap((g) =>
      listGarupaSongs(documents[g.id], g.id).map((s) => ({
        ...s,
        gameId: g.id,
      })),
    );
    validateCreatorDatabase(creators, works, songs);
    const tree = await this.request("/git/trees", "POST", {
      base_tree: snapshot.tree,
      tree: [
        {
          path: CREATORS_PATH,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(creators, null, 2) + "\n",
        },
        ...changed,
      ],
    });
    const commit = await this.request("/git/commits", "POST", {
      message: deleteId
        ? `Delete creator: ${deleteId}`
        : `Save creator: ${creator.name}`,
      tree: tree.sha,
      parents: [snapshot.head],
    });
    await this.request(
      `/git/refs/heads/${this.settings.branch.split("/").map(encodeURIComponent).join("/")}`,
      "PATCH",
      { sha: commit.sha, force: false },
    );
    return { head: commit.sha, data: creators, alreadySaved: false };
  }
}
