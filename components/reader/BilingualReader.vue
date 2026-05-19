<template>
  <article class="bilingual-reader">
    <p v-if="topMessage" class="reader-top-toast">
      {{ topMessage }}
    </p>

    <ReaderHeader
      :article="article"
      :status-text="statusText"
      @update-title="$emit('update-title', $event)"
    />

    <p v-if="selectionMessage" class="selection-message">
      {{ selectionMessage }}
    </p>

    <SegmentRow
      v-for="segment in article.segments"
      :key="segment.id"
      :segment="segment"
      :chunks="highlightChunks(segment)"
      :segment-columns="segmentColumns"
      :reading-mode="readingMode"
      :translation-label="segmentLabel(segment)"
      :is-highlight-mode="isHighlightMode"
      :is-manual-editing="isManualEditing(segment)"
      :manual-translation="manualTranslation"
      @source-mouseup="handleSourceMouseup($event, segment)"
      @highlight-click="handleHighlightClick($event, segment)"
      @lookup-link-opened="handleLookupLinkOpened($event, segment)"
      @open-google-translate="openGoogleTranslate(segment)"
      @start-manual-translation="startManualTranslation(segment)"
      @manual-translation-input="manualTranslation = $event"
      @save-manual-translation="saveManualTranslation(segment)"
      @cancel-manual-translation="cancelManualTranslation"
    />
  </article>
</template>

<script>
import ReaderHeader from "./ReaderHeader.vue";
import SegmentRow from "./SegmentRow.vue";
import { addVocabularyWord } from "../../util/articleStorage";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  LOOKUP_HIGHLIGHT_COLOR,
  buildHighlightChunks,
  createHighlightId,
  normalizeHighlights,
  trimSelectionOffsets,
} from "../../util/highlightUtils";

function closestElement(node, selector) {
  if (!node) return null;

  let current =
    node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

  while (current) {
    if (current.matches && current.matches(selector)) return current;
    current = current.parentElement;
  }

  return null;
}

