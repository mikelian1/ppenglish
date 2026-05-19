<template>
  <div class="con">
    <Nav class="nav"></Nav>
    <main>
      <h4>这个网页用来做什么</h4>
      <p>
        泡泡外刊是一个本地优先的英文精读工具。你可以把英文文章粘贴进来，按段保存到浏览器里，再在阅读页生成中文译文、查词、标记重点和整理生词。
      </p>

      <h4>文章库</h4>
      <ul>
        <li>首页展示当前浏览器里保存的本地文章，按更新时间排序。</li>
        <li>可以新建文章，也可以删除不再需要的文章。</li>
        <li>支持导出和导入 JSON，文章、高亮和生词本可以一起备份或迁移。</li>
      </ul>

      <h4>新建文章</h4>
      <ul>
        <li>粘贴英文原文后，网页会按空行切分段落，并在页面下方显示分段预览。</li>
        <li>如果原文来自 PDF，可以使用“清洗换行”合并断行和连字符，减少复制带来的排版问题。</li>
        <li>标题可以手动填写；如果不填，网页会自动使用未命名文章。</li>
      </ul>

      <h4>阅读与翻译</h4>
      <ul>
        <li>阅读页支持整篇翻译，会尽量保持原文段落数量和顺序，便于中英文对照。</li>
        <li>每段译文旁边可以打开 Google Translate 重译，也可以把手动调整后的译文粘贴回网页保存。</li>
        <li>文章标题可以直接点击编辑，修改后会自动保存。</li>
      </ul>

      <h4>查词、高亮和生词本</h4>
      <ul>
        <li>默认查词模式下，鼠标悬停英文单词会出现有道和 Cambridge 词典入口。</li>
        <li>打开词典链接后，网页会自动给该单词加一层查词标记。</li>
        <li>切换到高亮模式后，可以拖选原文添加高亮，点击已有高亮可删除。</li>
        <li>高亮后按 Enter 可以把选中的单词加入生词本；按 Ctrl/Command + Z 可以撤销上一步高亮。</li>
        <li>右侧工具栏的 Wd 按钮可以打开生词本，手动添加或删除单词。</li>
      </ul>

      <h4>阅读样式</h4>
      <ul>
        <li>Aa 工具栏可以切换字体、字号、行高和主题。</li>
        <li>阅读模式支持中英双栏、中英单栏和仅英文三种视图。</li>
        <li>阅读样式会保存在当前浏览器，下次打开时会继续沿用。</li>
      </ul>

      <h4>数据与隐私</h4>
      <p>
        文章和生词默认保存在当前浏览器的 IndexedDB 中。只有点击整篇翻译时，网页才会把文章原文发送到翻译接口；如果只是本地阅读、查词、编辑标题、高亮或管理生词，本地数据不会因为这些操作自动上传。
      </p>

      <h4>GitHub 项目</h4>
      <ul>
        <li>
          <a
            href="https://github.com/mikelian1/ppenglish"
            target="_blank"
            rel="noopener"
          >ppenglish 源码仓库</a>
          ：用于查看和修改 Nuxt 源码，适合需要二次开发、调试或重新生成网页的用户。
        </li>
        <li>
          <a
            href="https://github.com/mikelian1/ppenglishmini"
            target="_blank"
            rel="noopener"
          >ppenglishmini 轻量运行仓库</a>
          ：提供已生成的网页文件和 Windows 启动脚本，适合不想安装 Node/npm、只想直接使用的用户。
        </li>
      </ul>

      <p class="back-home">
        <a href="/" @click.prevent="$router.push('/')">返回首页</a>
      </p>
    </main>
  </div>
</template>

<script>
export default {
  mounted() {
    document.body.style.backgroundColor = "#fefefe";
  },
};
</script>

<style scoped>
.con {
  max-width: 65rem;
  margin: 0 auto;
}

.nav {
  margin: 0;
}
li {
  margin-left: 1rem;
  list-style: circle !important;
}
a {
  color: #6988e6;
}
h4 {
  margin: 1.4rem 0 0 0;
}
p {
  margin: 0;
}
.back-home {
  margin-top: 1.4rem;
}
</style>
