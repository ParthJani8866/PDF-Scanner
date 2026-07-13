import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { DocumentItem, FilterType, ScanPage } from "@/src/types";

function cssFilterFor(f: FilterType): string {
  switch (f) {
    case "bw":
      return "grayscale(1) contrast(1.6) brightness(1.05)";
    case "grayscale":
      return "grayscale(1)";
    case "enhanced":
      return "contrast(1.2) saturate(1.2) brightness(1.05)";
    default:
      return "none";
  }
}

async function toDataUri(uri: string): Promise<string> {
  if (uri.startsWith("data:")) return uri;
  try {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return uri;
  }
}

function pageHtml(dataUri: string, page: ScanPage): string {
  const filter = cssFilterFor(page.filter);
  const rotate = page.rotation || 0;
  return `
  <div class="page">
    <img src="${dataUri}" style="filter:${filter}; transform: rotate(${rotate}deg);" />
  </div>`;
}

export async function buildDocumentHtml(doc: DocumentItem): Promise<string> {
  const parts: string[] = [];
  for (const p of doc.pages) {
    const uri = await toDataUri(p.uri);
    parts.push(pageHtml(uri, p));
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    @page { margin: 24px; size: A4; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: Verdana, sans-serif; }
    .page { page-break-after: always; display: flex; align-items: center; justify-content: center; height: 100vh; }
    .page:last-child { page-break-after: auto; }
    .page img { max-width: 100%; max-height: 100%; object-fit: contain; display:block; }
  </style></head><body>${parts.join("\n")}</body></html>`;
}

export async function generatePdf(doc: DocumentItem): Promise<string> {
  const html = await buildDocumentHtml(doc);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function mergePdfsAsHtml(
  docs: DocumentItem[],
  outputName: string,
): Promise<{ uri: string; name: string }> {
  const htmlParts: string[] = [];
  for (const d of docs) {
    for (const p of d.pages) {
      const uri = await toDataUri(p.uri);
      htmlParts.push(pageHtml(uri, p));
    }
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    @page { margin: 24px; size: A4; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .page { page-break-after: always; display:flex; align-items:center; justify-content:center; height:100vh; }
    .page:last-child { page-break-after: auto; }
    .page img { max-width: 100%; max-height: 100%; object-fit: contain; display:block; }
  </style></head><body>${htmlParts.join("\n")}</body></html>`;
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, name: outputName };
}
