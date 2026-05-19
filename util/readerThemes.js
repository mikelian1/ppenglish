export const DEFAULT_READER_THEME = 2;

export const READER_THEMES = {
  1: {
    id: 1,
    name: "正常",
    backgroundColor: "#f1f1f1",
    color: "#333",
    cssVars: {
      "--reader-button-bg": "#36536b",
      "--reader-button-color": "#ffffff",
      "--reader-button-hover-bg": "#2b4357",
      "--reader-secondary-button-bg": "#e4e9ee",
      "--reader-secondary-button-color": "#253746",
      "--reader-secondary-button-border": "#c8d2dc",
      "--reader-input-border": "#9aa7b5",
      "--reader-input-focus-border": "#36536b",
      "--reader-highlight-button-bg": "#7b5f24",
      "--reader-danger-button-bg": "#a4493f",
    },
  },
  2: {
    id: 2,
    name: "黑夜",
    backgroundColor: "#222",
    color: "#e9e9e9",
    cssVars: {
      "--reader-button-bg": "#d6b46a",
      "--reader-button-color": "#211b10",
      "--reader-button-hover-bg": "#e4c77e",
      "--reader-secondary-button-bg": "#343434",
      "--reader-secondary-button-color": "#f0eadc",
      "--reader-secondary-button-border": "#565656",
      "--reader-input-border": "#8a7342",
      "--reader-input-focus-border": "#d6b46a",
      "--reader-highlight-button-bg": "#c98a2f",
      "--reader-danger-button-bg": "#c45f55",
    },
  },
  3: {
    id: 3,
    name: "纸墨",
    backgroundColor: "#e0d7c5",
    color: "#5b4636",
    cssVars: {
      "--reader-button-bg": "#7c5f46",
      "--reader-button-color": "#fffaf0",
      "--reader-button-hover-bg": "#684f39",
      "--reader-secondary-button-bg": "#d1c0a8",
      "--reader-secondary-button-color": "#4f3d2f",
      "--reader-secondary-button-border": "#bba98f",
      "--reader-input-border": "#7a5130",
      "--reader-input-focus-border": "#5b341d",
      "--reader-highlight-button-bg": "#9a6b2f",
      "--reader-danger-button-bg": "#a35648",
    },
  },
  4: {
    id: 4,
    name: "护眼",
    backgroundColor: "#CCE8CF",
    color: "#3D3D3D",
    cssVars: {
      "--reader-button-bg": "#427b5b",
      "--reader-button-color": "#f6fff7",
      "--reader-button-hover-bg": "#35684c",
      "--reader-secondary-button-bg": "#dcefe0",
      "--reader-secondary-button-color": "#2f5843",
      "--reader-secondary-button-border": "#a9d3b2",
      "--reader-input-border": "#2f7d4f",
      "--reader-input-focus-border": "#1f6841",
      "--reader-highlight-button-bg": "#5a7d2d",
      "--reader-danger-button-bg": "#a2504b",
    },
  },
};

export const READER_THEME_OPTIONS = Object.values(READER_THEMES);

export function getReaderTheme(index) {
  const themeIndex = Number(index);
  return READER_THEMES[themeIndex] || READER_THEMES[DEFAULT_READER_THEME];
}

export function getReaderThemeCssVars(index) {
  return getReaderTheme(index).cssVars;
}

export function getReaderThemeByBackgroundColor(backgroundColor) {
  const normalizedBackgroundColor = String(backgroundColor || "").toLowerCase();
  return (
    READER_THEME_OPTIONS.find(
      (theme) => theme.backgroundColor.toLowerCase() === normalizedBackgroundColor
    ) || READER_THEMES[DEFAULT_READER_THEME]
  );
}
