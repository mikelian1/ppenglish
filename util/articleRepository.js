import { segmentText } from "./textSegmenter";
import { ARTICLE_STORE, openDatabase, requestToPromise } from "./db";
import { ARTICLE_SCHEMA_VERSION, validateArticle } from "./articleSchema";

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createArticle({ title, sourceText }) {
  const now = new Date().toISOString();
  const finalSourceText = (sourceText || "").trim();

  return {
    id: createId("article"),
    title: title && title.trim() ? title.trim() : "未命名文章",
    sourceText: finalSourceText,
    createdAt: now,
    updatedAt: now,
    status: "draft",
    schemaVersion: ARTICLE_SCHEMA_VERSION,
    segments: segmentText(finalSourceText),
  };
}

export async function saveArticle(article) {
  validateArticle(article);
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readwrite");
  const store = transaction.objectStore(ARTICLE_STORE);
  await requestToPromise(store.put(article));
  db.close();
  return article;
}

export async function getArticle(id) {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readonly");
  const store = transaction.objectStore(ARTICLE_STORE);
  const article = await requestToPromise(store.get(id));
  db.close();
  return article || null;
}

export async function listArticles() {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readonly");
  const store = transaction.objectStore(ARTICLE_STORE);
  const articles = await requestToPromise(store.getAll());
  db.close();
  return articles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteArticle(id) {
  const db = await openDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readwrite");
  const store = transaction.objectStore(ARTICLE_STORE);
  await requestToPromise(store.delete(id));
  db.close();
}
