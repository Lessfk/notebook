---
outline: deep
prev:
  text: 'http缓存'
  link: '/http_cache'
---

# axiso

## axiso 请求的封装
基于XMLHttpRequest的Promise封装

一个请求的封装大概要封装点什么

get请求有一下情况
```js
// url上带参数 http://localhost:3000/get?a=1
// url上带hash http://localhost:3000/get#?a=1
// url上带参数并且params有值
axios({
    url: 'http://localhost:3000/get#?a=1', //保留已有参数 去掉hash符号
    method: "GET",
    params: {
        id: 2, //序列化参数
        foo: ['bar', '中文'], //序列化数组
        obj: { key: 'value' },//序列化对象
        date: new Date(), //utc格式 世界统一格式
        test: null //去除空值
    }
})
```
post请求在get请求的基础上还需要加多一个判断如果data的一个对象那么需要JSON.stringify()

```js
axios({
    url: 'http://localhost:3000/post', 
    method: "POST",
    data: {
        id: 2,
    }
})
```
处理url带参数，有hash，params有值的情况，还有转义问题的工具函数
```js
// 初始化url
export function buildURL(url: string, params?: any) {
    //如果params为空,直接返回url
    if (!params) {
        return url
    }

    const parts: string[] = [] //存放结果

    //便利params 
    Object.keys(params).forEach(key => {
        const val = params[key]
        //判断值 null和undefined就去除空值
        if (val === null || typeof val === 'undefined') {
            return
        }
        //处理数组
        let values: any[] = []
        if (Array.isArray(val)) {
            values = val
            key += '[]' // 这里为什么要这么处理 是因为get请求如果是传递数组的话 a:[1,2] 是这样的格式 a[]=1&a[]=2，这是w3c规范
        } else {
            values = [val] // 把所有的值都放到数组里面 然后统一处理遍历
        }
        // 遍历数组
        values.forEach(val => {
            // 处理日期
            if (isDate(val)) {
                val = val.toISOString() // utc格式 世界统一格式
            } else if (isObject(val)) { // 处理对象
                val = JSON.stringify(val) // 对象转字符串
            }
            // 转义字符然后放到数组里面
            parts.push(`${encode(key)}=${encode(val)}`)
        })
    })

    // 格式化
    let serializedParams = parts.join('&') // a=2&b=3

    if (serializedParams) {
        //去掉#号
        const markIndex = url.indexOf('#')
        if (markIndex !== -1) {
            url = url.slice(0, markIndex)
        }
        //保留已有参数 ===-1 找不到?
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
    }

    return url
}

// 转义 特殊字符不能转义的字符
function encode(url: string) {
    return encodeURIComponent(url)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

const toString = Object.prototype.toString //代码优化
// 判断是否是日期类型
// 类型守卫 val is Date 因为ts只能做静态检测，静态检测他不会动态的去运行的代码，下面的代码是运行时的代码，要运行完之后才能知道结果，而ts是静态检测它不会去运行代码所以它不会知道结果是什么。
// 类型守卫就是说 这个条件返回为true的时候，那么这个val一定是Date类型
export const isDate = (val: any): val is Date => {
    return toString.call(val) === '[object Date]'
}

// 判断是否是对象类型
export const isObject = (val: any): val is Object => {
    return toString.call(val) === '[object Object]'
}
```

请求头也需要封装一下
```js
function normalizeHeaderName(headers: any, normalizedName: string): void {
    if (!headers) {
        return
    }
    // 遍历头部的name然后把他们都转成大写，如果name和normalizedName的值不相等并却 把name的值转大写后 和 normalizedName的值转成大写后相等
    // 那么把headers这个对象添加一个normalizedName属性，并且把name对应的value赋予它
    // 最后把 headers[name] 删掉, 只保留规范的。
    // content-type !== Content-Type true
    // CONTENT-TYPE === CONTENT-TYPE true
    // 用规范的头然后使用你传进来的值
    Object.keys(headers).forEach(name => {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
            headers[normalizedName] = headers[name]
            delete headers[name]
        }
    })
}

export function processHeaders(headers: any, data: any) {
    normalizeHeaderName(headers, 'Content-Type')
    if (isObject(data)) {
        if (headers && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json;charset=utf-8' //默认json
        }
    }
    return headers
}
```

如果是post，那么发送data的时候需要判断是否是对象，如果是对象那么需要转一下
```js
//post请求的时候需要把对象转换成字符串
export function trasnformRequest(data: any): any {
    if (isObject(data)) {
        return JSON.stringify(data)
    }
}
```

