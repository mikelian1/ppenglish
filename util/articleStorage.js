import { segmentText } from "./textSegmenter";

export const ARTICLE_SCHEMA_VERSION = 1;
const EXPORT_APP_NAME = "ppenglish";
const DB_NAME = "ppdb";
const DB_VERSION = 4;
const ARTICLE_STORE = "articles";
const VOCABULARY_STORE = "vocabulary";

function openArticleDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
        db.createObjectStore(ARTICLE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(VOCABULARY_STORE)) {
        db.createObjectStore(VOCABULARY_STORE, { keyPath: "word" });
      }
    };

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve();
    };
    transaction.onerror = function (event) {
      reject(event.target.error);
    };
    transaction.onabort = function (event) {
      reject(event.target.error);
    };
  });
}

function validateImportPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("导入文件格式不正确");
  }
  if (payload.schemaVersion !== ARTICLE_SCHEMA_VERSION) {
    throw new Error("导入文件 schemaVersion 不兼容");
  }
  if (!Array.isArray(payload.articles)) {
    throw new Error("导入文件缺少 articles 数组");
  }
  if (payload.vocabulary !== undefined && !Array.isArray(payload.vocabulary)) {
    throw new Error("导入文件 vocabulary 格式不正确");
  }

  payload.articles.forEach((article, index) => {
    try {
      validateArticle(article);
    } catch (error) {
      throw new Error(`第 ${index + 1} 篇文章格式错误：${error.message}`);
    }
  });

  (payload.vocabulary || []).forEach((item, index) => {
    const isLegacyWord = typeof item === "string";
    const isVocabularyRecord =
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.word === "string";

    if (!isLegacyWord && !isVocabularyRecord) {
      throw new Error(`第 ${index + 1} 个生词格式不正确`);
    }
  });
}

