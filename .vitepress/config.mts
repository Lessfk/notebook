import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Lessfk's noteBook",
  description: "noteBook",
  outDir: "docs",
  base: "/notebook/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home导航', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          // { text: 'Markdown Examples', link: '/markdown-examples' },
          // { text: 'Runtime API Examples', link: '/api-examples' },
          { text: 'vitePress', link: '/vitePress' },
          { text: '埋点', link: '/tracker' },
          { text: 'jQuery 无new构建', link: '/jQuery_new' },
          { text: 'http 缓存', link: '/http_cache' }
        ]
      }
    ],

    docFooter: {
      prev: "上一页",
      next: "下一页"
    },

    lastUpdated: {
      text: '最后更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