获取接口返回的数据时，自己在把数据给封装一层
```js
//响应头的处理 如果是一个字符串那么转换成对象
export function trasnformResponse(data: any): any {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch (e) {
            // do nothing
        }
    }
    return data
}
// 用来处理自己包装一层请求返回值的headers 把它转成对象
export function parseHeaders(headers: string): any {
    let parsed = Object.create(null)
    if (!headers) {
        return parsed
    }
    headers.split('\r\n').forEach(line => {
        let [key, val] = line.split(':')
        key = key.trim().toLowerCase()
        if (!key) {
            return
        }
        if (val) {
            val = val.trim()
        }
        parsed[key] = val
    })
    return parsed
}   
```

xml的封装
```js
export default function xhr(config: AxiosReqeustConfig): AxiosPromise {
    return new Promise((resolve, reject) => {
        const { url, method = 'GET', data = null, headers, timeout, withCredentials, responseType } = config
        const xhr = new XMLHttpRequest()
        xhr.open(method.toUpperCase(), url, true)

        // 设置响应数据的类型
        if (responseType) {
            xhr.responseType = responseType
        }

        // 设置超时时间
        if (timeout) {
            xhr.timeout = timeout
        }

        // 设置携带cookie
        if (withCredentials) {
            xhr.withCredentials = withCredentials
        }

        // 设置请求头
        if (headers) {
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]) //添加请求头
            })
        }

        // 状态码发送改变触发事件
        xhr.onreadystatechange = function handleLoad() {
            //0 1 2 3 4
            if (xhr.readyState !== 4) {
                return
            }

            //超时和报错也是0
            if (xhr.status === 0) {
                return
            }

            const responseHeaders =  (xhr.getAllResponseHeaders())
            const responeData = responseType === 'text' ? xhr.responseText : xhr.response
            const respone: AxiosResponse = {
                data: responeData,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: responseHeaders,
                config,
                request: xhr
            }
            headleResponse(respone)
        }

        xhr.send(data) //支持的格式有 text, arraybuffer, blob, document, stream

        const headleResponse = function handleResponse(response: AxiosResponse) {
            if (response.status >= 200 && response.status < 304) {
                resolve(response)
            } else {
                reject(new Error(`request failed with status code ${response.status}`))
            }
        }

    })
}
```

统一导出
```js
export default function dispatchRequest(config: AxiosReqeustConfig): AxiosPromise {
    processConfig(config) //初始化配置项
    return xhr(config).then(res => transformResposneData(res))
}

function processConfig(config: AxiosReqeustConfig) {
    config.url = trasnformURL(config)
    config.headers = trasnformHeaders(config) //注意顺序
    config.data = trasnformRequestData(config)
}

// 处理url
function trasnformURL(config: AxiosReqeustConfig): string {
    const { url, params } = config
    return buildURL(url, params)
}

// 处理post请求的data
function trasnformRequestData(config: AxiosReqeustConfig): any {
    return trasnformRequest(config.data)
}

// 处理头部
function trasnformHeaders(config: AxiosReqeustConfig): any {
    const { headers = {}, data } = config
    return processHeaders(headers, data)
}

// 处理返回值
function transformResposneData(res: AxiosResponse): any {
    res.data = trasnformResponse(res.data)
    return res
}
```

axiso可以使用 axiso(),axiso.request(),axiso.get(),axiso.post()

使用工厂模式实现一下上面的功能
```js
export default class Axios {

    public request(config: AxiosReqeustConfig): AxiosPromise {
        return dispatchRequest(config)
    }

    public get(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('get', url, config)
    }

    public delete(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('delete', url, config)
    }

    public head(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('head', url, config)
    }

    public options(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('options', url, config)
    }

    public post(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('post', url, data, config)
    }

    public put(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('put', url, data, config)
    }

    public patch(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('patch', url, data, config)
    }

    // 重新包装一下给没有data请求使用的-- 私有
    private _requestMethodWithOutData(method: Method, url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this.request({ ...config, method, url })
    }
    //// 给有data请求使用的-- 私有
    private _requestMethodWithData(method: Method, url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this.request({ ...config, method, url, data })
    }
}
```
混合
```js
function createInstance(): AxiosInstance {
    const context = new Axios()
    // 为什么要用bing，改变this指向并且bing是返回一个新的函数不会直接调用
    const instance = Axios.prototype.request.bind(context)
    // 复制方法到函数身上
    extend(instance, Axios.prototype)
    extend(instance, context)
    return instance as AxiosInstance
}

const axios = createInstance()

export default axios
```
复制方法
```js
// 使返回交叉类型
export const extend = <T, U>(to: T, form: U): T & U => {
  // 遍历原型的方法需要用到Object.getOwnPropertyNames这个方法，for in是遍历不了class里的prototype
    const keys = Object.getOwnPropertyNames(form)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key != 'constructor') {
            // @ts-ignore
            to[key] = form[key]
        }
    }
    return to as T & U
}
```

