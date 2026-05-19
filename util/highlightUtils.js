export const DEFAULT_HIGHLIGHT_COLOR = "rgba(255, 232, 120, 0.72)";
export const LOOKUP_HIGHLIGHT_COLOR = "rgba(255, 128, 191, 0.45)";

export function createHighlightId() {
  return `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeHighlights(
  highlights,
  sourceLength,
  defaultColor = DEFAULT_HIGHLIGHT_COLOR
) {
  const length = Math.max(0, Number(sourceLength) || 0);

  return (Array.isArray(highlights) ? highlights : [])
    .filter((highlight) => highlight && typeof highlight === "object")
    .map((highlight) => ({
      id: highlight.id || createHighlightId(),
      start: Math.max(0, Math.min(length, Number(highlight.start))),
      end: Math.max(0, Math.min(length, Number(highlight.end))),
      color: highlight.color || defaultColor,
    }))
    .filter((highlight) => highlight.start < highlight.end)
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .reduce((merged, highlight) => {
      const previous = merged[merged.length - 1];
      if (previous && highlight.start <= previous.end) {
        previous.end = Math.max(previous.end, highlight.end);
        previous.color = previous.color || highlight.color;
        return merged;
      }
      merged.push({ ...highlight });
      return merged;
    }, []);
}

export function buildHighlightChunks(
  segment,
  defaultColor = DEFAULT_HIGHLIGHT_COLOR
) {
  const source = (segment && segment.source) || "";
  const segmentId = (segment && segment.id) || "segment";
  const highlights = normalizeHighlights(
    segment && segment.highlights,
    source.length,
    defaultColor
  );
  const chunks = [];
  let cursor = 0;

  highlights.forEach((highlight) => {
    if (highlight.start > cursor) {
      chunks.push({
        key: `plain-${segmentId}-${cursor}-${highlight.start}`,
        text: source.slice(cursor, highlight.start),
        start: cursor,
        end: highlight.start,
        highlighted: false,
      });
    }

    chunks.push({
      key: `highlight-${segmentId}-${highlight.id}-${highlight.start}-${highlight.end}`,
      text: source.slice(highlight.start, highlight.end),
      start: highlight.start,
      end: highlight.end,
      highlighted: true,
      highlightId: highlight.id,
      color: highlight.color || defaultColor,
    });

    cursor = highlight.end;
  });

  if (cursor < source.length) {
    chunks.push({
      key: `plain-${segmentId}-${cursor}-${source.length}`,
      text: source.slice(cursor),
      start: cursor,
      end: source.length,
      highlighted: false,
    });
  }

  if (!chunks.length) {
    chunks.push({
      key: `plain-${segmentId}-empty`,
      text: source,
      start: 0,
      end: 0,
      highlighted: false,
    });
  }

  return chunks;
}

export function trimSelectionOffsets(sourceOrSegment, start, end) {
  const source =
    typeof sourceOrSegment === "string"
      ? sourceOrSegment
      : (sourceOrSegment && sourceOrSegment.source) || "";
  let nextStart = Math.max(0, Math.min(source.length, start));
  let nextEnd = Math.max(0, Math.min(source.length, end));

  while (nextStart < nextEnd && /\s/.test(source.charAt(nextStart))) {
    nextStart += 1;
  }
  while (nextEnd > nextStart && /\s/.test(source.charAt(nextEnd - 1))) {
    nextEnd -= 1;
  }

  return { start: nextStart, end: nextEnd };
}
