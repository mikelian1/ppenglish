<template>
  <div>
    <div class="toolbar">
      <button
        type="button"
        class="toolbar-button mode-button"
        :aria-pressed="String(isHighlightMode)"
        :title="isHighlightMode ? '荧光笔模式' : '单词选择模式'"
        :aria-label="isHighlightMode ? '切换到单词选择模式' : '切换到荧光笔模式'"
        @click.stop="$emit('toggle-interaction-mode')"
      >
        <span v-if="isHighlightMode" class="highlight-mode-label">莹</span>
        <svg
          v-else
          class="mouse-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 3a6 6 0 0 0-6 6v6a6 6 0 0 0 12 0V9a6 6 0 0 0-6-6Zm0 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V9a4 4 0 0 1 4-4Zm0 2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1Z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button type="button" class="toolbar-button" @click.stop="toggleToolDiv">
        Aa
      </button>
      <button
        type="button"
        class="toolbar-button"
        @click.stop="toggleVocabularyPanel"
      >
        Wd
      </button>
    </div>

    <div v-if="toolDiv" class="toolDiv" @click.stop>
      <div class="fontFamily">
        <div
          @click.stop="updateFont(1)"
          style="
            font-family: 'Helvetica', Arial, sans-serif;
            background-color: #efeff2;
          "
        >
          Aa
        </div>
        <div
          @click.stop="updateFont(2)"
          style="
            font-family: 'Georgia', Times New Roman, serif;
            background-color: #b2cff6;
          "
        >
          Aa
        </div>
      </div>
      <div class="grid reading-mode-grid">
        <div
          :class="{ active: styles.readingMode === 'bilingual-single' }"
          @click.stop="setReadingMode('bilingual-single')"
        >
          中英单栏
        </div>
        <div
          :class="{ active: styles.readingMode === 'bilingual-double' }"
          @click.stop="setReadingMode('bilingual-double')"
        >
          中英双栏
        </div>
        <div
          :class="{ active: styles.readingMode === 'english-only' }"
          @click.stop="setReadingMode('english-only')"
        >
          仅英文
        </div>
      </div>
      <div class="option">
        <span @click.stop="decreFontSize()">
          <svg viewBox="0 0 1024 1024" width="36" height="36">
            <path
              d="M128 503.467c0-17.067 17.067-34.134 34.133-34.134h699.734c17.066 0 34.133 17.067 34.133 34.134S878.933 537.6 861.867 537.6H162.133c-17.066 0-34.133-17.067-34.133-34.133z"
              fill="#333333"
            ></path>
          </svg>
        </span>
        <div>{{ styles.fontSize }}</div>
        <span @click.stop="increFontSize()">
          <svg viewBox="0 0 1024 1024" width="36" height="36">
            <path
              d="M861.867 469.333H537.6v-307.2c0-17.066-17.067-34.133-34.133-34.133s-34.134 17.067-34.134 34.133v307.2h-307.2c-17.066 0-34.133 17.067-34.133 34.134s17.067 34.133 34.133 34.133h307.2v324.267c0 17.066 17.067 34.133 34.134 34.133s34.133-17.067 34.133-34.133V537.6h324.267c17.066 0 34.133-17.067 34.133-34.133s-17.067-34.134-34.133-34.134z"
              fill="#333333"
            ></path>
          </svg>
        </span>
      </div>
      <div class="option">
        <span @click.stop="decreLineHeight()">
          <svg viewBox="0 0 1024 1024" width="36" height="36">
            <path
              d="M434.595 241.074h497.61c13.734 0 24.881-11.147 24.881-24.881s-11.147-24.88-24.88-24.88h-497.61c-13.735 0-24.882 11.145-24.882 24.88 0 13.734 11.147 24.88 24.881 24.88zM267.796 693.175h-0.1l-57.025-57.025v201.425H160.91V636.15l-57.026 57.025c-9.703 9.703-25.477 9.703-35.181 0-9.703-9.703-9.703-25.478 0-35.18l99.521-99.523c4.876-4.876 11.246-7.264 17.616-7.264a24.991 24.991 0 0 1 17.615 7.264l99.521 99.522c9.703 9.703 9.703 25.478 0 35.181-9.7 9.703-25.476 9.703-35.179 0zM103.883 335.177l57.026 57.026V190.678h49.761v201.525l57.026-57.026c4.876-4.876 11.246-7.266 17.615-7.266a24.99 24.99 0 0 1 17.615 7.266c9.703 9.703 9.703 25.478 0 35.181l-99.521 99.523c-9.703 9.703-25.479 9.703-35.182 0l-99.521-99.523c-9.703-9.703-9.703-25.478 0-35.181 9.704-9.703 25.477-9.703 35.181 0z m828.323 453.268h-497.61c-13.735 0-24.882 11.147-24.882 24.88s11.147 24.881 24.881 24.881h497.61c13.734 0 24.881-11.146 24.881-24.88s-11.146-24.88-24.88-24.88z m0-398.088h-497.61c-13.735 0-24.882 11.146-24.882 24.88s11.147 24.88 24.881 24.88h497.61c13.734 0 24.881-11.146 24.881-24.88s-11.146-24.88-24.88-24.88z m0 199.044h-497.61c-13.735 0-24.882 11.147-24.882 24.88s11.147 24.881 24.881 24.881h497.61c13.734 0 24.881-11.147 24.881-24.88S945.94 589.4 932.206 589.4z"
              fill="#333333"
            ></path>
          </svg>
        </span>
        <div>{{ styles.lineHeight }}</div>
        <span @click.stop="increLineHeight()">
          <svg viewBox="0 0 1024 1024" width="36" height="36">
            <path
              d="M214.157992 820.759311l96.835378-96.843892c9.444654-9.43614 9.444654-24.7872 0-34.229422-9.441005-9.444654-24.7872-9.444654-34.233071 0l-55.489321 55.484455v-195.996341H172.852073v195.996341l-55.485671-55.484455h-0.099738c-9.439789-9.444654-24.790849-9.444654-34.231854 0-9.441005 9.442222-9.441005 24.793282 0 34.234287l96.839026 96.839027a24.293378 24.293378 0 0 0 12.788293 6.656869 251.382276 251.382276 0 0 1 17.384732-3.375263 24.042818 24.042818 0 0 0 4.111131-3.281606z"
              fill="#333333"
            ></path>
            <path
              d="M183.983751 552.551806a252.833335 252.833335 0 0 0 17.384732-3.375263 24.283648 24.283648 0 0 0-4.35561-0.40868 24.220399 24.220399 0 0 0-13.029122 3.783943zM100.173847 343.178477c6.194672 0 12.395425-2.328019 17.14147-7.069199l55.48932-55.489321v196.091214h48.420122V280.619957l55.48932 55.489321c9.441005 9.439789 24.7872 9.439789 34.233071 0 9.439789-9.445871 9.439789-24.792065 0-34.233071l-96.840243-96.843892c-9.439789-9.441005-24.790849-9.441005-34.23672 0l-96.834161 96.843892c-9.445871 9.441005-9.445871 24.7872 0 34.233071a24.295811 24.295811 0 0 0 17.137821 7.069199zM439.064828 246.988961h484.20243c13.362392 0 24.204587-10.847061 24.204587-24.211886 0-13.361175-10.842196-24.208236-24.204587-24.208236H439.064828c-13.359959 0-24.20702 10.847061-24.20702 24.208236 0 13.364824 10.847061 24.211885 24.20702 24.211886zM923.267258 779.60908H439.064828c-13.359959 0-24.20702 10.847061-24.20702 24.208236 0 13.363608 10.847061 24.210669 24.20702 24.210669h484.20243c13.362392 0 24.204587-10.847061 24.204587-24.210669 0-13.361175-10.842196-24.208236-24.204587-24.208236zM923.267258 585.926161H439.064828c-13.359959 0-24.20702 10.847061-24.20702 24.211886 0 13.361175 10.847061 24.213101 24.20702 24.213101h484.20243c13.362392 0 24.204587-10.847061 24.204587-24.213101 0-13.359959-10.842196-24.211885-24.204587-24.211886zM923.267258 392.248108H439.064828c-13.359959 0-24.20702 10.847061-24.20702 24.211886 0 13.359959 10.847061 24.20702 24.20702 24.20702h484.20243c13.362392 0 24.204587-10.847061 24.204587-24.20702 0-13.364824-10.842196-24.211885-24.204587-24.211886z"
              fill="#333333"
            ></path>
          </svg>
        </span>
      </div>
      <div class="theme-option">
        <div
          v-for="theme in readerThemeOptions"
          :key="theme.id"
          :style="{ backgroundColor: theme.backgroundColor, color: theme.color }"
          @click.stop="toggleTheme(theme.id)"
        >
          {{ theme.name }}
        </div>
      </div>
    </div>

    <div v-if="vocabularyPanel" class="vocabulary-panel" @click.stop>
      <div class="vocabulary-title">生词本</div>
      <form class="vocabulary-form" @submit.prevent="addWord">
        <input
          ref="vocabularyInput"
          v-model="vocabularyInput"
          type="text"
          autocomplete="off"
          placeholder="word"
        />
        <button
          type="submit"
          class="vocabulary-action-button"
          :disabled="vocabularySaving"
        >
          添加
        </button>
      </form>
      <p v-if="vocabularyError" class="vocabulary-error">
        {{ vocabularyError }}
      </p>
      <p v-else-if="vocabularyMessage" class="vocabulary-message">
        {{ vocabularyMessage }}
      </p>
      <div v-if="vocabularyLoading" class="vocabulary-empty">读取中...</div>
      <div v-else-if="!vocabularyWords.length" class="vocabulary-empty">
        暂无生词
      </div>
      <div v-else class="vocabulary-list">
        <div v-for="word in vocabularyWords" :key="word" class="vocabulary-word">
          <span>{{ word }}</span>
          <button
            type="button"
            class="vocabulary-action-button"
            :disabled="vocabularyDeletingWord === word"
            @click.stop="removeWord(word)"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 

