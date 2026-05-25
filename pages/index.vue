<template>
  <div>
    <Aa
      v-if="showReadingToolbar"
      :styles.sync="styles"
      :interaction-mode="readerInteractionMode"
      :vocabulary-only="isHomePage"
      :style="{ backgroundColor: styles.color, color: styles.backgroundColor }"
      class="toolbar-container"
      @toggle-interaction-mode="toggleInteractionMode"
    ></Aa>
    <div class="article">
      <nuxt-child
        :style="computedStyles"
        :gridTemplateColumns="styles.gridTemplateColumns"
        :readingMode="styles.readingMode"
        :interactionMode.sync="readerInteractionMode"
        :highlightColor="styles.highlightColor"
      ></nuxt-child>
    </div>
  </div>
</template>

<script>
import {
  DEFAULT_READER_THEME,
  getReaderTheme,
  getReaderThemeByBackgroundColor,
  getReaderThemeCssVars,
} from "~/util/readerThemes";
import {
  normalizeReadingStyles,
  READING_MODES,
} from "~/util/readingModes";

export default {
  data() {
    const defaultTheme = getReaderTheme(DEFAULT_READER_THEME);

    return {
      styles: normalizeReadingStyles({
        theme: defaultTheme.id,
        fontSize: 4,
        lineHeight: 3,
        color: defaultTheme.color,
        backgroundColor: defaultTheme.backgroundColor,
        fontFamily: "Georgia, Times New Roman, serif",
        readingMode: READING_MODES.BILINGUAL_DOUBLE,
        gridTemplateColumns: "repeat(2, 1fr)",
      }),
      readerInteractionMode: "lookup",
    };
  },
  computed: {
    isHomePage() {
      return this.$route.path === "/";
    },
    showReadingToolbar() {
      return this.$route.path !== "/about";
    },
    activeThemeIndex() {
      if (this.styles.theme) return getReaderTheme(this.styles.theme).id;

      return getReaderThemeByBackgroundColor(this.styles.backgroundColor).id;
    },
    readerThemeColors() {
      return getReaderThemeCssVars(this.activeThemeIndex);
    },
    computedStyles() {
      if (this.$route.path === "/") return null;
      if (this.$route.path === "/about")
        return {
          fontSize: "18px",
          backgroundColor: "#fefefe",
          color: "#222",
        };
      return {
        fontSize: this.styles.fontSize * 2 + 16 + "px",
        lineHeight: this.styles.lineHeight * 0.2 + 1.0,
        backgroundColor: this.styles.backgroundColor,
        color: this.styles.color,
        fontFamily: this.styles.fontFamily,
        gridTemplateColumns: this.styles.gridTemplateColumns,
        ...this.readerThemeColors,
      };
    },
  },
  mounted() {
    this.syncBodyBackgroundColor();
  },
  watch: {
    "$route.path": "syncBodyBackgroundColor",
    "styles.backgroundColor": "syncBodyBackgroundColor",
  },
  methods: {
    syncBodyBackgroundColor() {
      if (!process.client) return;

      document.body.style.backgroundColor = this.isHomePage
        ? "#fefefe"
        : this.styles.backgroundColor;
    },
    toggleInteractionMode() {
      this.readerInteractionMode =
        this.readerInteractionMode === "highlight" ? "lookup" : "highlight";
    },
  },
};
</script>

<style scoped>
.toolbar-container {
  text-align: center;
  user-select: none;
  width: 2.2rem;
  font-size: 16px;
  position: fixed;
  bottom: 52%;
  right: 0;
  margin-left: auto;
  padding: 0.2rem;
  transform-origin: top right;
  box-shadow: 0 0 2px 1px;
  border-radius: 0.125rem;
  z-index: 1000;
}
</style>
