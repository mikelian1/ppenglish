<template>
  <main class="reader-page">
    <div class="reader-actions">
      <button type="button" class="ghost-button" @click="$router.push('/')">
        首页
      </button>
      <button
        v-if="article"
        type="button"
        :disabled="translating"
        @click="translateArticle"
      >
        {{ translating ? "翻译中..." : "整篇翻译" }}
      </button>
      <button
        v-if="article"
        type="button"
        class="danger-button"
        :disabled="translating"
        @click="removeArticle"
      >
        删除
      </button>
    </div>

    <p v-if="error && article" class="translation-error">{{ error }}</p>
    <p v-if="loading" class="state-message">正在读取文章...</p>
    <section v-else-if="error && !article" class="state-panel">
      <h1>无法打开文章</h1>
      <p>{{ error }}</p>
      <button type="button" @click="$router.push('/new')">新建文章</button>
    </section>
    <BilingualReader
      v-else-if="article"
      :article="article"
      :grid-template-columns="gridTemplateColumns"
      :reading-mode="readingMode"
      :mode="interactionMode"
      :highlight-color="highlightColor"
      @update:mode="$emit('update:interactionMode', $event)"
      @update-highlights="updateSegmentHighlights"
      @update-title="updateArticleTitle"
      @save-manual-translation="saveManualTranslation"
    />
  </main>
</template>

<script>
import {
  deleteArticle,
  getArticle,
  saveArticle,
} from "../../util/articleStorage";
import { DEFAULT_HIGHLIGHT_COLOR } from "../../util/highlightUtils";

