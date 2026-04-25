import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const ARTIFACT_ROOT = 'artifacts';

export function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function writeJsonArtifact(relativePath: string, data: unknown): Promise<string> {
  const fullPath = join(ARTIFACT_ROOT, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(data, null, 2)}
`, 'utf8');
  return fullPath;
}

export async function writeTextArtifact(relativePath: string, content: string): Promise<string> {
  const fullPath = join(ARTIFACT_ROOT, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
  return fullPath;
}

export async function ensureArtifactDir(relativeDir: string): Promise<string> {
  const fullPath = join(ARTIFACT_ROOT, relativeDir);
  await mkdir(fullPath, { recursive: true });
  return fullPath;
}
