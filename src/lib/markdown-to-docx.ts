/**
 * Enkel Markdown → .docx-konvertering för protokoll.
 *
 * Stödjer det vi genererar i `protocol.generate`:
 *   # H1       → Heading 1
 *   ## H2      → Heading 2
 *   ### H3     → Heading 3
 *   - item     → listrad (enkel nivå)
 *   **fet**    → fet text
 *   *kursiv*   → kursiv text
 *   ---        → linjeavdelare (horisontell paragrafbrytning)
 *   tom rad    → stycke-break
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
} from "docx";

// Enkel inline-parser: delar på **fet** och *kursiv* och returnerar TextRun[]
function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Regex för att hitta **fet** (inkl. flera ord) eller *kursiv*
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue;
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index) }));
    }
    const token = m[0];
    if (token.startsWith("**")) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith("*")) {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
    }
    last = m.index + token.length;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last) }));
  }
  if (runs.length === 0) runs.push(new TextRun({ text }));
  return runs;
}

function lineToParagraph(line: string): Paragraph {
  // Tom rad
  if (line.trim() === "") {
    return new Paragraph({ children: [new TextRun({ text: "" })] });
  }

  // Horisontell linje
  if (line.trim() === "---" || line.trim() === "___") {
    return new Paragraph({
      children: [new TextRun({ text: "" })],
      border: { bottom: { color: "999999", style: BorderStyle.SINGLE, size: 6, space: 1 } },
    });
  }

  // Rubriker
  if (line.startsWith("# ")) {
    return new Paragraph({
      children: parseInline(line.slice(2)),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
    });
  }
  if (line.startsWith("## ")) {
    return new Paragraph({
      children: parseInline(line.slice(3)),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
    });
  }
  if (line.startsWith("### ")) {
    return new Paragraph({
      children: parseInline(line.slice(4)),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 60 },
    });
  }

  // Lista (enkel — en nivå)
  if (line.startsWith("- ")) {
    return new Paragraph({
      children: parseInline(line.slice(2)),
      bullet: { level: 0 },
    });
  }

  // Vanligt stycke
  return new Paragraph({ children: parseInline(line) });
}

export async function markdownToDocxBlob(markdown: string, title = "Protokoll"): Promise<Blob> {
  const lines = markdown.split("\n");
  const paragraphs = lines.map(lineToParagraph);

  const doc = new Document({
    creator: "Hemmet BRF-plattform",
    title,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 }, // 11pt (size är halv-poäng)
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm
          },
        },
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}
