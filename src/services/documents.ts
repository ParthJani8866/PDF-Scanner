import { storage } from "@/src/utils/storage";
import { DocumentItem } from "@/src/types";

const KEY = "docvault.documents.v1";

export async function listDocuments(): Promise<DocumentItem[]> {
  const raw = await storage.getItem<string>(KEY, "[]");
  try {
    const parsed = JSON.parse(raw || "[]") as DocumentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAllDocuments(docs: DocumentItem[]): Promise<boolean> {
  return storage.setItem(KEY, JSON.stringify(docs));
}

export async function addDocument(doc: DocumentItem): Promise<DocumentItem[]> {
  const docs = await listDocuments();
  const next = [doc, ...docs];
  await saveAllDocuments(next);
  return next;
}

export async function updateDocument(
  id: string,
  patch: Partial<DocumentItem>,
): Promise<DocumentItem[]> {
  const docs = await listDocuments();
  const next = docs.map((d) =>
    d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
  );
  await saveAllDocuments(next);
  return next;
}

export async function deleteDocument(id: string): Promise<DocumentItem[]> {
  const docs = await listDocuments();
  const next = docs.filter((d) => d.id !== id);
  await saveAllDocuments(next);
  return next;
}

export function autoScanName(date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Scan_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function newId() {
  return `doc_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