function cloneArticleForImport(article) {
  return {
    ...article,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeVocabularyWord(word) {
  return String(word || "").trim().toLowerCase();
}

function getVocabularySortTimeValue(record) {
  const rawTime = record && (record.addedAt || record.createdAt || record.updatedAt);
  const timestamp = Date.parse(rawTime);
  return Number.isFinite(timestamp) ? rawTime : "";
}

function getVocabularySortTime(record) {
  const rawTime = getVocabularySortTimeValue(record);
  const timestamp = Date.parse(rawTime);
  return Number.isFinite(timestamp) ? timestamp : -Infinity;
}

function compareVocabularyRecords(a, b) {
  const timeA = getVocabularySortTime(a);
  const timeB = getVocabularySortTime(b);

  if (timeA !== timeB) {
    return timeB > timeA ? 1 : -1;
  }

  const stableKeyA = String((a && (a.id || a.word)) || "");
  const stableKeyB = String((b && (b.id || b.word)) || "");
  return stableKeyA.localeCompare(stableKeyB);
}

function createVocabularyRecord(rawWord, addedAt) {
  return {
    word: normalizeVocabularyWord(rawWord),
    addedAt: addedAt || new Date().toISOString(),
  };
}

function normalizeVocabularyRecordForImport(rawRecord, fallbackAddedAt) {
  if (typeof rawRecord === "string") {
    return createVocabularyRecord(rawRecord, fallbackAddedAt);
  }

  const word = normalizeVocabularyWord(rawRecord && rawRecord.word);
  if (!word) {
    return null;
  }

  return {
    ...rawRecord,
    word,
    addedAt: getVocabularySortTimeValue(rawRecord) || fallbackAddedAt,
  };
}

function normalizeVocabularyRecordForExport(record) {
  const word = normalizeVocabularyWord(record && record.word);
  if (!word) {
    return null;
  }

  const addedAt = getVocabularySortTimeValue(record);
  const exportedRecord = { word };

  if (record.id) {
    exportedRecord.id = record.id;
  }
  if (addedAt) {
    exportedRecord.addedAt = addedAt;
  }

  return exportedRecord;
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

function validateSegment(segment, index) {
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

export async function saveArticle(article) {
  validateArticle(article);
  const db = await openArticleDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readwrite");
  const store = transaction.objectStore(ARTICLE_STORE);
  await requestToPromise(store.put(article));
  db.close();
  return article;
}

export async function getArticle(id) {
  const db = await openArticleDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readonly");
  const store = transaction.objectStore(ARTICLE_STORE);
  const article = await requestToPromise(store.get(id));
  db.close();
  return article || null;
}

export async function listArticles() {
  const db = await openArticleDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readonly");
  const store = transaction.objectStore(ARTICLE_STORE);
  const articles = await requestToPromise(store.getAll());
  db.close();
  return articles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function exportArticles() {
  const articles = await listArticles();
  const vocabulary = await listVocabularyRecords();
  return {
    app: EXPORT_APP_NAME,
    schemaVersion: ARTICLE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    articles,
    vocabulary,
  };
}

export async function importArticles(payload) {
  validateImportPayload(payload);

  const db = await openArticleDatabase();
  const transaction = db.transaction(
    [ARTICLE_STORE, VOCABULARY_STORE],
    "readwrite"
  );
  const store = transaction.objectStore(ARTICLE_STORE);
  const vocabularyStore = transaction.objectStore(VOCABULARY_STORE);
  const transactionDone = transactionToPromise(transaction);
  let imported = 0;
  let skipped = 0;
  let vocabularyImported = 0;
  let vocabularySkipped = 0;

  try {
    for (const article of payload.articles) {
      const existingArticle = await requestToPromise(store.get(article.id));
      if (existingArticle) {
        skipped += 1;
      } else {
        await requestToPromise(store.put(cloneArticleForImport(article)));
        imported += 1;
      }
    }
    for (const rawVocabularyRecord of payload.vocabulary || []) {
      const vocabularyRecord = normalizeVocabularyRecordForImport(
        rawVocabularyRecord,
        new Date().toISOString()
      );
      if (!vocabularyRecord) {
        vocabularySkipped += 1;
        continue;
      }

      const existingWord = await requestToPromise(
        vocabularyStore.get(vocabularyRecord.word)
      );
      if (existingWord) {
        vocabularySkipped += 1;
      } else {
        await requestToPromise(vocabularyStore.put(vocabularyRecord));
        vocabularyImported += 1;
      }
    }
    await transactionDone;
  } catch (error) {
    await transactionDone.catch(() => {});
    throw error;
  } finally {
    db.close();
  }

  return { imported, skipped, vocabularyImported, vocabularySkipped };
}

export async function deleteArticle(id) {
  const db = await openArticleDatabase();
  const transaction = db.transaction([ARTICLE_STORE], "readwrite");
  const store = transaction.objectStore(ARTICLE_STORE);
  await requestToPromise(store.delete(id));
  db.close();
}

export async function listVocabularyRecords() {
  const db = await openArticleDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readonly");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const words = await requestToPromise(store.getAll());
  db.close();
  return words
    .filter((item) => item && item.word)
    .sort(compareVocabularyRecords)
    .map(normalizeVocabularyRecordForExport)
    .filter(Boolean);
}

export async function listVocabularyWords() {
  const words = await listVocabularyRecords();
  return words.map((item) => item.word);
}

export async function addVocabularyWord(rawWord) {
  const word = normalizeVocabularyWord(rawWord);
  if (!word) {
    throw new Error("请输入英文单词。");
  }

  const db = await openArticleDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const existingWord = await requestToPromise(store.get(word));

  if (!existingWord) {
    await requestToPromise(store.put(createVocabularyRecord(word)));
  }

  db.close();
  return { word, added: !existingWord };
}

export async function deleteVocabularyWord(rawWord) {
  const word = normalizeVocabularyWord(rawWord);
  if (!word) {
    throw new Error("生词不存在。");
  }

  const db = await openArticleDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  await requestToPromise(store.delete(word));
  db.close();
}

export async function importVocabularyWords(words) {
  if (!Array.isArray(words)) {
    throw new Error("生词格式不正确。");
  }

  const db = await openArticleDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const transactionDone = transactionToPromise(transaction);
  let imported = 0;
  let skipped = 0;

  try {
    for (const rawVocabularyRecord of words) {
      const isLegacyWord = typeof rawVocabularyRecord === "string";
      const isVocabularyRecord =
        rawVocabularyRecord &&
        typeof rawVocabularyRecord === "object" &&
        !Array.isArray(rawVocabularyRecord) &&
        typeof rawVocabularyRecord.word === "string";

      if (!isLegacyWord && !isVocabularyRecord) {
        throw new Error("生词格式不正确。");
      }

      const vocabularyRecord = normalizeVocabularyRecordForImport(
        rawVocabularyRecord,
        new Date().toISOString()
      );
      if (!vocabularyRecord) {
        skipped += 1;
        continue;
      }

      const existingWord = await requestToPromise(store.get(vocabularyRecord.word));
      if (existingWord) {
        skipped += 1;
      } else {
        await requestToPromise(store.put(vocabularyRecord));
        imported += 1;
      }
    }
    await transactionDone;
  } catch (error) {
    await transactionDone.catch(() => {});
    throw error;
  } finally {
    db.close();
  }

  return { imported, skipped };
}
