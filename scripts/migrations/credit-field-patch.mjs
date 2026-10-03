import assert from "node:assert/strict";

// Structural JSON locations, rather than name/id regex replacement. Preserve every byte outside credit values.
export function locateJSON(text) {
  let i = 0;
  const ws = () => {
    while (/\s/.test(text[i] ?? "") && i < text.length) i++;
  };
  function value() {
    ws();
    const start = i,
      c = text[i];
    if (c === "{") {
      i++;
      ws();
      const properties = new Map();
      while (text[i] !== "}") {
        const key = value();
        assert.equal(key.type, "string");
        ws();
        assert.equal(text[i++], ":");
        const child = value();
        properties.set(JSON.parse(text.slice(key.start, key.end)), child);
        ws();
        if (text[i] !== ",") break;
        i++;
        ws();
      }
      assert.equal(text[i++], "}");
      return { type: "object", start, end: i, properties };
    }
    if (c === "[") {
      i++;
      ws();
      const children = [];
      while (text[i] !== "]") {
        children.push(value());
        ws();
        if (text[i] !== ",") break;
        i++;
        ws();
      }
      assert.equal(text[i++], "]");
      return { type: "array", start, end: i, children };
    }
    if (c === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i++] === '"') break;
      }
      return { type: "string", start, end: i };
    }
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
    assert.ok(i > start, "JSON value");
    return { type: "primitive", start, end: i };
  }
  const root = value();
  ws();
  assert.equal(i, text.length, "JSON trailing data");
  return root;
}
export function patchCreditFields(text, patches) {
  return patchSongFields(text, patches, [
    "lyricist",
    "composer",
    "arranger",
    "credits",
    "creditDisplay",
  ]);
}
// Used only for the explicitly reviewed parallel publication, with a bounded field allowlist.
export function patchSongFields(text, patches, allowedFields) {
  const root = locateJSON(text),
    edits = [],
    found = new Set();
  const visit = (node) => {
    if (node.type === "object") {
      const p = node.properties;
      if (p.has("id") && p.has("title") && p.has("workId")) {
        const current = JSON.parse(text.slice(node.start, node.end));
        const patch = patches.get(current.id);
        if (patch) {
          assert.equal(current.title, patch.title, "CONFLICT title");
          assert.equal(current.workId, patch.workId, "CONFLICT workId");
          found.add(current.id);
          const missing = [];
          for (const [key, v] of Object.entries(patch.fields)) {
            assert.ok(allowedFields.includes(key));
            const child = p.get(key);
            if (child) {
              if (JSON.stringify(current[key]) === JSON.stringify(v)) continue;
              const lineStart = text.lastIndexOf("\n", child.start) + 1;
              const indent = text
                .slice(lineStart, child.start)
                .match(/^\s*/)[0];
              edits.push({
                start: child.start,
                end: child.end,
                value: JSON.stringify(v, null, 2).replaceAll(
                  "\n",
                  "\n" + indent,
                ),
              });
            } else missing.push([key, v]);
          }
          if (missing.length) {
            const indent =
              text
                .slice(text.lastIndexOf("\n", node.start) + 1, node.start)
                .match(/^\s*/)[0] + "  ";
            const last = [...p.values()].at(-1);
            edits.push({
              start: last.end,
              end: last.end,
              value: missing
                .map(
                  ([k, v]) =>
                    ",\n" +
                    indent +
                    JSON.stringify(k) +
                    ": " +
                    JSON.stringify(v, null, 2).replaceAll("\n", "\n" + indent),
                )
                .join(""),
            });
          }
        }
      }
      for (const child of p.values()) visit(child);
    } else if (node.children) node.children.forEach(visit);
  };
  visit(root);
  assert.equal(found.size, patches.size, "CONFLICT missing record");
  edits.sort((a, b) => b.start - a.start);
  let output = text;
  for (const e of edits)
    output = output.slice(0, e.start) + e.value + output.slice(e.end);
  JSON.parse(output);
  return { text: output, edits: edits.length };
}