<script>
import { getReaderTheme, READER_THEME_OPTIONS } from "~/util/readerThemes";
import {
  normalizeReadingStyles,
  READING_MODES,
} from "~/util/readingModes";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  listVocabularyWords,
} from "~/util/articleStorage";

export default {
  props: {
    styles: {
      type: Object,
    },
    interactionMode: {
      type: String,
      default: "lookup",
    },
  },
  data() {
    return {
      toolDiv: false,
      vocabularyPanel: false,
      vocabularyWords: [],
      vocabularyInput: "",
      vocabularyLoading: false,
      vocabularySaving: false,
      vocabularyDeletingWord: "",
      vocabularyError: "",
      vocabularyMessage: "",
    };
  },
  computed: {
    isHighlightMode() {
      return this.interactionMode === "highlight";
    },
    readerThemeOptions() {
      return READER_THEME_OPTIONS;
    },
  },
  watch: {
    styles: {
      handler(newStyles) {
        if (process.client) {
          const normalizedStyles = normalizeReadingStyles(
            newStyles,
            this.styles
          );
          localStorage.setItem("styles", JSON.stringify(normalizedStyles));
        }
      },
      deep: true,
    },
  },
  mounted() {
    let savedStyles = null;
    try {
      savedStyles = JSON.parse(localStorage.getItem("styles"));
    } catch (error) {
      savedStyles = null;
    }

    const nextStyles = normalizeReadingStyles(savedStyles, this.styles);
    document.body.style.backgroundColor =
      nextStyles.backgroundColor || this.styles.backgroundColor || "#222";
    this.$emit("update:styles", nextStyles);
    document.addEventListener("click", this.handleOutsideClick);
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleOutsideClick);
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    toggleToolDiv() {
      this.toolDiv = !this.toolDiv;
      if (this.toolDiv) {
        this.vocabularyPanel = false;
      }
    },
    async toggleVocabularyPanel() {
      if (this.vocabularyPanel) {
        this.vocabularyPanel = false;
        return;
      }

      await this.openVocabularyPanel();
    },
    async openVocabularyPanel() {
      this.vocabularyPanel = true;
      this.toolDiv = false;
      await this.loadVocabularyWords();
      this.focusVocabularyInput();
    },
    focusVocabularyInput() {
      this.$nextTick(() => {
        const input = this.$refs.vocabularyInput;
        if (input && typeof input.focus === "function") {
          input.focus();
        }
      });
    },
    async loadVocabularyWords() {
      this.vocabularyLoading = true;
      this.vocabularyError = "";
      try {
        this.vocabularyWords = await listVocabularyWords();
      } catch (error) {
        this.vocabularyError = error.message || "读取生词失败。";
      } finally {
        this.vocabularyLoading = false;
      }
    },
    async addWord() {
      this.vocabularyError = "";
      this.vocabularyMessage = "";
      this.vocabularySaving = true;
      try {
        const result = await addVocabularyWord(this.vocabularyInput);
        this.vocabularyInput = "";
        this.vocabularyMessage = result.added ? "已加入。" : "已存在。";
        await this.loadVocabularyWords();
      } catch (error) {
        this.vocabularyError = error.message || "添加失败。";
      } finally {
        this.vocabularySaving = false;
      }
    },
    async removeWord(word) {
      this.vocabularyError = "";
      this.vocabularyMessage = "";
      this.vocabularyDeletingWord = word;
      try {
        await deleteVocabularyWord(word);
        this.vocabularyMessage = "已删除。";
        await this.loadVocabularyWords();
      } catch (error) {
        this.vocabularyError = error.message || "删除失败。";
      } finally {
        this.vocabularyDeletingWord = "";
      }
    },
    handleOutsideClick(event) {
      const toolDivElement = this.$el.querySelector(".toolDiv");
      const vocabularyPanelElement = this.$el.querySelector(".vocabulary-panel");
      if (
        this.toolDiv &&
        toolDivElement &&
        !toolDivElement.contains(event.target)
      ) {
        this.toolDiv = false;
      }
      if (
        this.vocabularyPanel &&
        vocabularyPanelElement &&
        !vocabularyPanelElement.contains(event.target)
      ) {
        this.vocabularyPanel = false;
      }
    },
    async handleKeydown(event) {
      const target = event.target;
      const tag = target && target.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target && target.isContentEditable);

      if (isEditable || event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key && event.key.toLowerCase();
      if (key !== "w") return;

      event.preventDefault();
      await this.openVocabularyPanel();
    },
    updateStyles(nextStyles) {
      this.$emit(
        "update:styles",
        normalizeReadingStyles(
          {
            ...this.styles,
            ...nextStyles,
          },
          this.styles
        )
      );
    },
    increFontSize() {
      if (this.styles.fontSize < 10) {
        this.updateStyles({ fontSize: this.styles.fontSize + 1 });
      }
    },
    decreFontSize() {
      if (this.styles.fontSize > 0) {
        this.updateStyles({ fontSize: this.styles.fontSize - 1 });
      }
    },
    increLineHeight() {
      if (this.styles.lineHeight < 10) {
        this.updateStyles({ lineHeight: this.styles.lineHeight + 1 });
      }
    },
    decreLineHeight() {
      if (this.styles.lineHeight > 0) {
        this.updateStyles({ lineHeight: this.styles.lineHeight - 1 });
      }
    },
    toggleTheme(index) {
      const theme = getReaderTheme(index);
      const nextStyles = {
        theme: theme.id,
        backgroundColor: theme.backgroundColor,
        color: theme.color,
      };

      this.updateStyles(nextStyles);
      document.body.style.backgroundColor = nextStyles.backgroundColor;
    },
    updateFont(index) {
      this.updateStyles({
        fontFamily:
          index === 1
            ? "Helvetica, Arial, sans-serif"
            : "Georgia, Times New Roman, serif",
      });
    },
    setReadingMode(readingMode) {
      this.updateStyles(
        normalizeReadingStyles(
          {
            ...this.styles,
            readingMode,
          },
          this.styles
        )
      );
    },
    updateCollumn(index) {
      this.setReadingMode(
        index === 2
          ? READING_MODES.BILINGUAL_DOUBLE
          : READING_MODES.BILINGUAL_SINGLE
      );
    },
  },
};
</script>

