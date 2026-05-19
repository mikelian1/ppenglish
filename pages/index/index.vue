<template>
  <div class="con">
    <Nav class="nav">
      <button
        type="button"
        class="info-button"
        aria-label="查看功能说明"
        title="功能说明"
        @click="$router.push('/about')"
      >
        i
      </button>
      <a
        class="github-button"
        href="https://github.com/mikelian1/ppenglish"
        target="_blank"
        rel="noopener"
        aria-label="打开 GitHub 项目"
        title="GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.35 9.35 0 0 1 12 7c.85 0 1.7.12 2.5.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.2 10.2 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
          ></path>
        </svg>
      </a>
    </Nav>
    <section class="local-library">
      <div class="library-head">
        <div>
          <h1>本地文章库</h1>
          <p>粘贴英文文章、生成中文译文，并保存在当前浏览器的 IndexedDB。</p>
        </div>
        <div class="library-actions">
          <button type="button" @click="$router.push('/new')">新建文章</button>
          <button
            type="button"
            :disabled="exporting || localLoading || !localArticles.length"
            @click="exportLocalArticles"
          >
            {{ exporting ? "导出中..." : "导出 JSON" }}
          </button>
          <button
            type="button"
            :disabled="importing"
            @click="openImportPicker"
          >
            {{ importing ? "导入中..." : "导入 JSON" }}
          </button>
          <input
            ref="importFileInput"
            type="file"
            accept=".json,application/json"
            class="import-file-input"
            @change="importLocalArticles"
          />
        </div>
      </div>

      <p v-if="localMessage" class="local-message">{{ localMessage }}</p>
      <p v-if="localError" class="local-error">{{ localError }}</p>

      <div v-if="localLoading" class="local-empty">正在读取本地文章...</div>
      <div v-else-if="!localArticles.length" class="local-empty">
        还没有本地文章。点击“新建文章”粘贴第一篇。
      </div>
      <div v-else class="local-list">
        <article
          v-for="article in localArticles"
          :key="article.id"
          class="local-item"
        >
          <button type="button" class="local-open" @click="openArticle(article.id)">
            <span>{{ article.title }}</span>
            <small>
              {{ article.segments.length }} 段 · {{ article.status }} ·
              {{ formatDate(article.updatedAt) }}
            </small>
          </button>
          <button
            type="button"
            class="delete-local"
            @click="removeLocalArticle(article)"
          >
            删除
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<script>
import {
  deleteArticle,
  exportArticles,
  importArticles,
  listArticles,
} from "../../util/articleStorage";

export default {
  data() {
    return {
      localArticles: [],
      localLoading: true,
      exporting: false,
      importing: false,
      localMessage: "",
      localError: "",
    };
  },
  mounted() {
    document.body.style.backgroundColor = "#fefefe";
    this.loadLocalArticles();
  },
  methods: {
    async loadLocalArticles() {
      this.localLoading = true;
      this.localError = "";
      try {
        this.localArticles = await listArticles();
      } catch (error) {
        this.localError = error.message || "读取本地文章失败。";
      } finally {
        this.localLoading = false;
      }
    },
    openArticle(id) {
      this.$router.push({ path: "/reader", query: { id } });
    },
    formatDate(value) {
      if (!value) return "";
      return new Date(value).toLocaleString();
    },
    formatExportTimestamp(date) {
      const pad = (value) => String(value).padStart(2, "0");
      return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        "-",
        pad(date.getHours()),
        pad(date.getMinutes()),
      ].join("");
    },
    downloadJson(payload) {
      const jsonText = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ppenglish-articles-${this.formatExportTimestamp(
        new Date()
      )}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, "utf-8");
      });
    },
    async exportLocalArticles() {
      this.localMessage = "";
      this.localError = "";
      this.exporting = true;

      try {
        const payload = await exportArticles();
        this.downloadJson(payload);
        this.localMessage = `已导出 ${payload.articles.length} 篇文章，${payload.vocabulary.length} 个生词。`;
      } catch (error) {
        this.localError = error.message || "导出失败。";
      } finally {
        this.exporting = false;
      }
    },
    openImportPicker() {
      this.localMessage = "";
      this.localError = "";
      if (this.$refs.importFileInput) {
        this.$refs.importFileInput.click();
      }
    },
    async importLocalArticles(event) {
      const input = event.target;
      const file = input.files && input.files[0];
      if (!file) return;

      this.localMessage = "";
      this.localError = "";
      this.importing = true;

      try {
        const fileText = await this.readFileAsText(file);
        let payload;
        try {
          payload = JSON.parse(fileText);
        } catch (error) {
          throw new Error("JSON 解析失败，请确认文件内容是有效 JSON。");
        }

        const result = await importArticles(payload);
        this.localMessage = `已导入 ${result.imported} 篇，跳过重复 ${result.skipped} 篇；新增生词 ${result.vocabularyImported} 个，跳过重复 ${result.vocabularySkipped} 个。`;
        await this.loadLocalArticles();
      } catch (error) {
        this.localError = error.message || "导入失败。";
      } finally {
        this.importing = false;
        input.value = "";
      }
    },
    async removeLocalArticle(article) {
      const confirmed = window.confirm(`删除《${article.title}》？`);
      if (!confirmed) return;

      this.localMessage = "";
      this.localError = "";
      try {
        await deleteArticle(article.id);
        this.localMessage = "文章已删除。";
        await this.loadLocalArticles();
      } catch (error) {
        this.localError = error.message || "删除失败。";
      }
    },
  },
};
</script>

