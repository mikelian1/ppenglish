<template>
  <header class="reader-title">
    <div class="reader-title-main">
      <div
        class="title-edit-area"
        @mouseenter="handleTitleMouseenter"
        @mouseleave="handleTitleMouseleave"
      >
        <input
          v-if="showTitleInput"
          ref="titleInput"
          v-model="draftTitle"
          class="title-input"
          type="text"
          aria-label="文章标题"
          @focus="startTitleEditing"
          @click.stop
          @keydown.enter.prevent="commitTitle"
          @keydown.esc.prevent="cancelTitleEdit"
          @blur="commitTitle"
        />
        <h1
          v-else
          tabindex="0"
          role="button"
          @click="startTitleEditing"
          @focus="startTitleEditing"
          @keydown.enter.prevent="startTitleEditing"
          @keydown.space.prevent="startTitleEditing"
        >
          {{ article.title }}
        </h1>
      </div>
      <p>{{ article.segments.length }} 段 · {{ statusText }}</p>
    </div>
  </header>
</template>

<script>
export default {
  props: {
    article: {
      type: Object,
      required: true,
    },
    statusText: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      draftTitle: this.article.title,
      isTitleEditing: false,
      isTitleHovered: false,
    };
  },
  computed: {
    showTitleInput() {
      return this.isTitleEditing || this.isTitleHovered;
    },
  },
  watch: {
    "article.title"(title) {
      if (!this.isTitleEditing) {
        this.draftTitle = title;
      }
    },
  },
  methods: {
    handleTitleMouseenter() {
      this.isTitleHovered = true;
      if (!this.isTitleEditing) {
        this.draftTitle = this.article.title;
      }
    },
    handleTitleMouseleave() {
      this.isTitleHovered = false;
    },
    startTitleEditing() {
      if (!this.isTitleEditing) {
        this.draftTitle = this.article.title;
      }

      this.isTitleEditing = true;
      this.isTitleHovered = true;
      this.$nextTick(() => {
        if (this.$refs.titleInput) {
          this.$refs.titleInput.focus();
          this.$refs.titleInput.select();
        }
      });
    },
    commitTitle() {
      const title = (this.draftTitle || "").trim();
      this.isTitleEditing = false;

      if (!title) {
        this.draftTitle = this.article.title;
        return;
      }
      if (title === this.article.title) {
        this.draftTitle = this.article.title;
        return;
      }

      this.draftTitle = title;
      this.$emit("update-title", title);
    },
    cancelTitleEdit() {
      this.draftTitle = this.article.title;
      this.isTitleEditing = false;
      this.$nextTick(() => {
        if (this.$refs.titleInput) {
          this.$refs.titleInput.blur();
        }
      });
    },
  },
};
</script>

<style scoped>
.reader-title {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.reader-title-main {
  flex: 1 1 auto;
  min-width: 0;
}

.title-edit-area {
  cursor: text;
  max-width: 100%;
  min-width: 0;
}

.reader-title h1 {
  font-size: 1.65em;
  margin-bottom: 0.35rem;
  overflow-wrap: anywhere;
}

.reader-title h1:focus {
  outline: 2px solid var(--reader-focus-color, #84c5ff);
  outline-offset: 3px;
}

.title-input {
  background: var(--reader-title-input-bg, #fff);
  border: 1px solid var(--reader-secondary-button-border, #d0d5dd);
  border-radius: 6px;
  box-sizing: border-box;
  color: inherit;
  display: block;
  font: inherit;
  font-size: 1.65em;
  line-height: 1.2;
  margin-bottom: 0.35rem;
  max-width: 100%;
  min-width: 12rem;
  padding: 0.15rem 0.35rem;
  width: 100%;
}

.title-input:focus {
  border-color: var(--reader-focus-color, #84c5ff);
  box-shadow: 0 0 0 3px rgba(132, 197, 255, 0.28);
  outline: none;
}

.reader-title p {
  color: inherit;
  font-size: 0.58em;
  opacity: 0.68;
}

@media (max-width: 760px) {
  .reader-title {
    display: grid;
  }

  .title-input {
    min-width: 0;
  }
}
</style>
