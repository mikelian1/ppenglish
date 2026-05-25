import {
  VOCABULARY_ARTICLE_ID_INDEX,
  VOCABULARY_ARTICLE_WORD_INDEX,
  VOCABULARY_STORE,
  openDatabase,
  requestToPromise,
} from "./db";
import {
  compareVocabularyRecords,
  createVocabularyRecord,
  normalizeVocabularyRecordForExport,
  normalizeVocabularyWord,
} from "./vocabularyModel";

function normalizeVocabularyOptions(options) {
  return options && typeof options === "object" ? options : {};
}

export async function listVocabularyRecords(options = {}) {
  const recordOptions = normalizeVocabularyOptions(options);
  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readonly");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const words =
    typeof recordOptions.articleId === "string"
      ? await requestToPromise(
          store.index(VOCABULARY_ARTICLE_ID_INDEX).getAll(recordOptions.articleId)
        )
      : await requestToPromise(store.getAll());
  db.close();
  return words
    .filter((item) => item && item.word)
    .sort(compareVocabularyRecords)
    .map(normalizeVocabularyRecordForExport)
    .filter(Boolean);
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

export async function deleteVocabularyWord(rawWord, options = {}) {
  const recordOptions = normalizeVocabularyOptions(options);
  const word = normalizeVocabularyWord(rawWord);
  if (!word) {
    throw new Error("生词不存在。");
  }

  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  const scopeWordIndex = store.index(VOCABULARY_ARTICLE_WORD_INDEX);
  const existingRecord = await requestToPromise(
    scopeWordIndex.get([recordOptions.articleId || "", word])
  );
  if (existingRecord) {
    await requestToPromise(store.delete(existingRecord.id));
  }
  db.close();
}
