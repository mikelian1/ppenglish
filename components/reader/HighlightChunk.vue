<template>
  <WordLookup
    v-if="!chunk.highlighted"
    :text="chunk.text"
    :base-offset="chunk.start"
    :lookup-disabled="lookupDisabled"
    @lookup-link-opened="$emit('lookup-link-opened', $event)"
  />
  <span
    v-else
    class="source-highlight"
    :class="{ 'highlight-mode': lookupDisabled }"
    :data-highlight-id="chunk.highlightId"
    :style="{ backgroundColor: chunk.color }"
  >
    <WordLookup
      :text="chunk.text"
      :base-offset="chunk.start"
      :lookup-disabled="lookupDisabled"
      @lookup-link-opened="$emit('lookup-link-opened', $event)"
    />
  </span>
</template>

<script>
import WordLookup from "./WordLookup.vue";

export default {
  components: {
    WordLookup,
  },
  props: {
    chunk: {
      type: Object,
      required: true,
    },
    lookupDisabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.source-highlight {
  border-radius: 3px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.source-highlight.highlight-mode {
  cursor: pointer;
}
</style>
