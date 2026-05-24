import {
  ARTICLE_STORE,
  VOCABULARY_ARTICLE_WORD_INDEX,
  VOCABULARY_STORE,
  openDatabase,
  requestToPromise,
  transactionToPromise,
} from "./db";
import {
  ARTICLE_SCHEMA_VERSION,
  isSupportedArticleSchemaVersion,
  normalizeArticleForStorage,
  validateArticle,
} from "./articleSchema";
import { listArticles } from "./articleRepository";
import { listVocabularyRecords } from "./vocabularyRepository";
import { normalizeVocabularyRecordForImport } from "./vocabularyModel";

const EXPORT_APP_NAME = "ppenglish";

function validateImportPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Import file format is invalid");
  }
  if (!isSupportedArticleSchemaVersion(payload.schemaVersion)) {
    throw new Error("Import file schemaVersion is incompatible");
  }
  if (!Array.isArray(payload.articles)) {
    throw new Error("Import file is missing articles array");
  }
  if (payload.vocabulary !== undefined && !Array.isArray(payload.vocabulary)) {
    throw new Error("Import file vocabulary format is invalid");
  }

  payload.articles.forEach((article, index) => {
    try {
      validateArticle(normalizeArticleForStorage(article));
    } catch (error) {
      throw new Error(`Article ${index + 1} format error: ${error.message}`);
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
      throw new Error(`Vocabulary item ${index + 1} format is invalid`);
    }
  });
}

function cloneArticleForImport(article) {
  return normalizeArticleForStorage(article);
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

  const db = await openDatabase();
  const transaction = db.transaction(
    [ARTICLE_STORE, VOCABULARY_STORE],
    "readwrite"
  );
  const store = transaction.objectStore(ARTICLE_STORE);
  const vocabularyStore = transaction.objectStore(VOCABULARY_STORE);
  const vocabularyScopeWordIndex = vocabularyStore.index(
    VOCABULARY_ARTICLE_WORD_INDEX
  );
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

      const existingRecord = await requestToPromise(
        vocabularyScopeWordIndex.get([
          vocabularyRecord.articleId,
          vocabularyRecord.normalizedWord,
        ])
      );
      if (existingRecord) {
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
