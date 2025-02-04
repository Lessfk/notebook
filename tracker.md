---
outline: deep
prev:
  text: 'vitePresss'
  link: '/vitePress'
---

# 埋点

## 前置知识

### vite 和 webpack的区别
```md
webpack npm run dev 先打包一次 入口文件为js
vite npm run dev 他是`no bundle模式` 启动不需要打包 入口文件是html--（esm）
```

### 什么是esm
```md
<script type="module" src="./main.js"></script>
type="module" 可以使用import
type="module" 他发起http请求，vite会拦截处理里面的逻辑，用koa的中间件去拦截
```

### 上报埋点应选择一个什么调用接口的方案
```md
一般都会选择navigator.sendBeacon
```
```md
axiso、fetch、xml 
缺点：
关闭页面的时候接口就停止了
```
```md
navigator.sendBeacon
优点：
关闭页面接口也会给你走完
缺点：
不支持跨域、不支持json
```
### cors
```md
浏览器将CORS请求分成两类：
1、简单请求（simple request）
2、非简单请求（not-so-simple request）。
只要同时满足以下两大条件，就属于简单请求。
1、请求方法是以下三种方法之一：
HEAD
GET
POST
2、HTTP的头信息不超出以下几种字段：
Accept
Accept-Language
Content-Language
Last-Event-ID
Content-Type：只限于三个值application/x-www-form-urlencoded、multipart/form-data、text/plain
```
```md
res.header('Access-Control-Allow-Origin', 'http://localhost:5173');//允许域名的端口请求
res.header('Access-Control-Allow-Credentials', 'true');//允许携带cookie  谷歌浏览器95版本之后不允许cookie跨域
res.header('Access-Control-Allow-Headers', 'Content-Type');//允许请求头
```
```md
res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); 
如果把`http://localhost:5173`改成`*`那么请求将无法携带cookie
因为`*`是不允许上传cookie
```
### getBoundingClientRect
```md
getBoundingClientRect：
获得页面中某个DOM元素的左，上，右和下分别相对浏览器视窗的位置。
DOM元素到浏览器可视范围的距离。
DOM元素的高、宽。
```
### window.addEventListener
```md
window.addEventListener这是一个发布订阅模式
const e = new Event('mySelfEvent') //注册事件---名字自己取
window.dispatchEvent(e) //触发事件
window.addEventListener('mySelfEvent', (e) => {
  //todo
  console.log(e)
})
```
### 监听DOM的变化
```md
MutationObserver
// const ob = new MutationObserver() //创建
// ob.observe(target,options) target:观察的目标节点 options:配置对象
// ob.observe(document.body, { subtree: true, childList: true }) // subtree 是否观察子节点变化 childList是否观察子节点增减
// ob.disconnect() 关闭


```
## 正文

### 按钮监控
```js
import type { send } from '../type/index';
export default function button(send: send) {
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const data = target.getAttribute('data-click');
        console.log(target)
        if (data) {
            send({
                type: 'click',
                data: target.getBoundingClientRect(),
                text: target.innerText
            })
        }
    })
}
```
### 报错监控
```js
import type { send } from '../type/index';
export default function error(send: send) {
    window.addEventListener('error', (e) => {
            send({
                type: e.type,
                data: {
                    filename: e.filename,
                    lineno: e.lineno,
                },
                text: e.message
            })
    })
}
```
### promise报错监控
```js
import type { send } from '../type/index';
export default function reject(send: send) {
    window.addEventListener('unhandledrejection', (e) => {
            send({
                type: e.type,
                data: {
                    reason: e.reason,
                    href: location.href,
                },
                text: e.reason
            })
    })
}
```
### 请求监控
```js
import type { send } from '../type/index';
export default function ajax(send: send) {
    // 重写XMLHttpRequest
    const OriginOpen = XMLHttpRequest.prototype.open;
    const OriginSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method: string, url: string, async = true) {
        this.addEventListener('load', function () {
            send({
                type: 'XMLHttpRequest-open',
                data: {
                    method,
                    url,
                },
                text: 'XMLHttpRequest-open',
            })
        })
        OriginOpen.call(this, method, url, async)
    }
    XMLHttpRequest.prototype.send = function (data) {
        send({
            type: 'XMLHttpRequest-send',
            data,
            text: 'XMLHttpRequest-send',
        })
        OriginSend.call(this, data)
    }

    //重写fetch
    const OriginFetch = window.fetch;
    window.fetch = function (...args: any[]) {
        send({
            type: 'fetch',
            data: args,
            text: 'fetch',
        })
        return OriginFetch.apply(this, args)
    }
}
```
### pv
```js
import type { send } from '../type/index';
export default function page(send: send) {
    //hash模式
    window.addEventListener('hashchange', (e) => {
        send({
            type: 'pv-hashchange',
            data: {
                newURL: e.newURL,
                oldURL: e.oldURL
            },
            text: 'pv-hashchange',
        })
    })
    //history模式
    //history.pushState(state, title, url)
    //history.pushSrate({id:1}, '首页', '/path')
    window.addEventListener('popstate', (e) => {
        send({
            type: 'pv-popstate',
            data: {
                state: e.state,
                url: location.href,
            },
            text: 'pv-popstate',
        })
    })
    //手写pushState
    const pushState = history.pushState;
    history.pushState = function (state, title, url) {
        const res = pushState.call(this, state, title, url)
        const e = new Event('pushstate')
        window.dispatchEvent(e)
        return res
    }
    window.addEventListener('pushstate', (e) => {
        send({ 
            type: 'pv-pushstate',
            data: {
                url: location.href
            },
            text: 'pv-pushstate'
         })
    })
}
```
### 首屏加载时间
```js
import type { send } from '../type/index';
export default function onePage(send: send) {
    let firstTime = 0
    const ob = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            firstTime = performance.now()
        })
        if (firstTime > 0) {
            send({
                type: 'firstScreen',
                data: {
                    time: firstTime
                },
                text: 'firstScreen'
            })
            ob.disconnect()
        }
    })
    //subtree 是否观察子节点变化 childList是否观察子节点增减
    ob.observe(document.body, { subtree: true, childList: true })
}
```
### 使用
```js
import user from './user';
import button from './event/button';
import error from './monitor/error';
import reject from './monitor/reject';
import request from './request/ajax';
import page from './pv/page';
import onePage from './page/index';

class Tracker {
  event: Record<string, Function>;
  constructor() {
    this.event = { button, error, reject, request, page, onePage };
    this.init();
  }
  // 上报埋点
  protected sendRequest(params = {}) {
    let userInfo = user();
    const body = Object.assign({}, userInfo, params);
    let blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    navigator.sendBeacon('http://localhost:3000/tracker', blob);
  }

  private init() {
    Object.keys(this.event).forEach((key) => {
      this.event[key](this.sendRequest);
    })
  }
}

export default Tracker;
```

