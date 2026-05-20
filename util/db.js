import { normalizeVocabularyRecordForImport } from "./vocabularyModel";

export const DB_NAME = "ppdb";
export const DB_VERSION = 5;
export const ARTICLE_STORE = "articles";
export const VOCABULARY_STORE = "vocabulary";
export const VOCABULARY_NORMALIZED_WORD_INDEX = "normalizedWord";
export const VOCABULARY_ARTICLE_ID_INDEX = "articleId";
export const VOCABULARY_ARTICLE_WORD_INDEX = "articleIdNormalizedWord";

function ensureVocabularyIndexes(store) {
  if (!store.indexNames.contains(VOCABULARY_NORMALIZED_WORD_INDEX)) {
    store.createIndex(VOCABULARY_NORMALIZED_WORD_INDEX, "normalizedWord");
  }
  if (!store.indexNames.contains(VOCABULARY_ARTICLE_ID_INDEX)) {
    store.createIndex(VOCABULARY_ARTICLE_ID_INDEX, "articleId");
  }
  if (!store.indexNames.contains(VOCABULARY_ARTICLE_WORD_INDEX)) {
    store.createIndex(
      VOCABULARY_ARTICLE_WORD_INDEX,
      ["articleId", "normalizedWord"],
      { unique: true }
    );
  }
}

function createVocabularyStore(db) {
  const store = db.createObjectStore(VOCABULARY_STORE, { keyPath: "id" });
  ensureVocabularyIndexes(store);
  return store;
}

function migrateVocabularyStore(db, transaction) {
  const oldStore = transaction.objectStore(VOCABULARY_STORE);
  const getAllRequest = oldStore.getAll();

  // Keep the migration inside the versionchange transaction; do not use await here.
  getAllRequest.onsuccess = function (event) {
    const seenScopeWords = new Set();
    const vocabularyRecords = (event.target.result || [])
      .map((record) =>
        normalizeVocabularyRecordForImport(record, new Date().toISOString())
      )
      .filter(Boolean)
      .filter((record) => {
        const scopeWordKey = `${record.articleId}\u0000${record.normalizedWord}`;
        if (seenScopeWords.has(scopeWordKey)) return false;
        seenScopeWords.add(scopeWordKey);
        return true;
      });

    db.deleteObjectStore(VOCABULARY_STORE);
    const newStore = createVocabularyStore(db);
    vocabularyRecords.forEach((record) => {
      newStore.put(record);
    });
  };
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
        db.createObjectStore(ARTICLE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(VOCABULARY_STORE)) {
        createVocabularyStore(db);
      } else {
        const vocabularyStore = event.target.transaction.objectStore(
          VOCABULARY_STORE
        );
        if (vocabularyStore.keyPath === "id") {
          ensureVocabularyIndexes(vocabularyStore);
        } else {
          migrateVocabularyStore(db, event.target.transaction);
        }
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

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

export function transactionToPromise(transaction) {
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
