---
outline: deep
prev:
  text: 'vitePresss'
  link: '/vitePress'
next:
  text: 'jQuery 无new构建'
  link: '/jQuery_new'
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
navigator.sendBeacon接收2个值，一个是url，一个是data
navigator.sendBeacon(url, data);
url：将要被发送到的网络地址
data：是将要发送的数据，数据类型有以下这些
ArrayBuffer、ArrayBufferView、Blob、DOMString、FormData 或 URLSearchParams 类型的数据。
```
```md
axiso、fetch、xml
优点：
1、可以发送任意请求
2、可以传输任意字节数据
3、可以定义任意请求头
缺点：
1、关闭页面的时候接口就停止了
```
```md
navigator.sendBeacon
优点：
1、关闭页面接口也会给你走完
2、异步执行，不阻塞页面关闭或跳转。
3、能够发送跨域请求。
缺点：
1、只能发送POST请求
2、不支持json，只能传输ArrayBuffer、ArrayBufferView、Blob、DOMString、FormData 或 URLSearchParams 类型的数据。
3、无法自定义请求头
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
```js
//允许域名的端口请求
res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//允许携带cookie  谷歌浏览器95版本之后不允许cookie跨域
res.header('Access-Control-Allow-Credentials', 'true');
//允许请求方法
res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); 
//允许请求头
res.header('Access-Control-Allow-Headers', 'Content-Type');
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
```js
// window.addEventListener这是一个发布订阅模式
const e = new Event('mySelfEvent') //注册事件---名字自己取
window.dispatchEvent(e) //触发事件
window.addEventListener('mySelfEvent', (e) => {
  //todo
  console.log(e)
})
```
### 监听DOM的变化---MutationObserver
```js
const ob = new MutationObserver() //创建
// ob.observe(target,options) target:观察的目标节点 options:配置对象
ob.observe(document.body, { subtree: true, childList: true }) 
// subtree 是否观察子节点变化 childList是否观察子节点增减
ob.disconnect() 关闭
```
### vite打包
```js
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
const plugin = (): Plugin => {
    return {
        name: 'my-plugin',
        transform(code, id) {
            console.log('code', code)
        }
    }
}
export default defineConfig({
    plugins: [plugin()],
    build: {
        lib: {
            entry: "./src/index.ts",
            name: "Tracker",
            fileName: "tracker",
            formats: ["es", "iife", "cjs", "umd"]
        }
    }
})
```
```md
es：打包出来的文件是.mjs后缀，使用import引入使用
iife：打包出来的文件是iife.js后缀，可以直接在script标签引入，是一个闭包
cjs：打包出来的文件是.js后缀，使用requires引入使用
umd：打包出来的文件是umd.js后缀，可以在amd、cmd、requires、script标签都能引入使用
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
### 服务、发邮件
```js
import express from 'express'
import nodemailer from 'nodemailer'
const transporter = nodemailer.createTransport({
  port: 456,//端口
  host: 'smtp.qq.com',//发送方邮箱
  secure: true,//true for 465, false for other ports
  service: 'qq',// 服务
  auth: {
    user: "xxxxxxxxx@qq.com",//发送方邮箱
    pass: "xxxxxxxxxxxx"//授权码
  }

})
const app = express()
//use 中间件 支持一下post
app.use(express.json())
app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5174');//允许域名的端口请求
  res.header('Access-Control-Allow-Credentials', 'true');//允许携带cookie  谷歌浏览器95版本之后不允许cookie跨域
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); //允许请求方法
  res.header('Access-Control-Allow-Headers', 'Content-Type');//允许请求头
  next();
});
app.post('/tracker', (req, res) => {
  let mailOptions = {
    from: 'xxxxxxxxx@qq.com',//发送方邮箱
    to: 'xxxxxxxx@qq.com',//接收方邮箱
    subject: "发邮件看看",//  主题
    text: JSON.stringify(req.body)//内容
  };

  transporter.sendMail(mailOptions, (error:any, info:any) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
  });
  res.send('OK');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

