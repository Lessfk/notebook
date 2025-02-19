---
outline: deep
prev:
  text: 'jQuery 无new构建'
  link: '/jQuery_new'
---

# http缓存
http缓存主要分为两类：**强缓存和协商缓存**

这两种缓存都通过 HTTP 响应头来控制，目的是提高网站性能。

缓存存放的位置有2个： Memory Cache和 Disk Cache

1、**内存缓存（Memory Cache）‌**：内存缓存的读取速度最快，但持续性较差，会随着浏览器进程的释放而释放。一旦关闭浏览器标签页，内存中的缓存就会被释放‌。

2、‌**硬盘缓存（Disk Cache）‌**：硬盘缓存读取速度较慢，但容量大且存储时效性长。硬盘缓存中的资源会一直存储在硬盘上，直到被显式删除或达到存储上限‌。

## 强缓存
强缓存分为2种:

1、Expires 是HTTP1.0引入的

2、Cache-Control 是HTTP1.1引入的

如果同时设置了Expires和Cache-Control，Cache-Control优先级更高，Expires会被忽略

### Expires
Expires: 该字段指定响应的到期时间，即资源不再被视为有效的日期和时间。

Expires 的判断机制是：当客户端请求资源时，会获取本地时间戳，然后拿本地时间戳与 Expires 设置的时间做对比，如果对比成功，走强缓存，对比失败，则对服务器发起请求。
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <button id="send">发送请求</button>
    <script>
        let btn = document.getElementById("send")
        btn.addEventListener("click",()=>{
            fetch('http://localhost:3000/api')
        })
    </script>
</body>
</html>
```
```js
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors())
//在设定时间内，第一次请求会进过服务器，第二次请求会直接从浏览器缓存中获取，直到当前请求时间超过设定的时间，才会再次请求服务器
app.get('/api', (req, res) => {
    // 设置Expires的时间，时间格式为UTC时间格式的字符串
    res.setHeader("Expires", new Date('2025-02-18 22:00:00').toUTCString());
    res.send('Expires');
})
app.listen(3000,()=>{
    console.log("http://localhost:3000")
})
```

### Cache-Control
Cache-Control 有一下这些值可以设置

max-age: 缓存时间

public: 客户端和代理服务器都可以缓存包括浏览器缓存和中间代理服务器缓存

private: 客户端可以缓存(浏览器缓存)，中间代理服务器不可以缓存

no-cache: 不走强缓存，走协商缓存

no-store: 不走强缓存，也不走协商缓存
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <button id="send">发送请求</button>
    <script>
        let btn = document.getElementById("send")
        btn.addEventListener("click",()=>{
            fetch('http://localhost:3000/api2')
        })
    </script>
</body>
</html>
```
```js
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors())
// Cache-Control
// public: 客户端和代理服务器都可以缓存包括浏览器缓存和中间代理服务器缓存
// private: 客户端可以缓存(浏览器缓存)，中间代理服务器不可以缓存
// max-age=10: 缓存10秒
// 请求第一次后，第二次请求会直接从浏览器缓存中获取，直到当前请求时间超过设定的时间，才会再次请求服务器， 一直如此循环
app.get('/api2', (req, res) => {
   res.setHeader('Cache-Control', 'public, max-age=10');
    res.send('Cache-Control');
})
app.listen(3000,()=>{
    console.log("http://localhost:3000")
})
```

## 协商缓存
Last-Modifed/If-Modified-Since和ETag/If-None-Match是分别成对出现的，呈一一对应关系。

ETag/If-None-Match 优先级比 Last-Modifed/If-Modified-Since 高

如果强缓存和协商缓存同时存在，强缓存优先级更高。

那我们怎么解决不走强缓存而是走协商缓存呢，设置这个就行了 Cache-Control: no-cache。Cache-Control: no-cache  就是告诉浏览器不走强缓存，走协商缓存。

### Last-Modifed/If-Modified-Since
Last-Modified 和 If-Modified-Since：服务器通过 Last-Modified 响应头告知客户端资源的最后修改时间。客户端在后续请求中通过 If-Modified-Since 请求头携带该时间，服务器判断资源是否有更新。如果没有更新，返回 304 状态码。
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <button id="send">发送请求</button>
    <script>
        let btn = document.getElementById("send")
        btn.addEventListener("click",()=>{
            fetch('http://localhost:3000/api3')
        })
    </script>
</body>
</html>
```
```js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
const app = express();
app.use(cors())
// 获取文件最后修改时间
const getFileModifyTime = () => {
    return fs.statSync('./index.js').mtime.toUTCString();
}
// Last-Modifed/If-Modified-Since
app.get('/api3', (req, res) => {   
    res.setHeader('Cache-Control', 'no-cache');
    const ifmodifiedsince = req.headers['if-modified-since'];
    const lastModified = getFileModifyTime();
    // 判断请求头中的if-modified-since和文件最后修改时间是否相等，如果相等，返回304
    if(ifmodifiedsince === lastModified){
        res.statusCode = 304
        res.send();
        return;  
    }
    res.setHeader('Last-Modified', lastModified);
    res.send('Cache-Control');
 })
app.listen(3000,()=>{
    console.log("http://localhost:3000")
})
```
### ETag/If-None-Match
ETag 和 If-None-Match：服务器通过 ETag 响应头给资源生成一个唯一标识符。客户端在后续请求中通过 If-None-Match 请求头携带该标识符，服务器根据标识符判断资源是否有更新。如果没有更新，返回 304 状态码。
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <button id="send">发送请求</button>
    <script>
        let btn = document.getElementById("send")
        btn.addEventListener("click",()=>{
            fetch('http://localhost:3000/api4')
        })
    </script>
</body>
</html>
```
```js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import crypto from 'node:crypto'
const app = express();
app.use(cors())
 // Etag
 // Etag是文件的唯一标识，文件内容改变，Etag就会改变
 const getFileHash = () => {
    return crypto.createHash('sha256').update(fs.readFileSync('index.js')).digest('hex')
}
app.get('/api4', (req, res) => {   
    res.setHeader('Cache-Control', 'no-cache');
    const ifnonematch = req.headers['if-none-match'];
    const Etag = getFileHash();
    // 判断请求头中的if-none-match和文件Etag是否相等，如果相等，返回304
    if(ifnonematch === Etag){
        res.statusCode = 304
        res.send();
        return;  
    }

    res.setHeader('ETag', Etag);
    res.send('Etag');
 })
app.listen(3000,()=>{
    console.log("http://localhost:3000")
})
```

## 静态资源缓存
```js
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors())
// 可以缓存css js img html...
// static中间件
// maxAge: 缓存时间，单位毫秒
// lastModified: 是否启用Last-Modified
// ./static: 静态资源目录
app.use(express.static('./static', {
    maxAge: 1000 * 60 * 60 * 24,
    lastModified: true
}));
app.listen(3000,()=>{
    console.log("http://localhost:3000")
})
```
