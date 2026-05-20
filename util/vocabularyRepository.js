import {
  VOCABULARY_ARTICLE_WORD_INDEX,
  VOCABULARY_STORE,
  openDatabase,
  requestToPromise,
  transactionToPromise,
} from "./db";
import {
  compareVocabularyRecords,
  createVocabularyRecord,
  normalizeVocabularyRecordForExport,
  normalizeVocabularyRecordForImport,
  normalizeVocabularyWord,
} from "./vocabularyModel";

export async function listVocabularyRecords() {
  const db = await openDatabase();
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
  const seenWords = new Set();
  return words
    .map((item) => item.word)
    .filter((word) => {
      if (seenWords.has(word)) return false;
      seenWords.add(word);
      return true;
    });
}

export async function addVocabularyWord(rawWord, options = {}) {
  const vocabularyRecord = createVocabularyRecord(rawWord, options);
  if (!vocabularyRecord) {
    throw new Error("请输入英文单词。");
  }

  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const scopeWordIndex = store.index(VOCABULARY_ARTICLE_WORD_INDEX);
  const existingRecord = await requestToPromise(
    scopeWordIndex.get([
      vocabularyRecord.articleId,
      vocabularyRecord.normalizedWord,
    ])
  );

  if (!existingRecord) {
    await requestToPromise(store.put(vocabularyRecord));
  }

  db.close();
  return {
    word: vocabularyRecord.word,
    added: !existingRecord,
    record: normalizeVocabularyRecordForExport(
      existingRecord || vocabularyRecord
    ),
  };
}

export async function deleteVocabularyWord(rawWord) {
  const word = normalizeVocabularyWord(rawWord);
  if (!word) {
    throw new Error("生词不存在。");
  }

  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const scopeWordIndex = store.index(VOCABULARY_ARTICLE_WORD_INDEX);
  const existingRecord = await requestToPromise(scopeWordIndex.get(["", word]));
  if (existingRecord) {
    await requestToPromise(store.delete(existingRecord.id));
  }
  db.close();
}

export async function importVocabularyWords(words) {
  if (!Array.isArray(words)) {
    throw new Error("生词格式不正确。");
  }

  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const scopeWordIndex = store.index(VOCABULARY_ARTICLE_WORD_INDEX);
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

      const existingRecord = await requestToPromise(
        scopeWordIndex.get([
          vocabularyRecord.articleId,
          vocabularyRecord.normalizedWord,
        ])
      );
      if (existingRecord) {
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
