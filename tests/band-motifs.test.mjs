import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { BAND_THEMES } from "../src/js/band-theme.js";

async function raster(id) {
  const source = fs.readFileSync(`src/images/bands/${id}.svg`, "utf8");
  assert.doesNotMatch(source, /NaN|Infinity|<script|(?:href|src)=/i);
  const image = await loadImage(
    Buffer.from(
      source
        .replace("<svg ", '<svg width="300" height="300" ')
        .replaceAll("currentColor", "#000"),
    ),
  );
  const canvas = createCanvas(300, 300),
    context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, 300, 300).data;
  return { source, alpha: (x, y) => data[(y * 300 + x) * 4 + 3] };
}

test("all twelve curved band motifs render with complete unclipped silhouettes", async () => {
  for (const theme of BAND_THEMES) {
    const { source, alpha } = await raster(theme.id);
    assert.match(source, /C[-\d]/, theme.id + " has vector curves");
    let occupied = 0;
    for (let y = 0; y < 300; y++)
      for (let x = 0; x < 300; x++) {
        if (alpha(x, y) > 127) occupied++;
        if (x === 0 || y === 0 || x === 299 || y === 299)
          assert.equal(alpha(x, y), 0, theme.id + " is clipped");
      }
    assert.ok(occupied > 3000, theme.id + " has a visible silhouette");
  }
});

test("the star points straight up and the butterfly is vertically symmetric", async () => {
  for (const id of ["poppinparty", "morfonica"]) {
    const { alpha } = await raster(id);
    let difference = 0,
      coverage = 0;
    for (let y = 0; y < 300; y++)
      for (let x = 0; x < 150; x++) {
        difference += Math.abs(alpha(x, y) - alpha(299 - x, y));
        coverage += alpha(x, y) + alpha(299 - x, y);
      }
    assert.ok(difference / coverage < 0.005, id + " mirror mismatch");
    if (id === "poppinparty") {
      const rows = Array.from({ length: 300 }, (_, y) =>
        Array.from({ length: 300 }, (_, x) => x).filter(
          (x) => alpha(x, y) > 127,
        ),
      );
      const tip = rows.find((row) => row.length);
      assert.ok(
        Math.abs((tip[0] + tip.at(-1)) / 2 - 149.5) < 1,
        "top tip lies on vertical centerline",
      );
      assert.ok(tip.length < 12, "one top point");
    }
  }
});
