export type FilterType = "original" | "bw" | "enhanced" | "grayscale";

export interface ScanPage {
  uri: string; // file:// uri under documents dir
  width: number;
  height: number;
  filter: FilterType;
  rotation: number; // 0 / 90 / 180 / 270
}

export interface DocumentItem {
  id: string;
  name: string;
  createdAt: string; // ISO string
  updatedAt: string;
  pages: ScanPage[];
  folder: string; // simple tag/folder name; default "Inbox"
  pdfUri?: string; // cached generated pdf path
}
