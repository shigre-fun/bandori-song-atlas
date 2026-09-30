import { GitHubStore } from "./github-store.js";
import { prepareNews } from "./news-data.js";

export const NEWS_PATH = "data/news.json";

const newsFile = (snapshot) => {
  const file = snapshot.entries.find(
    (entry) => entry.path === NEWS_PATH && entry.type === "blob",
  );
  if (!file) throw new Error(`${NEWS_PATH}が見つかりません。`);
  return file;
};

export class GitHubNewsStore extends GitHubStore {
  async loadNews() {
    const snapshot = await this.snapshot();
    const file = newsFile(snapshot);
    const entries = prepareNews(await this.readJSON(snapshot, NEWS_PATH));
    return { entries, sha: file.sha };
  }

  async saveNews({ entry, index = null, expectedSha }) {
    const validated = prepareNews([entry])[0];
    if (typeof expectedSha !== "string" || !expectedSha)
      throw new Error("先にGitHubから最新のお知らせを読み込んでください。");
    const snapshot = await this.snapshot();
    const file = newsFile(snapshot);
    if (file.sha !== expectedSha)
      throw new Error(
        "GitHub上のデータが更新されています。最新データを読み直してください。上書きは行っていません。",
      );
    const entries = prepareNews(await this.readJSON(snapshot, NEWS_PATH));
    if (
      index !== null &&
      (!Number.isSafeInteger(index) || index < 0 || index >= entries.length)
    )
      throw new Error(
        "編集対象のお知らせが見つかりません。最新データを読み直してください。",
      );
    if (index === null) entries.push(validated);
    else entries[index] = validated;
    const next = prepareNews(entries);
    const tree = await this.request("/git/trees", "POST", {
      base_tree: snapshot.tree,
      tree: [
        {
          path: NEWS_PATH,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(next, null, 2) + "\n",
        },
      ],
    });
    const commit = await this.request("/git/commits", "POST", {
      message: `${index === null ? "Add" : "Update"} news: ${validated.title}`,
      tree: tree.sha,
      parents: [snapshot.head],
    });
    try {
      await this.request(
        `/git/refs/heads/${this.settings.branch.split("/").map(encodeURIComponent).join("/")}`,
        "PATCH",
        { sha: commit.sha, force: false },
      );
    } catch (error) {
      if (error.status === 409 || error.status === 422)
        throw new Error(
          "GitHubへの更新が競合したか、ブランチで拒否されました。最新データを読み直してください。上書きは行っていません。",
        );
      throw error;
    }
    return { head: commit.sha, entries: next };
  }
}
