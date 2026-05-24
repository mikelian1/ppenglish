import {
  DEFAULT_HIGHLIGHT_COLOR,
  normalizeHighlightColor,
} from "./highlightUtils";

export const READING_MODES = {
  BILINGUAL_DOUBLE: "bilingual-double",
  BILINGUAL_SINGLE: "bilingual-single",
  ENGLISH_ONLY: "english-only",
};

export function getGridTemplateColumnsByReadingMode(readingMode) {
  return readingMode === READING_MODES.BILINGUAL_DOUBLE
    ? "repeat(2, 1fr)"
    : "repeat(1, 1fr)";
}

export function normalizeReadingStyles(input = {}, defaults = {}) {
  const safeInput = input && typeof input === "object" ? input : {};
  const safeDefaults = defaults && typeof defaults === "object" ? defaults : {};
  const merged = {
    ...safeDefaults,
    ...safeInput,
  };

  let readingMode = safeInput.readingMode || safeDefaults.readingMode;

  if (!safeInput.readingMode && safeInput.gridTemplateColumns) {
    readingMode =
      safeInput.gridTemplateColumns === "repeat(2, 1fr)"
        ? READING_MODES.BILINGUAL_DOUBLE
        : READING_MODES.BILINGUAL_SINGLE;
  }

  if (!readingMode) {
    readingMode =
      merged.gridTemplateColumns === "repeat(2, 1fr)"
        ? READING_MODES.BILINGUAL_DOUBLE
        : READING_MODES.BILINGUAL_SINGLE;
  }

  if (!Object.values(READING_MODES).includes(readingMode)) {
    readingMode = READING_MODES.BILINGUAL_DOUBLE;
  }

  return {
    ...merged,
    highlightColor: normalizeHighlightColor(
      merged.highlightColor,
      DEFAULT_HIGHLIGHT_COLOR
    ),
    readingMode,
    gridTemplateColumns: getGridTemplateColumnsByReadingMode(readingMode),
  };
}
