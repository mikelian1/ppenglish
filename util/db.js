export const DB_NAME = "ppdb";
export const DB_VERSION = 4;
export const ARTICLE_STORE = "articles";
export const VOCABULARY_STORE = "vocabulary";

export function openDatabase() {
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
