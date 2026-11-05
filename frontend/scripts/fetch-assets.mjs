import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const records = [];
async function download(url, target) {
  await mkdir(path.dirname(target), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw Error(`${r.status}: ${url}`);
  await writeFile(target, Buffer.from(await r.arrayBuffer()));
}
for (const id of ["island_tree_02", "rock_moss_set_01", "fern_02"]) {
  const a = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const g = a.gltf["1k"].gltf;
  const dir = `work/assets/${id}`;
  await download(g.url, `${dir}/${id}.gltf`);
  for (const [name, asset] of Object.entries(g.include))
    await download(asset.url, `${dir}/${name}`);
  records.push({
    id,
    source: `https://polyhaven.com/a/${id}`,
    license: "CC0-1.0",
    usage: "Optimised 3D model; 1k textures",
    originalBytes:
      g.size + Object.values(g.include).reduce((s, a) => s + a.size, 0),
  });
  console.log("Downloaded", id);
}
for (const id of [
  "cobblestone_floor_08",
  "bark_brown_02",
  "forest_ground_04",
]) {
  const a = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  for (const kind of ["diff", "nor_gl", "rough"])
    await download(a[kind]["1k"].jpg.url, `public/assets/${id}_${kind}.jpg`);
  records.push({
    id,
    source: `https://polyhaven.com/a/${id}`,
    license: "CC0-1.0",
    usage: "1k diffuse, OpenGL normal and roughness maps",
  });
  console.log("Downloaded", id);
}
await writeFile("public/assets/sources.json", JSON.stringify(records, null, 2));
