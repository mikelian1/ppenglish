<template>
  <div class="con">
    <mark>泡泡外刊</mark>
    <slot></slot>
  </div>
</template>

<style scoped>
.con {
  width: 100%;
  margin: 0 auto;
  display: flex;
  gap: 1rem;
  align-items: center;
}
mark {
  user-select: none;
  font-weight: bold;
  font-size: 24px;
  line-height: 1.1;
  padding: 0;
  background: linear-gradient(to right, #222, #333, #444, #555, #666);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
