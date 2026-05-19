<template>
  <div class="segment-pane translation-pane" :class="{ 'dual-column': isDualColumn }">
    <div class="translation-head">
      <span class="segment-status">{{ label }}</span>
      <div class="segment-actions">
        <button type="button" @click="$emit('open-google-translate')">
          Google 重译
        </button>
        <button type="button" @click="$emit('start-manual-translation')">
          {{ isManualEditing ? "取消粘贴" : "粘贴译文" }}
        </button>
      </div>
    </div>
    <p v-if="segment.translation" class="translation-segment">
      {{ segment.translation }}
    </p>
    <p v-else class="empty-translation">暂无译文</p>
    <div v-if="isManualEditing" class="manual-translation">
      <textarea
        :value="manualTranslation"
        rows="5"
        placeholder="把 Google Translate 的新译文粘贴到这里"
        @input="$emit('manual-translation-input', $event.target.value)"
      ></textarea>
      <div class="manual-actions">
        <button type="button" @click="$emit('save-manual-translation')">
          保存译文
        </button>
        <button type="button" class="ghost-button" @click="$emit('cancel-manual-translation')">
          取消
        </button>
      </div>
    </div>
    <p v-if="segment.error" class="segment-error">{{ segment.error }}</p>
  </div>
</template>

<script>
export default {
  props: {
    segment: {
      type: Object,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    isManualEditing: {
      type: Boolean,
      default: false,
    },
    manualTranslation: {
      type: String,
      default: "",
    },
    isDualColumn: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.segment-pane {
  min-width: 0;
  position: relative;
}

.segment-pane p {
  overflow-wrap: break-word;
}

.segment-status {
  border: 1px solid currentColor;
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  line-height: 1;
  margin-bottom: 0.35rem;
  opacity: 0.48;
  padding: 4px 7px;
}

.translation-head {
  align-items: center;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.translation-head .segment-status {
  margin-bottom: 0;
}

.segment-actions,
.manual-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.segment-actions button,
.manual-actions button {
  background: var(--reader-button-bg, #222);
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--reader-button-color, #fff);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 0.45rem 0.6rem;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.segment-actions button:hover,
.manual-actions button:hover {
  background: var(--reader-button-hover-bg, #0056b3);
}

.manual-actions .ghost-button {
  background: var(--reader-secondary-button-bg, #f2f4f7);
  border-color: var(--reader-secondary-button-border, #d0d5dd);
  color: var(--reader-secondary-button-color, #344054);
}

.manual-actions .ghost-button:hover {
  background: var(--reader-secondary-button-bg, #f2f4f7);
}

.manual-translation {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.manual-translation textarea {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  color: #222;
  font: inherit;
  line-height: 1.5;
  padding: 0.65rem;
  resize: vertical;
  width: 100%;
}

.empty-translation,
.segment-error {
  opacity: 0.66;
}

.segment-error {
  color: #b42318;
  font-size: 0.8em;
}

@media (max-width: 760px) {
  .translation-head {
    align-items: flex-start;
    display: grid;
  }
}

@media (min-width: 761px) {
  .dual-column .translation-segment,
  .dual-column .empty-translation {
    transform: translateY(1em);
  }
}
</style>
