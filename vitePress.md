---
outline: deep
next:
  text: '埋点'
  link: '/tracker'
---
# vitePress

## 搭建
控制台输入以下命令

```md
npm install vitepress -D
npx vitepress init
```
## config.mts 配置文件
```md
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: "Lessfk's noteBook", //标题
  description: "noteBook",  //描述
  outDir: 'docs',  //打包输出的目录 
  base: "/noteBook/", //打包资源路径
  themeConfig: {
    //头部导航
    nav: [
      { text: 'Home导航', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    //左侧导航
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ]
      }
    ],
    //文档页脚 
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    //文档更新时间（需要配合git才有效果，时间为提交git的时间 ）
    lastUpdated: {
      text: '最后更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },
    //全局搜索
    search: {
      provider: 'local',
    },
    //链接地址
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
```
## index.md 配置文件
```md
---
layout: home

hero:
  name: "Lessfk's noteBook"  //名称
  text: "不破不立"  //文字
  tagline: "记忆碎片"  //标语
  actions:
    - theme: brand  //主题
      text: Markdown Examples按钮  //按钮文字
      link: /markdown-examples  //跳转链接
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - title: 还未定义的内容  //内容标题
    details: 还未定义的内容详情  //内容详情
  - title: 还未定义的内容
    details: 还未定义的内容详情
  - title: 还未定义的内容
    details: 还未定义的内容详情
  - title: 还未开发区域
    details: 以后再来探索吧
  - title: 还未开发区域
    details: 以后再来探索吧
  - title: 还未开发区域
    details: 以后再来探索吧
---
```
## 内容文件
```md
---
outline: deep  //主题
prev: //上一页
  text: 'markdown-examples'  //内容
  link: '/markdown-examples'  //路径
next:  //下一页
  text: 'vitePress'  
  link: '/vitePress'
head:  //头部（生成mate标签）
  -  - meta
     - name: title
       content: Runtime Api
  -  - meta
     - name: description
       content: Runtime Api 
---
```