<style scoped>
.toolbar {
  display: grid;
  gap: 0.15rem;
}
.toolbar-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: center;
  line-height: 1.8;
  min-height: 1.8rem;
  padding: 0;
  width: 100%;
}
.toolbar-button:hover {
  background-color: #4893f5;
}
.highlight-mode-label {
  font-weight: 400;
}
.mouse-icon {
  display: block;
  height: 1.15rem;
  width: 1.15rem;
}
.toolDiv {
  position: fixed;
  left: 45%;
  bottom: 0;
  width: 280px;
  height: 250px;
  color: #333;
  background: #f1f1f1;
  box-shadow: 0 0 8px 2px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  z-index: 1001;
}
.theme-option {
  display: flex;
  justify-content: space-evenly;
}
.theme-option > div {
  width: 50px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fontFamily {
  display: flex;
  justify-content: space-evenly;
}
.fontFamily > div {
  cursor: pointer;
  box-shadow: 0 0 0 1px;
  width: 80px;
  height: 64px;
  line-height: 1.3;
  font-size: 48px;
  color: #5b4636;
}

.grid {
  display: flex;
  gap: 8px;
  justify-content: space-evenly;
}
.grid > div {
  cursor: pointer;
  width: auto;
  min-width: 72px;
  font-size: 16px;
  padding: 0.35rem 0.45rem;
}
.grid > div:hover {
  background-color: #cab6b6;
}
.grid > div.active {
  background-color: #4893f5;
  color: #fff;
  font-weight: 700;
}

.option {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.option > span {
  height: 40px;
  width: 100%;
}
.option > span > :hover {
  background: #cab6b6;
}
.vocabulary-panel {
  --vocabulary-action-width: 44px;
  --vocabulary-scrollbar-width: 8px;
  position: fixed;
  right: 2.8rem;
  top: 38%;
  width: 240px;
  max-height: 56vh;
  color: #222;
  background: #f8fafc;
  border: 1px solid #d0d5dd;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  display: grid;
  gap: 0.6rem;
  padding: 0.75rem;
  z-index: 1001;
}
.vocabulary-title {
  font-size: 15px;
  font-weight: 700;
  text-align: left;
}
.vocabulary-form {
  align-items: center;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: minmax(0, 1fr) var(--vocabulary-action-width);
  padding-right: var(--vocabulary-scrollbar-width);
}
.vocabulary-form input {
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  font: inherit;
  line-height: 1.2;
  min-width: 0;
  padding: 0.2rem 0.5rem;
}
.vocabulary-action-button {
  align-items: center;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  box-sizing: border-box;
  color: #475467;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 12px;
  justify-content: center;
  letter-spacing: 0.25em;
  line-height: 1.2;
  padding: 0.2rem 0.2rem;
  white-space: nowrap;
  width: var(--vocabulary-action-width);
  text-indent: 0.30em;
}
.vocabulary-action-button:hover {
  background: #f2f4f7;
  border-color: #98a2b3;
}
.vocabulary-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.vocabulary-error,
.vocabulary-message,
.vocabulary-empty {
  font-size: 13px;
  margin: 0;
  text-align: left;
}
.vocabulary-error {
  color: #b42318;
}
.vocabulary-message,
.vocabulary-empty {
  color: #667085;
}
.vocabulary-list {
  display: grid;
  gap: 0.25rem;
  max-height: 36vh;
  overflow: auto;
  scrollbar-gutter: stable;
  text-align: left;
}
.vocabulary-list::-webkit-scrollbar {
  width: var(--vocabulary-scrollbar-width);
}
.vocabulary-word {
  align-items: center;
  border-bottom: 1px solid #e4e7ec;
  display: grid;
  font-size: 14px;
  gap: 0.45rem;
  grid-template-columns: minmax(0, 1fr) var(--vocabulary-action-width);
  line-height: 1.6;
  padding: 0.12rem 0;
}
.vocabulary-word span {
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .vocabulary-panel {
    right: 2.6rem;
    top: 30%;
    width: min(240px, calc(100vw - 3.4rem));
  }
}
</style>