<style scoped>
.con {
  max-width: 65rem;
  margin: 0 auto;
}
.local-library {
  margin: 1.2rem 0 2rem;
  padding-bottom: 1.5rem;
}
.library-head {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}
.library-head h1 {
  font-size: 1.8rem;
  margin: 0 0 0.35rem;
}
.library-head p,
.local-empty,
.local-message {
  color: #667085;
}
.local-error {
  color: #b42318;
}
.library-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
button {
  background: #42677d;
  border: 1px solid #36586c;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  padding: 0.55rem 0.75rem;
  transition: background-color 0.16s ease, border-color 0.16s ease,
    color 0.16s ease;
}
button:not(:disabled):not(.local-open):not(.delete-local):hover {
  background-color: #36586c;
  border-color: #2f4d5f;
}
.info-button {
  align-items: center;
  background: #111;
  border-color: #111;
  border-radius: 50%;
  box-sizing: border-box;
  color: #fff;
  display: inline-flex;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  font-style: italic;
  font-weight: 700;
  height: 1.8125rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transform: translateY(-0.12rem);
  width: 1.8125rem;
}
.github-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: #111;
  display: inline-flex;
  height: 2.175rem;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  transform: translateY(-0.12rem);
  width: 2.175rem;
}
.github-button svg {
  height: 2.175rem;
  width: 2.175rem;
}
.info-button:not(:disabled):hover {
  background: #000;
  border-color: #000;
  color: #fff;
}
.github-button:hover {
  background: transparent;
  color: #000;
  text-decoration: none;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.import-file-input {
  display: none;
}
.local-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 1rem;
}
.local-item {
  align-items: center;
  background: #fafafa;
  border: 1px solid #eaecf0;
  border-radius: 6px;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0.65rem;
}
.local-open {
  background: transparent;
  border-color: transparent;
  color: #222;
  display: grid;
  gap: 0.25rem;
  justify-items: start;
  min-width: 0;
  padding: 0;
  text-align: left;
}
.local-open:hover {
  background: transparent;
  color: #31586d;
}
.local-open span {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.local-open small {
  color: #667085;
}
.delete-local {
  background: #fff5f4;
  border-color: #ffd1cc;
  color: #a04438;
}
.delete-local:hover {
  background: #ffe8e5;
  border-color: #ffb8b0;
}
@media (max-width: 700px) {
  .library-head,
  .local-item {
    grid-template-columns: 1fr;
  }
  .library-head {
    display: grid;
  }
  .library-actions {
    justify-content: flex-start;
  }
}
</style>
