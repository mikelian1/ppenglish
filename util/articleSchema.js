export const ARTICLE_SCHEMA_VERSION = 1;

export function validateSegment(segment, index) {
  if (!segment || typeof segment !== "object") {
    throw new Error(`第 ${index + 1} 段格式不正确`);
  }
  if (typeof segment.id !== "string" || !segment.id) {
    throw new Error(`第 ${index + 1} 段缺少 id`);
  }
  if (typeof segment.index !== "number") {
    throw new Error(`第 ${index + 1} 段缺少 index`);
  }
  if (typeof segment.source !== "string") {
    throw new Error(`第 ${index + 1} 段缺少 source`);
  }
  if (typeof segment.translation !== "string") {
    throw new Error(`第 ${index + 1} 段缺少 translation`);
  }
  if (typeof segment.status !== "string") {
    throw new Error(`第 ${index + 1} 段缺少 status`);
  }
  if (typeof segment.error !== "string") {
    throw new Error(`第 ${index + 1} 段缺少 error`);
  }
  if (typeof segment.provider !== "string") {
    throw new Error(`第 ${index + 1} 段缺少 provider`);
  }
  if (segment.highlights !== undefined) {
    if (!Array.isArray(segment.highlights)) {
      throw new Error(`第 ${index + 1} 段高亮格式不正确`);
    }
    segment.highlights.forEach((highlight, highlightIndex) => {
      if (!highlight || typeof highlight !== "object") {
        throw new Error(
          `第 ${index + 1} 段第 ${highlightIndex + 1} 个高亮格式不正确`
        );
      }
      if (typeof highlight.id !== "string" || !highlight.id) {
        throw new Error(
          `第 ${index + 1} 段第 ${highlightIndex + 1} 个高亮缺少 id`
        );
      }
      if (typeof highlight.start !== "number" || typeof highlight.end !== "number") {
        throw new Error(
          `第 ${index + 1} 段第 ${highlightIndex + 1} 个高亮偏移量不正确`
        );
      }
      if (highlight.color !== undefined && typeof highlight.color !== "string") {
        throw new Error(
          `第 ${index + 1} 段第 ${highlightIndex + 1} 个高亮颜色不正确`
        );
      }
    });
  }
}

export function validateArticle(article) {
  if (!article || typeof article !== "object") {
    throw new Error("文章格式不正确");
  }
  if (article.schemaVersion !== ARTICLE_SCHEMA_VERSION) {
    throw new Error("文章 schemaVersion 不兼容");
  }
  if (typeof article.id !== "string" || !article.id) {
    throw new Error("文章缺少 id");
  }
  if (typeof article.title !== "string") {
    throw new Error("文章缺少 title");
  }
  if (typeof article.sourceText !== "string") {
    throw new Error("文章缺少 sourceText");
  }
  if (typeof article.createdAt !== "string") {
    throw new Error("文章缺少 createdAt");
  }
  if (typeof article.updatedAt !== "string") {
    throw new Error("文章缺少 updatedAt");
  }
  if (typeof article.status !== "string") {
    throw new Error("文章缺少 status");
  }
  if (!Array.isArray(article.segments)) {
    throw new Error("文章缺少 segments");
  }
  article.segments.forEach(validateSegment);
  return true;
}
