<template>
  <span class="word-line" :class="{ 'lookup-disabled': lookupDisabled }"
    ><template v-for="(token, index) in tokens"
      ><span
        v-if="token.type === 'word'"
        :key="index"
        class="source-token lookup-word"
        :data-source-start="token.start"
        :data-source-end="token.end"
        ><span class="lookup-word-label" v-text="token.value"></span><span
          v-if="!lookupDisabled"
          class="lookup-popover"
          ><a
            :href="youdaoUrl(token.value)"
            target="_blank"
            rel="noopener"
            @click="handleLookupLinkClick(token, $event)"
            @auxclick="handleLookupLinkClick(token, $event)"
            >有道</a
          ><a
            :href="cambridgeUrl(token.value)"
            target="_blank"
            rel="noopener"
            @click="handleLookupLinkClick(token, $event)"
            @auxclick="handleLookupLinkClick(token, $event)"
            >Cambridge</a
          ></span
        ></span
      ><span
        v-else
        :key="index"
        class="source-token"
        :data-source-start="token.start"
        :data-source-end="token.end"
        >{{ token.value }}</span
      ></template
    >
  </span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    lookupDisabled: {
      type: Boolean,
      default: false,
    },
    baseOffset: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    tokens() {
      const tokens = [];
      const pattern = /[A-Za-z]+(?:['-][A-Za-z]+)*/g;
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(this.text)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({
            type: "text",
            value: this.text.slice(lastIndex, match.index),
            start: this.baseOffset + lastIndex,
            end: this.baseOffset + match.index,
          });
        }
        tokens.push({
          type: "word",
          value: match[0],
          start: this.baseOffset + match.index,
          end: this.baseOffset + pattern.lastIndex,
        });
        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < this.text.length) {
        tokens.push({
          type: "text",
          value: this.text.slice(lastIndex),
          start: this.baseOffset + lastIndex,
          end: this.baseOffset + this.text.length,
        });
      }

      return tokens;
    },
  },
  methods: {
    normalize(word) {
      return word.toLowerCase().replace(/^['-]+|['-]+$/g, "");
    },
    youdaoUrl(word) {
      return `https://dict.youdao.com/result?word=${encodeURIComponent(
        this.normalize(word)
      )}&lang=en`;
    },
    cambridgeUrl(word) {
      return `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(
        this.normalize(word)
      )}`;
    },
    handleLookupLinkClick(token, event) {
      if (event && event.type === "auxclick" && event.button !== 1) return;

      this.$emit("lookup-link-opened", {
        word: token.value,
        start: token.start,
        end: token.end,
      });
    },
  },
};
</script>

<style scoped>
.word-line {
  white-space: normal;
}

.lookup-word {
  border-radius: 3px;
  cursor: help;
  position: relative;
}

.lookup-disabled .lookup-word {
  cursor: text;
}

.lookup-word-label {
  display: inline;
}

.word-line:not(.lookup-disabled) .lookup-word:hover {
  background: rgba(72, 147, 245, 0.18);
}

.lookup-popover {
  align-items: center;
  background: #1f2937;
  border-radius: 6px;
  bottom: calc(100% + 6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  color: #fff;
  display: none;
  gap: 8px;
  left: 50%;
  max-width: 280px;
  padding: 8px 10px;
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 20;
}

.lookup-popover::before {
  bottom: -8px;
  content: "";
  height: 8px;
  left: 0;
  position: absolute;
  right: 0;
}

.lookup-popover a {
  color: #bfdbfe;
  font-size: 13px;
}

.word-line:not(.lookup-disabled) .lookup-word:hover .lookup-popover,
.word-line:not(.lookup-disabled) .lookup-word:focus-within .lookup-popover {
  display: flex;
}

@media (max-width: 700px) {
  .lookup-popover {
    left: 0;
    transform: none;
  }
}
</style>
