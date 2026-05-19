<template>
  <main class="local-create">
    <header class="page-head">
      <button type="button" class="ghost-button" @click="$router.push('/')">
        返回首页
      </button>
      <h1>新建本地文章</h1>
      <p>粘贴英文文章后保存到本地文章库，阅读页可整篇翻译，也可逐段粘贴译文。</p>
    </header>

    <form class="create-form" @submit.prevent="save">
      <label>
        <span>标题</span>
        <input v-model.trim="title" type="text" placeholder="文章标题" />
      </label>

      <label>
        <span>英文原文</span>
        <textarea
          v-model="sourceText"
          rows="16"
          placeholder="Paste your article here..."
          @paste="handleSourcePaste"
          @input="cleanStatus = ''"
        ></textarea>
      </label>

      <div class="form-actions">
        <button
          type="button"
          class="secondary-button"
          :disabled="saving || !canSave"
          @click="cleanPdfLineBreaks"
        >
          清洗换行
        </button>
        <button type="submit" :disabled="saving || !canSave">
          {{ saving ? "保存中..." : "保存并阅读" }}
        </button>
        <p v-if="cleanStatus" class="status-message">{{ cleanStatus }}</p>
        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </form>

    <section class="preview">
      <h2>分段预览</h2>
      <p v-if="!previewSegments.length" class="empty-state">
        输入文章后会在这里显示分段结果。
      </p>
      <ol v-else>
        <li v-for="segment in previewSegments" :key="segment.id">
          {{ segment.source }}
        </li>
      </ol>
    </section>
  </main>
</template>

<script>
import { createArticle, saveArticle } from "../../util/articleStorage";
import {
  cleanPastedText,
  normalizePastedSourceText,
  segmentText,
} from "../../util/textSegmenter";

export default {
  data() {
    return {
      title: "",
      sourceText: "",
      saving: false,
      error: "",
      cleanStatus: "",
    };
  },
  computed: {
    canSave() {
      return this.sourceText.trim().length > 0;
    },
    previewSegments() {
      return segmentText(this.sourceText);
    },
  },
  methods: {
    handleSourcePaste(event) {
      const clipboardText = event.clipboardData && event.clipboardData.getData("text");
      if (!clipboardText) return;

      event.preventDefault();
      const textarea = event.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const normalizedText = normalizePastedSourceText(clipboardText);

      this.sourceText = `${this.sourceText.slice(0, start)}${normalizedText}${this.sourceText.slice(end)}`;
      this.cleanStatus = "";
      this.error = "";

      this.$nextTick(() => {
        const cursorPosition = start + normalizedText.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      });
    },
    cleanPdfLineBreaks() {
      if (!this.canSave) {
        this.error = "请先粘贴英文原文。";
        this.cleanStatus = "";
        return;
      }

      this.sourceText = cleanPastedText(this.sourceText);
      this.error = "";
      this.cleanStatus = "已清洗，可继续手动微调。";
    },
    async save() {
      if (!this.canSave) {
        this.error = "请先粘贴英文原文。";
        return;
      }

      this.saving = true;
      this.error = "";

      try {
        const article = createArticle({
          title: this.title,
          sourceText: this.sourceText,
        });
        await saveArticle(article);
        this.$router.push({ path: "/reader", query: { id: article.id } });
      } catch (error) {
        this.error = error.message || "保存失败，请稍后重试。";
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.local-create {
  color: inherit;
  margin: 0 auto;
  max-width: 72rem;
}

.page-head {
  margin-bottom: 1.5rem;
}

.page-head h1 {
  font-size: 2rem;
  margin: 0.8rem 0 0.35rem;
}

.page-head p,
.empty-state {
  color: inherit;
  opacity: 0.68;
}

.create-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
}

label span {
  color: inherit;
  font-weight: 600;
}

input,
textarea {
  background: transparent;
  border: 2px solid var(--reader-input-border, #9aa7b5);
  border-radius: 6px;
  color: inherit;
  font: inherit;
  padding: 0.75rem 0.85rem;
  width: 100%;
}

input:focus,
textarea:focus {
  border-color: var(--reader-input-focus-border, #36536b);
  outline: 2px solid var(--reader-input-focus-border, #36536b);
  outline-offset: 2px;
}

textarea {
  line-height: inherit;
  resize: vertical;
}

button {
  background: #222;
  border: 0;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  padding: 0.7rem 1rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ghost-button {
  background: #f2f4f7;
  color: #344054;
}

.secondary-button {
  background: #f2f4f7;
  color: #344054;
}

.form-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-message {
  color: #027a48;
  margin: 0;
}

.error-message {
  color: #b42318;
  margin: 0;
}

.preview {
  border-top: 1px solid #eaecf0;
  margin-top: 2rem;
  padding-top: 1.5rem;
}

.preview h2 {
  font-size: 1.2rem;
}

.preview ol {
  display: grid;
  gap: 0.75rem;
  margin-left: 1.2rem;
}

.preview li {
  list-style: decimal;
}
</style>