export default {
  name: "ReaderBilingualReader",
  components: {
    ReaderHeader,
    SegmentRow,
  },
  props: {
    article: {
      type: Object,
      required: true,
    },
    gridTemplateColumns: {
      type: String,
      default: "repeat(2, 1fr)",
    },
    readingMode: {
      type: String,
      default: "bilingual-double",
    },
    mode: {
      type: String,
      default: "lookup",
    },
  },
  data() {
    return {
      selectionMessage: "",
      selectionMessageTimer: null,
      topMessage: "",
      topMessageTimer: null,
      pendingVocabularyWord: "",
      vocabularySaving: false,
      suppressHighlightClick: false,
      highlightHistory: [],
      manualSegmentId: null,
      manualTranslation: "",
    };
  },
  computed: {
    isHighlightMode() {
      return this.mode === "highlight";
    },
    canUndoHighlight() {
      return this.highlightHistory.length > 0;
    },
    isDoubleColumnMode() {
      return this.readingMode === "bilingual-double";
    },
    segmentColumns() {
      return this.isDoubleColumnMode
        ? "minmax(0, 1fr) minmax(0, 1fr)"
        : "1fr";
    },
    statusText() {
      const statusMap = {
        draft: "草稿",
        translating: "生成中",
        translated: "已翻译",
        error: "有错误",
      };
      return statusMap[this.article.status] || this.article.status;
    },
  },
  watch: {
    mode(nextMode, previousMode) {
      if (nextMode !== previousMode) {
        this.clearSelection();
      }
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeydown);
    window.clearTimeout(this.selectionMessageTimer);
    window.clearTimeout(this.topMessageTimer);
  },
  methods: {
    async handleKeydown(event) {
      const target = event.target;
      const tag = target && target.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tag === "BUTTON" ||
        tag === "A" ||
        (target && target.isContentEditable);

      if (isEditable) return;

      const key = event.key && event.key.toLowerCase();
      const isUndoShortcut =
        key === "z" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey;

      if (isUndoShortcut) {
        if (this.canUndoHighlight) {
          event.preventDefault();
          this.undoHighlight();
        }
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (key === "enter") {
        if (this.isHighlightMode && this.pendingVocabularyWord) {
          event.preventDefault();
          await this.addPendingVocabularyWord();
        }
        return;
      }

      if (key === "h") {
        event.preventDefault();
        this.toggleMode();
      }
    },
    toggleMode() {
      this.$emit("update:mode", this.isHighlightMode ? "lookup" : "highlight");
      this.clearSelection();
    },
    segmentLabel(segment) {
      if (segment.status === "done") return segment.provider || "done";
      if (segment.status === "error") return "error";
      if (segment.status === "translating") return "生成中";
      return "pending";
    },
    isManualEditing(segment) {
      return this.manualSegmentId === segment.id;
    },
    openGoogleTranslate(segment) {
      const url = `https://translate.google.com/?sl=en&tl=zh-CN&text=${encodeURIComponent(
        segment.source || ""
      )}&op=translate`;
      window.open(url, "_blank", "noopener");
    },
    startManualTranslation(segment) {
      if (this.isManualEditing(segment)) {
        this.cancelManualTranslation();
        return;
      }

      this.manualSegmentId = segment.id;
      this.manualTranslation = segment.translation || "";
    },
    cancelManualTranslation() {
      this.manualSegmentId = null;
      this.manualTranslation = "";
    },
    saveManualTranslation(segment) {
      const translation = this.manualTranslation.trim();
      if (!translation) {
        this.showSelectionMessage("请先粘贴译文");
        return;
      }

      this.$emit("save-manual-translation", {
        segmentId: segment.id,
        translation,
        provider: "google-translate-manual",
      });
      this.cancelManualTranslation();
      this.showSelectionMessage("已保存手动译文");
    },
    highlightChunks(segment) {
      return buildHighlightChunks(segment, DEFAULT_HIGHLIGHT_COLOR);
    },
    normalizedHighlights(highlights, sourceLength) {
      return normalizeHighlights(
        highlights,
        sourceLength,
        DEFAULT_HIGHLIGHT_COLOR
      );
    },
    handleSourceMouseup(event, segment) {
      if (!this.isHighlightMode) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const segmentEl = event.currentTarget;
      const offsets = this.getSelectionOffsetsWithinSegment(selection, segmentEl);
      if (!offsets) {
        this.showSelectionMessage("暂不支持跨段高亮");
        this.clearSelection();
        return;
      }

      let start = Math.min(offsets.start, offsets.end);
      let end = Math.max(offsets.start, offsets.end);
      const trimmedOffsets = trimSelectionOffsets(segment, start, end);
      start = trimmedOffsets.start;
      end = trimmedOffsets.end;
      const selectedText = (segment.source || "").slice(start, end);

      if (!selectedText.trim()) {
        this.clearSelection();
        return;
      }

      this.addHighlight(segment, start, end);
      this.pendingVocabularyWord = this.normalizeHighlightedText(selectedText);
      this.suppressHighlightClick = true;
      window.setTimeout(() => {
        this.suppressHighlightClick = false;
      }, 0);
      this.clearSelection();
    },
    getSelectionOffsetsWithinSegment(selection, segmentEl) {
      if (!selection.rangeCount) return null;

      const range = selection.getRangeAt(0);
      if (
        !segmentEl.contains(range.startContainer) ||
        !segmentEl.contains(range.endContainer)
      ) {
        return null;
      }

      const start = this.getPointOffsetWithinSegment(
        range.startContainer,
        range.startOffset,
        segmentEl,
        "start"
      );
      const end = this.getPointOffsetWithinSegment(
        range.endContainer,
        range.endOffset,
        segmentEl,
        "end"
      );

      if (start === null || end === null) return null;
      return { start, end };
    },
    getPointOffsetWithinSegment(container, offset, segmentEl, boundary) {
      if (!container) return null;

      const tokenEl = closestElement(container, ".source-token");
      if (tokenEl && segmentEl.contains(tokenEl)) {
        return this.getOffsetInsideToken(tokenEl, container, offset);
      }

      if (container.nodeType === Node.TEXT_NODE) {
        return this.getElementBoundaryOffset(
          container.parentNode,
          this.nodeIndex(container) + (offset > 0 ? 1 : 0),
          segmentEl,
          boundary
        );
      }

      if (container.nodeType === Node.ELEMENT_NODE) {
        return this.getElementBoundaryOffset(
          container,
          offset,
          segmentEl,
          boundary
        );
      }

      return null;
    },
    getOffsetInsideToken(tokenEl, container, offset) {
      if (typeof document === "undefined" || !document.createRange) {
        if (container.nodeType === Node.TEXT_NODE) {
          return this.clampSourceOffset(
            this.getTokenStart(tokenEl) + offset,
            tokenEl
          );
        }
        return offset <= 0
          ? this.getTokenStart(tokenEl)
          : this.getTokenEnd(tokenEl);
      }

      const range = document.createRange();
      try {
        range.setStart(tokenEl, 0);
        range.setEnd(container, offset);
        return this.clampSourceOffset(
          this.getTokenStart(tokenEl) + range.toString().length,
          tokenEl
        );
      } catch (error) {
        return null;
      } finally {
        if (range.detach) range.detach();
      }
    },
    getElementBoundaryOffset(container, offset, segmentEl, boundary) {
      if (!container || !segmentEl.contains(container)) return null;

      if (typeof document === "undefined" || !document.createRange) {
        return null;
      }

      const tokens = Array.from(segmentEl.querySelectorAll(".source-token"));
      if (!tokens.length) return null;

      const boundaryRange = document.createRange();
      try {
        boundaryRange.setStart(container, offset);
        boundaryRange.collapse(true);
      } catch (error) {
        if (boundaryRange.detach) boundaryRange.detach();
        return null;
      }

      let previousToken = null;
      let nextToken = null;

      try {
        for (const token of tokens) {
          const relation = this.getBoundaryRelationToToken(
            boundaryRange,
            token
          );

          if (relation === "before") {
            nextToken = token;
            break;
          }
          if (relation === "after") {
            previousToken = token;
            continue;
          }
          if (relation === "start") {
            return boundary === "end" && previousToken
              ? this.getTokenEnd(previousToken)
              : this.getTokenStart(token);
          }
          if (relation === "end") {
            return this.getTokenEnd(token);
          }

          const measuredOffset = token.contains(container)
            ? this.getOffsetInsideToken(token, container, offset)
            : null;
          if (measuredOffset !== null) return measuredOffset;

          return boundary === "end"
            ? this.getTokenEnd(token)
            : this.getTokenStart(token);
        }

        if (boundary === "start" && nextToken) {
          return this.getTokenStart(nextToken);
        }
        if (boundary === "end" && previousToken) {
          return this.getTokenEnd(previousToken);
        }

        if (nextToken) return this.getTokenStart(nextToken);
        if (previousToken) return this.getTokenEnd(previousToken);

        return null;
      } finally {
        if (boundaryRange.detach) boundaryRange.detach();
      }
    },
    getBoundaryRelationToToken(boundaryRange, tokenEl) {
      const range = document.createRange();
      try {
        range.selectNodeContents(tokenEl);

        const compareStart = boundaryRange.compareBoundaryPoints(0, range);
        if (compareStart < 0) return "before";

        const compareEnd = boundaryRange.compareBoundaryPoints(1, range);
        if (compareEnd > 0) return "after";
        if (compareStart === 0) return "start";
        if (compareEnd === 0) return "end";

        return "inside";
      } catch (error) {
        return "after";
      } finally {
        if (range.detach) range.detach();
      }
    },
    nodeIndex(node) {
      if (!node || !node.parentNode) return 0;
      return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
    },
    getTokenStart(tokenEl) {
      return Number(tokenEl.dataset.sourceStart);
    },
    getTokenEnd(tokenEl) {
      return Number(tokenEl.dataset.sourceEnd);
    },
    clampSourceOffset(offset, tokenEl) {
      const start = this.getTokenStart(tokenEl);
      const end = this.getTokenEnd(tokenEl);
      return Math.max(start, Math.min(end, offset));
    },
    addHighlight(segment, start, end, color = DEFAULT_HIGHLIGHT_COLOR) {
      const sourceLength = (segment.source || "").length;
      const previousHighlights = this.normalizedHighlights(
        segment.highlights,
        sourceLength
      );
      const nextHighlight = {
        id: createHighlightId(),
        start,
        end,
        color,
      };
      const highlights = this.normalizedHighlights(
        [...previousHighlights, nextHighlight],
        sourceLength
      );

      this.recordHighlightChange(segment.id, previousHighlights, highlights);
      this.emitHighlights(segment.id, highlights);
    },
    normalizeHighlightedText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")
        .toLowerCase();
    },
    async addPendingVocabularyWord() {
      if (this.vocabularySaving) return;

      const word = this.pendingVocabularyWord;
      if (!word) return;

      this.vocabularySaving = true;
      try {
        const result = await addVocabularyWord(word);
        this.pendingVocabularyWord = "";
        this.showTopMessage(
          result.added
            ? `已添加 ${result.word} 至生词本`
            : `${result.word} 已在生词本中`
        );
      } catch (error) {
        this.showTopMessage(error.message || "添加生词失败");
      } finally {
        this.vocabularySaving = false;
      }
    },
    handleLookupLinkOpened(payload, segment) {
      if (!payload || this.isHighlightMode) return;

      const sourceLength = (segment.source || "").length;
      const payloadStart = Number(payload.start);
      const payloadEnd = Number(payload.end);
      if (!Number.isFinite(payloadStart) || !Number.isFinite(payloadEnd)) return;

      const start = Math.max(0, Math.min(sourceLength, payloadStart));
      const end = Math.max(0, Math.min(sourceLength, payloadEnd));
      if (start >= end) return;

      this.addHighlight(segment, start, end, LOOKUP_HIGHLIGHT_COLOR);
    },
    handleHighlightClick(event, segment) {
      if (!this.isHighlightMode || this.suppressHighlightClick) return;

      const highlightEl = closestElement(event.target, ".source-highlight");
      if (!highlightEl) return;

      const highlightId = highlightEl.dataset.highlightId;
      const sourceLength = (segment.source || "").length;
      const previousHighlights = this.normalizedHighlights(
        segment.highlights,
        sourceLength
      );
      const highlights = previousHighlights.filter(
        (highlight) => highlight.id !== highlightId
      );

      event.preventDefault();
      event.stopPropagation();
      this.recordHighlightChange(segment.id, previousHighlights, highlights);
      this.emitHighlights(segment.id, highlights);
    },
    recordHighlightChange(segmentId, before, after) {
      if (JSON.stringify(before) === JSON.stringify(after)) return;
      this.highlightHistory.push({
        segmentId,
        before: before.map((highlight) => ({ ...highlight })),
        after: after.map((highlight) => ({ ...highlight })),
      });
    },
    undoHighlight() {
      const lastChange = this.highlightHistory.pop();
      if (!lastChange) return;

      this.emitHighlights(lastChange.segmentId, lastChange.before);
      this.showTopMessage("已撤回上一步高亮操作");
    },
    emitHighlights(segmentId, highlights) {
      this.$emit("update-highlights", {
        segmentId,
        highlights,
      });
    },
    clearSelection() {
      const selection = window.getSelection && window.getSelection();
      if (selection) selection.removeAllRanges();
    },
    showSelectionMessage(message) {
      this.selectionMessage = message;
      window.clearTimeout(this.selectionMessageTimer);
      this.selectionMessageTimer = window.setTimeout(() => {
        this.selectionMessage = "";
      }, 1600);
    },
    showTopMessage(message) {
      this.topMessage = message;
      window.clearTimeout(this.topMessageTimer);
      this.topMessageTimer = window.setTimeout(() => {
        this.topMessage = "";
      }, 1600);
    },
  },
};
</script>

<style scoped>
.bilingual-reader {
  margin: 0 auto;
  max-width: 105rem;
  padding-bottom: 6rem;
}

.reader-top-toast {
  background: rgba(34, 34, 34, 0.88);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  color: #fff;
  font-size: 14px;
  left: 50%;
  margin: 0;
  padding: 0.45rem 0.85rem;
  pointer-events: none;
  position: fixed;
  top: 1rem;
  transform: translateX(-50%);
  z-index: 1200;
}

.selection-message {
  background: rgba(255, 232, 120, 0.28);
  border: 1px solid rgba(154, 107, 0, 0.28);
  border-radius: 6px;
  font-size: 14px;
  margin: -0.6rem 0 1rem;
  padding: 0.45rem 0.65rem;
}
</style>