export default {
  props: {
    gridTemplateColumns: {
      type: String,
      default: "repeat(2, 1fr)",
    },
    readingMode: {
      type: String,
      default: "bilingual-double",
    },
    interactionMode: {
      type: String,
      default: "lookup",
    },
    highlightColor: {
      type: String,
      default: DEFAULT_HIGHLIGHT_COLOR,
    },
  },
  data() {
    return {
      article: null,
      loading: true,
      translating: false,
      error: "",
      saveTimer: null,
      savePending: false,
    };
  },
  async mounted() {
    await this.loadArticle();
  },
  beforeDestroy() {
    window.clearTimeout(this.saveTimer);
    if (this.article && this.savePending) {
      saveArticle(this.article).catch(() => {});
    }
  },
  methods: {
    async loadArticle() {
      const id = this.$route.query.id;
      if (!id) {
        this.error = "缺少文章 id。请从首页的本地文章库打开文章。";
        this.loading = false;
        return;
      }

      try {
        const article = await getArticle(id);
        if (!article) {
          this.error = "没有找到这篇文章，可能已经被删除或尚未导入。";
        } else {
          this.article = article;
        }
      } catch (error) {
        this.error = error.message || "读取文章失败。";
      } finally {
        this.loading = false;
      }
    },
    async translateArticle() {
      if (!this.article || this.translating) return;

      const originalSegments = this.article.segments.map((segment) => ({
        ...segment,
      }));
      const hasExistingTranslation = originalSegments.some(
        (segment) => segment.translation && segment.translation.trim()
      );
      if (hasExistingTranslation) {
        const confirmed = window.confirm(
          "这篇文章已有译文。重新整篇翻译可能覆盖已有译文，确定继续吗？"
        );
        if (!confirmed) return;
      }

      this.translating = true;
      this.error = "";
      this.article = {
        ...this.article,
        status: "translating",
        updatedAt: new Date().toISOString(),
        segments: this.article.segments.map((segment) => ({
          ...segment,
          status: "translating",
          error: "",
        })),
      };

      try {
        const source = originalSegments
          .map((segment) => segment.source)
          .join("\n\n");
        const result = await this.translateArticleSource(
          source,
          originalSegments.length
        );
        const translatedParagraphs = this.splitTranslatedParagraphs(
          result.translation
        );

        if (translatedParagraphs.length !== originalSegments.length) {
          throw new Error(
            `译文段落数不匹配：原文 ${originalSegments.length} 段，译文 ${translatedParagraphs.length} 段。请重新翻译。`
          );
        }

        const translatedSegments = originalSegments.map((segment, index) => ({
          ...segment,
          translation: translatedParagraphs[index],
          status: "done",
          error: "",
          provider: result.provider,
        }));

        this.article = {
          ...this.article,
          status: "translated",
          updatedAt: new Date().toISOString(),
          segments: translatedSegments,
        };
        await saveArticle(this.article);
      } catch (error) {
        this.error = error.message || "整篇翻译失败。";
        this.article = {
          ...this.article,
          status: "error",
          updatedAt: new Date().toISOString(),
          segments: originalSegments,
        };
        await saveArticle(this.article).catch((saveError) => {
          this.error = `${this.error} ${saveError.message || "保存失败。"}`;
        });
      } finally {
        this.translating = false;
      }
    },
    splitTranslatedParagraphs(translation) {
      return (translation || "")
        .replace(/\r\n?/g, "\n")
        .trim()
        .split(/\n\s*\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    },
    async translateArticleSource(source, paragraphCount) {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          sourceLang: "en",
          targetLang: "zh-CN",
          title: this.article.title,
          paragraphCount,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "翻译接口请求失败。");
      }
      if (!result.translation) {
        throw new Error("翻译接口没有返回译文。");
      }

      return {
        provider: result.provider || "deepseek-v4-pro",
        translation: result.translation,
      };
    },
    async removeArticle() {
      if (!this.article) return;
      const confirmed = window.confirm(`删除《${this.article.title}》？`);
      if (!confirmed) return;

      try {
        await deleteArticle(this.article.id);
        window.clearTimeout(this.saveTimer);
        this.savePending = false;
        this.article = null;
        this.$router.push("/");
      } catch (error) {
        this.error = error.message || "删除失败。";
      }
    },
    updateArticleTitle(title) {
      if (!this.article) return;

      const nextTitle = (title || "").trim();
      if (!nextTitle || nextTitle === this.article.title) return;

      this.article = {
        ...this.article,
        title: nextTitle,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSaveArticle();
    },
    saveManualTranslation({ segmentId, translation, provider }) {
      if (!this.article) return;

      const segmentIndex = this.article.segments.findIndex(
        (segment) => segment.id === segmentId
      );
      if (segmentIndex === -1) return;

      const updatedSegment = {
        ...this.article.segments[segmentIndex],
        translation,
        status: "done",
        error: "",
        provider: provider || "google-translate-manual",
      };
      this.$set(this.article.segments, segmentIndex, updatedSegment);
      this.article = {
        ...this.article,
        updatedAt: new Date().toISOString(),
        segments: this.article.segments,
      };
      this.scheduleSaveArticle();
    },
    updateSegmentHighlights({ segmentId, highlights }) {
      if (!this.article) return;

      const segmentIndex = this.article.segments.findIndex(
        (segment) => segment.id === segmentId
      );
      if (segmentIndex === -1) return;

      const updatedSegment = {
        ...this.article.segments[segmentIndex],
        highlights,
      };
      this.$set(this.article.segments, segmentIndex, updatedSegment);
      this.article = {
        ...this.article,
        updatedAt: new Date().toISOString(),
        segments: this.article.segments,
      };
      this.scheduleSaveArticle();
    },
    scheduleSaveArticle() {
      window.clearTimeout(this.saveTimer);
      this.savePending = true;
      this.saveTimer = window.setTimeout(async () => {
        if (!this.article) return;

        try {
          await saveArticle(this.article);
          this.savePending = false;
        } catch (error) {
          this.error = error.message || "保存高亮失败。";
        }
      }, 400);
    },
  },
};
</script>

<style scoped>
.reader-page {
  min-height: 100vh;
}

.reader-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  margin: 0 auto 1.2rem;
  max-width: 105rem;
}

button {
  background: var(--reader-button-bg, #222);
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--reader-button-color, #fff);
  cursor: pointer;
  font-size: 14px;
  padding: 0.55rem 0.8rem;
  transition: background-color 160ms ease, border-color 160ms ease;
}

button:not(:disabled):hover {
  background: var(--reader-button-hover-bg, #0056b3);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ghost-button {
  background: var(--reader-secondary-button-bg, #f2f4f7);
  border-color: var(--reader-secondary-button-border, #d0d5dd);
  color: var(--reader-secondary-button-color, #344054);
}

.danger-button {
  background: var(--reader-danger-button-bg, #b42318);
  color: #fff;
}

.ghost-button:hover {
  background: var(--reader-secondary-button-bg, #f2f4f7);
}

.translation-error {
  color: #b42318;
  margin: 0 auto 1rem;
  max-width: 105rem;
  text-align: center;
}

.state-message,
.state-panel {
  margin: 5rem auto;
  max-width: 36rem;
  text-align: center;
}

.state-panel {
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  color: #222;
  padding: 2rem;
}
</style>
