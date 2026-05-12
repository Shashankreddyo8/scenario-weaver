// LangChain-style recursive text splitter
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export function chunkText(text: string, chunkSize = 800, overlap = 120): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
  if (clean.length <= chunkSize) return [clean];
  return splitRecursive(clean, chunkSize, overlap, 0);
}

function splitRecursive(text: string, size: number, overlap: number, sepIdx: number): string[] {
  if (text.length <= size) return [text];
  const sep = SEPARATORS[Math.min(sepIdx, SEPARATORS.length - 1)];
  const parts = sep === "" ? text.split("") : text.split(sep);
  const chunks: string[] = [];
  let buf = "";
  for (const part of parts) {
    const piece = part + (sep === "" ? "" : sep);
    if ((buf + piece).length > size) {
      if (buf) chunks.push(buf.trim());
      if (piece.length > size) {
        chunks.push(...splitRecursive(piece, size, overlap, sepIdx + 1));
        buf = "";
      } else {
        // start new buffer with overlap tail of previous
        const tail = buf.slice(-overlap);
        buf = tail + piece;
      }
    } else {
      buf += piece;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter(Boolean);
}
