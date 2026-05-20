import {
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
  return words.map((item) => item.word);
}

export async function addVocabularyWord(rawWord) {
  const word = normalizeVocabularyWord(rawWord);
  if (!word) {
    throw new Error("请输入英文单词。");
  }

  const db = await openDatabase();
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

  const db = await openDatabase();
  const transaction = db.transaction([VOCABULARY_STORE], "readwrite");
  const store = transaction.objectStore(VOCABULARY_STORE);
  await requestToPromise(store.delete(word));
  db.close();
}

export async function importVocabularyWords(words) {
  if (!Array.isArray(words)) {
    throw new Error("生词格式不正确。");
  }

  const db = await openDatabase();
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
