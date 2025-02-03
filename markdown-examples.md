---
outline: deep
next:
  text: 'api-examples'
  link: '/api-examples'
head:
  -  - meta
     - name: title
       content: Runtime Api
  -  - meta
     - name: description
       content: Runtime Api 
---

# Markdown Extension Examples

This page demonstrates some of the built-in markdown extensions provided by VitePress.

## Syntax Highlighting

VitePress provides Syntax Highlighting powered by [Shiki](https://github.com/shikijs/shiki), with additional features like line-highlighting:

**Input**

````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

**Output**

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

## Custom Containers

**Input**

```md
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::
```

**Output**

::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::

## More

Check out the documentation for the [full list of markdown extensions](https://vitepress.dev/guide/markdown).

## 贡献者
vitepress的markdown语法支持vue
<script setup>
  import { VPTeamMembers } from 'vitepress/theme'
  const members = [
    {
      name:"VitePress",
      title:"core team",
      avatar:"https://vitejs.dev/logo.svg",
      link:"https://vitejs.dev"
    }
  ]
    </script>
  <VPTeamMembers size="small" :members="members" />