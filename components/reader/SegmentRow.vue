<template>
  <section
    class="segment"
    :class="{
      failed: segment.status === 'error',
      'dual-column-segment': isDualColumn,
    }"
    :style="{ gridTemplateColumns: segmentColumns }"
  >
    <div class="segment-pane source-pane">
      <span class="segment-index">{{ segment.index + 1 }}</span>
      <p
        class="source-segment"
        :class="{ 'highlight-mode': isHighlightMode }"
        :data-segment-id="segment.id"
        @mouseup="$emit('source-mouseup', $event)"
        @click="$emit('highlight-click', $event)"
      >
        <HighlightChunk
          v-for="chunk in chunks"
          :key="chunk.key"
          :chunk="chunk"
          :lookup-disabled="isHighlightMode"
          @lookup-link-opened="$emit('lookup-link-opened', $event)"
        />
      </p>
    </div>
    <TranslationPane
      v-if="showTranslation"
      :segment="segment"
      :label="translationLabel"
      :is-manual-editing="isManualEditing"
      :manual-translation="manualTranslation"
      :is-dual-column="isDualColumn"
      @open-google-translate="$emit('open-google-translate')"
      @start-manual-translation="$emit('start-manual-translation')"
      @manual-translation-input="$emit('manual-translation-input', $event)"
      @save-manual-translation="$emit('save-manual-translation')"
      @cancel-manual-translation="$emit('cancel-manual-translation')"
    />
  </section>
</template>

<script>
import HighlightChunk from "./HighlightChunk.vue";
import TranslationPane from "./TranslationPane.vue";

export default {
  components: {
    HighlightChunk,
    TranslationPane,
  },
  props: {
    segment: {
      type: Object,
      required: true,
    },
    chunks: {
      type: Array,
      required: true,
    },
    segmentColumns: {
      type: String,
      required: true,
    },
    readingMode: {
      type: String,
      default: "bilingual-double",
    },
    translationLabel: {
      type: String,
      required: true,
    },
    isHighlightMode: {
      type: Boolean,
      default: false,
    },
    isManualEditing: {
      type: Boolean,
      default: false,
    },
    manualTranslation: {
      type: String,
      default: "",
    },
  },
  computed: {
    showTranslation() {
      return this.readingMode !== "english-only";
    },
    isDualColumn() {
      return this.readingMode === "bilingual-double";
    },
  },
};
</script>

<style scoped>
.segment {
  display: grid;
  gap: 20px;
  margin: 0 0 1.4rem;
}

.segment-pane {
  min-width: 0;
  position: relative;
}

.segment-pane p {
  overflow-wrap: break-word;
}

.source-segment {
  cursor: auto;
}

.source-segment.highlight-mode {
  cursor: text;
  user-select: text;
}

.segment-index {
  border: 1px solid currentColor;
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  line-height: 1;
  margin-bottom: 0.35rem;
  opacity: 0.48;
  padding: 4px 7px;
}

@media (max-width: 760px) {
  .segment {
    grid-template-columns: 1fr !important;
  }
}
</style>
