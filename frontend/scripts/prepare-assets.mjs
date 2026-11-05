import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, simplify, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import { mkdir, writeFile, stat } from "node:fs/promises";
await MeshoptSimplifier.ready;
await mkdir("public/assets", { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const inventory = [];
for (const [id, name, ratio] of [
  ["island_tree_02", "tree", 0.02],
  ["rock_moss_set_01", "rocks", 0.3],
  ["fern_02", "fern", 0.5],
]) {
  const doc = await io.read(`work/assets/${id}/${id}.gltf`);
  await doc.transform(
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio,
      error: name === "tree" ? 0.07 : 0.025,
    }),
    dedup(),
    prune(),
  );
  await io.write(`public/assets/${name}.glb`, doc);
  const triangles = doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((s, p) => s + (p.getIndices()?.getCount() || 0) / 3, 0);
  inventory.push({
    id,
    file: `${name}.glb`,
    source: `https://polyhaven.com/a/${id}`,
    license: "CC0-1.0",
    triangles,
    bytes: (await stat(`public/assets/${name}.glb`)).size,
  });
  console.log(name, triangles);
  const lod = await io.read(`public/assets/${name}.glb`);
  await lod.transform(
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: name === "tree" ? 0.15 : name === "rocks" ? 0.1 : 0.35,
      error: 0.15,
    }),
    prune(),
  );
  await io.write(`public/assets/${name}-lod.glb`, lod);
}
for (const id of [
  "cobblestone_floor_08",
  "bark_brown_02",
  "forest_ground_04",
]) {
  const a = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  for (const [out, keys] of [
    ["diff", ["diff", "Diffuse"]],
    ["nor_gl", ["nor_gl"]],
    ["rough", ["rough", "Rough"]],
  ]) {
    const data = keys.map((k) => a[k]).find(Boolean);
    const url = data["1k"].jpg.url;
    const res = await fetch(url);
    if (!res.ok) throw Error(url);
    await writeFile(
      `public/assets/${id}_${out}.jpg`,
      Buffer.from(await res.arrayBuffer()),
    );
  }
  inventory.push({
    id,
    source: `https://polyhaven.com/a/${id}`,
    license: "CC0-1.0",
    maps: "1k diffuse, normal, roughness",
  });
}
await writeFile(
  "public/assets/sources.json",
  JSON.stringify(inventory, null, 2),
);
