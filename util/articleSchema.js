import {
  DEFAULT_HIGHLIGHT_COLOR,
  normalizeHighlights,
} from "./highlightUtils";

export const ARTICLE_SCHEMA_VERSION = 2;
export const LEGACY_ARTICLE_SCHEMA_VERSIONS = [1];

export function isSupportedArticleSchemaVersion(schemaVersion) {
  return (
    schemaVersion === ARTICLE_SCHEMA_VERSION ||
    LEGACY_ARTICLE_SCHEMA_VERSIONS.includes(schemaVersion)
  );
}

export function normalizeSegmentForStorage(segment) {
  if (!segment || typeof segment !== "object") return segment;

  const source = typeof segment.source === "string" ? segment.source : "";
  return {
    ...segment,
    highlights: normalizeHighlights(
      segment.highlights,
      source.length,
      DEFAULT_HIGHLIGHT_COLOR
    ),
  };
}

export function normalizeArticleForStorage(article) {
  if (!article || typeof article !== "object") return article;

  return {
    ...article,
    schemaVersion: ARTICLE_SCHEMA_VERSION,
    segments: Array.isArray(article.segments)
      ? article.segments.map(normalizeSegmentForStorage)
      : article.segments,
  };
}

export function validateSegment(segment, index) {
  if (!segment || typeof segment !== "object") {
    throw new Error(`Segment ${index + 1} is invalid`);
  }
  if (typeof segment.id !== "string" || !segment.id) {
    throw new Error(`Segment ${index + 1} is missing id`);
  }
  if (typeof segment.index !== "number") {
    throw new Error(`Segment ${index + 1} is missing index`);
  }
  if (typeof segment.source !== "string") {
    throw new Error(`Segment ${index + 1} is missing source`);
  }
  if (typeof segment.translation !== "string") {
    throw new Error(`Segment ${index + 1} is missing translation`);
  }
  if (typeof segment.status !== "string") {
    throw new Error(`Segment ${index + 1} is missing status`);
  }
  if (typeof segment.error !== "string") {
    throw new Error(`Segment ${index + 1} is missing error`);
  }
  if (typeof segment.provider !== "string") {
    throw new Error(`Segment ${index + 1} is missing provider`);
  }
  if (!Array.isArray(segment.highlights)) {
    throw new Error(`Segment ${index + 1} highlights must be an array`);
  }

  segment.highlights.forEach((highlight, highlightIndex) => {
    if (!highlight || typeof highlight !== "object") {
      throw new Error(
        `Segment ${index + 1} highlight ${highlightIndex + 1} is invalid`
      );
    }
    if (typeof highlight.id !== "string" || !highlight.id) {
      throw new Error(
        `Segment ${index + 1} highlight ${highlightIndex + 1} is missing id`
      );
    }
    if (
      typeof highlight.start !== "number" ||
      typeof highlight.end !== "number"
    ) {
      throw new Error(
        `Segment ${index + 1} highlight ${highlightIndex + 1} offsets are invalid`
      );
    }
    if (typeof highlight.color !== "string" || !highlight.color.trim()) {
      throw new Error(
        `Segment ${index + 1} highlight ${highlightIndex + 1} is missing color`
      );
    }
  });
}

export function validateArticle(article) {
  if (!article || typeof article !== "object") {
    throw new Error("Article is invalid");
  }
  if (article.schemaVersion !== ARTICLE_SCHEMA_VERSION) {
    throw new Error("Article schemaVersion is incompatible");
  }
  if (typeof article.id !== "string" || !article.id) {
    throw new Error("Article is missing id");
  }
  if (typeof article.title !== "string") {
    throw new Error("Article is missing title");
  }
  if (typeof article.sourceText !== "string") {
    throw new Error("Article is missing sourceText");
  }
  if (typeof article.createdAt !== "string") {
    throw new Error("Article is missing createdAt");
  }
  if (typeof article.updatedAt !== "string") {
    throw new Error("Article is missing updatedAt");
  }
  if (typeof article.status !== "string") {
    throw new Error("Article is missing status");
  }
  if (!Array.isArray(article.segments)) {
    throw new Error("Article is missing segments");
  }
  article.segments.forEach(validateSegment);
  return true;
}
