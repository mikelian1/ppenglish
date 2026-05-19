const SENTENCE_END_PATTERN = /[.!?。！？]["')\]\u2019\u201d）】》」』]*$/;
const PDF_LINE_HYPHEN_PATTERN = /[-\u0002\u0016\u00ad\u00ac\u2010\u2011\u2012\u2013\u2014\u2212\ufe58\ufe63\uff0d\ufffd\u25a1\u25a0]/;
const PDF_INLINE_HYPHEN_PATTERN = /[\u2010\u2011\u2012\u2013\u2014\u2212\ufe58\ufe63\uff0d]/g;

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

function joinPdfHyphenatedLineBreaks(text) {
  return text.replace(
    new RegExp(
      `([A-Za-z])${PDF_LINE_HYPHEN_PATTERN.source}+[ \\t]*\\n[ \\t]*([A-Za-z])`,
      "g"
    ),
    "$1$2"
  );
}

function normalizePdfSymbols(text) {
  return text
    .replace(/[\u0002\u0016\u00ad]/g, "")
    .replace(PDF_INLINE_HYPHEN_PATTERN, "-")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "");
}

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function cleanPdfParagraph(block) {
  const lines = block.split("\n").map(normalizeLine).filter(Boolean);
  const paragraphs = [];
  let current = "";

  lines.forEach((line) => {
    const next = current ? `${current} ${line}` : line;

    if (SENTENCE_END_PATTERN.test(line)) {
      paragraphs.push(next);
      current = "";
      return;
    }

    current = next;
  });

  if (current) paragraphs.push(current);
  return paragraphs.join("\n\n");
}

export function normalizePastedSourceText(sourceText) {
  if (!sourceText) return "";

  const normalizedText = normalizeNewlines(sourceText);
  return normalizePdfSymbols(joinPdfHyphenatedLineBreaks(normalizedText));
}

export function cleanPastedText(sourceText) {
  if (!sourceText) return "";

  return normalizePastedSourceText(sourceText)
    .split(/\n[ \t]*\n+/)
    .map(cleanPdfParagraph)
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function normalizeParagraph(paragraph) {
  return paragraph.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}

export function segmentText(sourceText) {
  if (!sourceText || !sourceText.trim()) return [];

  const segmentSources = sourceText
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map(normalizeParagraph)
    .filter(Boolean);

  return segmentSources.map((source, index) => ({
    id: `seg-${index + 1}`,
    index,
    source,
    translation: "",
    status: "pending",
    error: "",
    provider: "",
    highlights: [],
  }));
}