## axiso 拦截器
```js
// axiso 拦截器的使用 拦截器能支持多个 拦截器还能删除
// 第一个函数就是Promise.resolve 第二个函数是Promise.reject
axiso.interceptors.request.use(（config）=>{
  return config
}),(error) =>{
  return Promise.reject(error)
}
axiso.interceptors.request.use(（config）=>{
  return config
}),(error) =>{
  return Promise.reject(error)
}
// 拦截器的执行顺序是后添加的先执行
// 拦截器使用unshift加入
// response使用push加入
// [Promise.resolve,Promise.resolve,请求,response,response]
```

创建拦截器
```js
interface Interceptors<T> {
    resolved: ResolvedFn<T>
    rejected?: RejectedFn
}
export default class InterceptorManager<T> {
    private interceptors: Array<Interceptors<T> | null>
    constructor() {
        this.interceptors = []
    }
    // use 方法
    // axiso.interceptors.request.use(（config）=> {
    //     return config
    // }), (error) => {
    //     return Promise.reject(error)
    // }
    // resolved 对应第一个函数
    // rejected 对应第二个函数
    use(resolved: ResolvedFn<T>, rejected?: RejectedFn): number {
        this.interceptors.push({
            resolved,
            rejected
        })
        // 返回 
        // [
        //     {
        //         resolved:(config)=> { return config},
        //         rejected:(error)=> { return Promise.reject(error)}
        //     },
        //     {
        //         resolved:(config)=> { return config},
        //         rejected:(error)=> { return Promise.reject(error)}
        //     },
        // ]
        return this.interceptors.length - 1
    }

    // 删除拦截器 删除的设置为null，这样不会影响interceptors的长度，不影响执行顺序
    eject(id: number): void {
        if (this.interceptors[id]) {
            this.interceptors[id] = null
        }
    }

    // 循环遍历执行函数
    forEach(fn: (interceptor: Interceptors<T>) => void): void {
        this.interceptors.forEach(interceptor => {
            if (interceptor !== null) {
                fn(interceptor)
            }
        })
    }
}
```

使用
```js
interface Interceptors {
    request: InterceptorManager<AxiosReqeustConfig>
    response: InterceptorManager<AxiosResponse>
}
interface PromiseChain<T> {
    resolved: ResolvedFn<T> | ((config: AxiosReqeustConfig) => AxiosPromise)
    rejected?: RejectedFn
}
export default class Axios {
    public interceptors: Interceptors
    constructor() {
        this.interceptors = {
            request: new InterceptorManager<AxiosReqeustConfig>(),
            response: new InterceptorManager<AxiosResponse>()
        }
    }
    public request(config: AxiosReqeustConfig): AxiosPromise {
        
        const chain: PromiseChain<any>[] = [{
            resolved: dispatchRequest,
            rejected: undefined
        }]
        //后添加的先执行 unshift
        this.interceptors.request.forEach(interceptor => {
            chain.unshift(interceptor)
        })
        //先添加的先执行 push
        this.interceptors.response.forEach(interceptor => {
            chain.push(interceptor)
        })

        let promise = Promise.resolve(config)
        //[] 2
        while (chain.length) {
            const { resolved, rejected } = chain.shift()!
            promise = promise.then(resolved, rejected)
        }

        return promise as unknown as AxiosPromise
    }
    public get(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('get', url, config)
    }

    public delete(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('delete', url, config)
    }

    public head(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('head', url, config)
    }

    public options(url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithOutData('options', url, config)
    }

    public post(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('post', url, data, config)
    }

    public put(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('put', url, data, config)
    }

    public patch(url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this._requestMethodWithData('patch', url, data, config)
    }

    // 重新包装一下给没有data请求使用的-- 私有
    private _requestMethodWithOutData(method: Method, url: string, config?: AxiosReqeustConfig): AxiosPromise {
        return this.request({ ...config, method, url })
    }
    //// 给有data请求使用的-- 私有
    private _requestMethodWithData(method: Method, url: string, data?: any, config?: AxiosReqeustConfig): AxiosPromise {
        return this.request({ ...config, method, url, data })
    }
}
```

## 最后附上git 地址
https://github.com/Lessfk/axiso.git