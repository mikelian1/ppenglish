export function normalizeVocabularyWord(word) {
  return String(word || "").trim().toLowerCase();
}

export function getVocabularySortTimeValue(record) {
  const rawTime = record && (record.addedAt || record.createdAt || record.updatedAt);
  const timestamp = Date.parse(rawTime);
  return Number.isFinite(timestamp) ? rawTime : "";
}

function getVocabularySortTime(record) {
  const rawTime = getVocabularySortTimeValue(record);
  const timestamp = Date.parse(rawTime);
  return Number.isFinite(timestamp) ? timestamp : -Infinity;
}

export function compareVocabularyRecords(a, b) {
  const timeA = getVocabularySortTime(a);
  const timeB = getVocabularySortTime(b);

  if (timeA !== timeB) {
    return timeB > timeA ? 1 : -1;
  }

  const stableKeyA = String((a && (a.id || a.word)) || "");
  const stableKeyB = String((b && (b.id || b.word)) || "");
  return stableKeyA.localeCompare(stableKeyB);
}

export function createVocabularyRecord(rawWord, addedAt) {
  return {
    word: normalizeVocabularyWord(rawWord),
    addedAt: addedAt || new Date().toISOString(),
  };
}

export function normalizeVocabularyRecordForImport(rawRecord, fallbackAddedAt) {
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

export function normalizeVocabularyRecordForExport(record) {
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
