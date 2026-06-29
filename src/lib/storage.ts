import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { generateId } from "@/lib/utils";

const LOCAL_DIR = process.env.LOCAL_ASSET_DIR ?? "./public/generated";

export async function storeAsset(
  buffer: Buffer,
  opts: { projectId: string; type: string; ext: string },
): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    try {
      const { put } = await import("@vercel/blob");
      const pathname = `projects/${opts.projectId}/${opts.type}/${generateId()}.${opts.ext}`;
      const blob = await put(pathname, buffer, { access: "public" });
      return blob.url;
    } catch (err) {
      console.warn("Vercel Blob upload failed, using local storage:", err);
    }
  }

  const dir = join(LOCAL_DIR, opts.projectId, opts.type);
  mkdirSync(dir, { recursive: true });
  const filename = `${generateId()}.${opts.ext}`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, buffer);
  return `/generated/${opts.projectId}/${opts.type}/${filename}`;
}

export async function storeFromUrl(
  url: string,
  opts: { projectId: string; type: string; ext: string },
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch asset: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return storeAsset(buffer, opts);
}
