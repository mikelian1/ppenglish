export function normalizeVocabularyWord(word) {
  return String(word || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")
    .toLowerCase();
}

export function getVocabularySortTimeValue(record) {
  const rawTime = record && (record.addedAt || record.createdAt || record.updatedAt);
  const timestamp = Date.parse(rawTime);
  return Number.isFinite(timestamp) ? rawTime : "";
}

export function createVocabularyId() {
  return `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeVocabularyTextField(value) {
  return value ? String(value) : "";
}

function normalizeVocabularyId(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : createVocabularyId();
}

function normalizeVocabularyRecordOptions(options) {
  if (typeof options === "string") {
    return { addedAt: options };
  }

  return options && typeof options === "object" ? options : {};
}

function getVocabularyAddedAt(record, fallbackAddedAt) {
  return (
    getVocabularySortTimeValue(record) ||
    fallbackAddedAt ||
    new Date().toISOString()
  );
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

export function createVocabularyRecord(rawWord, options) {
  const recordOptions = normalizeVocabularyRecordOptions(options);
  const normalizedWord = normalizeVocabularyWord(rawWord);
  if (!normalizedWord) {
    return null;
  }

  return {
    id: normalizeVocabularyId(recordOptions.id),
    word: normalizedWord,
    normalizedWord,
    articleId: normalizeVocabularyTextField(recordOptions.articleId),
    segmentId: normalizeVocabularyTextField(recordOptions.segmentId),
    context: normalizeVocabularyTextField(recordOptions.context),
    note: normalizeVocabularyTextField(recordOptions.note),
    addedAt: getVocabularyAddedAt(recordOptions),
  };
}

export function normalizeVocabularyRecordForImport(rawRecord, fallbackAddedAt) {
  if (typeof rawRecord === "string") {
    return createVocabularyRecord(rawRecord, { addedAt: fallbackAddedAt });
  }

  const normalizedWord = normalizeVocabularyWord(rawRecord && rawRecord.word);
  if (!normalizedWord) {
    return null;
  }

  return {
    ...rawRecord,
    id: normalizeVocabularyId(rawRecord && rawRecord.id),
    word: normalizedWord,
    normalizedWord,
    articleId: normalizeVocabularyTextField(rawRecord && rawRecord.articleId),
    segmentId: normalizeVocabularyTextField(rawRecord && rawRecord.segmentId),
    context: normalizeVocabularyTextField(rawRecord && rawRecord.context),
    note: normalizeVocabularyTextField(rawRecord && rawRecord.note),
    addedAt: getVocabularyAddedAt(rawRecord, fallbackAddedAt),
  };
}

export function normalizeVocabularyRecordForExport(record) {
  const normalizedWord = normalizeVocabularyWord(record && record.word);
  if (!normalizedWord) {
    return null;
  }

  const addedAt = getVocabularySortTimeValue(record);
  const exportedRecord = {
    id: normalizeVocabularyId(record.id),
    word: normalizedWord,
    normalizedWord,
    articleId: normalizeVocabularyTextField(record.articleId),
    segmentId: normalizeVocabularyTextField(record.segmentId),
    context: normalizeVocabularyTextField(record.context),
    note: normalizeVocabularyTextField(record.note),
  };

  if (addedAt) {
    exportedRecord.addedAt = addedAt;
  }

  return exportedRecord;
}
