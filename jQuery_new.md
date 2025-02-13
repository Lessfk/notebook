---
outline: deep
prev:
  text: '埋点'
  link: '/tracker'
---

# jQuery 无new构建

## 前置知识

### 箭头函数和普通函数的区别
```js
// 箭头函数的出现是为了 消除函数的二义性
// 函数可以 new 它，可以调用它
// 我们无法分清一个函数是要被我们调用还是被new
let Person = function () { }
new Persion
Person()
// 所以箭头函数只能被调用
let fn = () => { }
fn()
// 然后又发明了一个class 来提供给大家new
class Car {
    constructor() {
    }
}
new Car()
```
### 箭头函数
```js
let fn = () =>{
    return 1
}
// 如果我们要new一个箭头函数是会报错的
// 因为箭头函数是没有原型的
new fn() // Uncaught TypeError: fn is not a constructor
// 因为构造函数是在prototype里面的
console.log(fn.prototype) // undefined
// 下面是一个普通函数的prototype
{
    constructor: fn
}
```
### 原型、原型链
```md
显式原型 prototype 它是函数的属性
隐式原型 __proto__ 它是对象的属性
构造函数 constructor 指向函数本身
__proto__这属性指向该函数prototype
只有顶层是null
先从自身找，自身找不到就去prototype一直找，找不到返回null
```
```js
let fn = function(){
    this.a = 1
}
console.log(fn.prototype.__proto__ === Object.prototype) // true
console.log(Object.prototype.__proto__ === null) // true
fn.prototype.b = 2
Object.prototype.c = 3
let obj = new fn()
console.log(obj.a) // 1
console.log(obj.b) // 2
console.log(obj.c) // 3

{
    a: 1
    __proto__: fn.prototype = {
        b: 2
        __proto__: Object.prototype = {
            c: 3
            __proto__: null
        }
    }
}
```
### Document的一些api
```js
//该方法返回文档中匹配指定 CSS 选择器的所有元素，返回 NodeList 对象
document.querySelectorAll()

//返回指定节点在DOM树中的父节点
node.parentElement
let child = document.getElementById('child')
child.parentElement()

// 返回指定元素之后的下一个兄弟元素（相同节点树层中的下一个元素节点）
node.nextElementSibling
let next = document.getElementById('next')
next.nextElementSibling()

// 返回指定元素的前一个兄弟元素（相同节点树层中的前一个元素节点）
node.previousElementSibling
let pre = document.getElementById('pre')
pre.previousElementSibling()
```
### getComputedStyle
```js
// 用于获取指定元素的 CSS 样式。获取的样式是元素在浏览器中最终渲染效果的样式
// element: 必需，要获取样式的元素。
// pseudoElement: 可选，伪类元素，当不查询伪类元素的时候可以忽略或者传入 null。
window.getComputedStyle(element, pseudoElement)
```
### parseFloat
```js
// 可解析一个字符串，并返回一个浮点数。
// 该函数指定字符串中的首个字符是否是数字。如果是，则对字符串进行解析，直到到达数字的末端为止，然后以数字返回该数字，而不是作为字符串。
parseFloat("123") // 123
parseFloat("123asd") // 123
parseFloat("123.456asd789") // 123.456
parseFloat("qwe123asd") // NAN
```
### requestAnimationFrame
```js
// 会根据浏览器的重绘频率来调整动画的帧率，确保动画与显示器的刷新率同步，通常为每秒60帧（60FPS），从而避免掉帧或卡顿现象，提供更加流畅的动画效果‌
// 该方法会告诉浏览器你希望执行一个动画。它要求浏览器在下一次重绘之前，调用用户提供的回调函数。
let callback = () => {}
let myReq = requestAnimationFrame(callback)
//手动暂停
cancelAnimationFrame(myReq);
// 返回微妙 其次就是他是从页面加载到此刻所经过的时间
performance.now()
```
### load、DOMContentLoaded、document.readyState
```js
// DOMContentLoaded
//当 HTML 文档完全解析，且所有延迟脚本（<script defer src="…"> 和 <script type="module">）下载和执行完毕后，会触发 DOMContentLoaded 事件。它不会等待图片、子框架和异步脚本等其他内容完成加载。
document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM 完全加载和解析");
});

// load
// 事件在整个页面及所有依赖资源如样式表和图片都已完成加载时触发。
window.addEventListener("load", (event) => {
  console.log("整个页面及所有依赖资源如样式表和图片都已完成加载");
});

// document.readyState
// document.readyState 有3个值
// loading —— 文档正在被加载。
// interactive —— 文档被全部读取。
// complete —— 文档被全部读取，并且所有资源（例如图片等）都已加载完成。
```

## 正文

### 无new构建
```js
// 这里的$('.dom')就相当于 new jQuery('.dom')
var dom = $('.dom')
```
这是如何实现的呢
```js
//闭包 
(function (global) {
    // 防止变量重名
    const jQuery = function (selector, context = document) {
       return new jQuery.fn.init(selector, context)
    }
    jQuery.fn = jQuery.prototype
    jQuery.fn.init = function (selector, context) {
       if (selector) {
          // 获取dom
          this.dom = document.querySelectorAll(selector)
          // jQuery源码是怎么做的呢
          // 用正则判断 .XXX 就使用document.getElementsByClassName()
          // 用正则判断 #XXX 就使用document.getElementById()
          // 其他则用  document.getElementsByTagName()
       }
    }     
    global.jQuery = jQuery
    global.$ = jQuery
 })(typeof window !== "undefined" ? window : globalThis)
 var dom = $('.dom')
```
### 链式调用
```js
// 这就是jQuery的链式调用
var dom = $('.dom').text("我进行了链式调用")
```
jQuery的链式调用的实现是运用了原型链的原理，只需要加上这么一段代码就可实现

**return this**下面代码块的第18行

**jQuery.fn.init.prototype = jQuery.fn**下面代码块的第25行
```js
//闭包 
(function (global) {
    // 防止变量重名
    const jQuery = function (selector, context = document) {
        return new jQuery.fn.init(selector, context)
    }
    jQuery.fn = jQuery.prototype
    jQuery.fn.init = function (selector, context) {
        if (selector) {
            // 获取dom
            this.dom = document.querySelectorAll(selector)
            // jQuery源码是怎么做的呢
            // 用正则判断 .XXX 就使用document.getElementsByClassName()
            // 用正则判断 #XXX 就使用document.getElementById()
            // 其他则用  document.getElementsByTagName()
        }
        // 链式调用的关键 --- 返回自身
        return this
    }
    // 这句代码解决了其他方法没有产生关联的问题
    // $('div').text("进行链式调用")
    // 如果没有下面段代码则会报 TypeError: $(...).text is not a function
    // 因为它无法拿到text这个方法来执行，所以需要将jQuery.fn.init.prototype指向jQuery.fn
    // 这是利用了原型链的查找来实现的
    jQuery.fn.init.prototype = jQuery.fn

    // text
    jQuery.fn.text = function (text) {
        this.dom.forEach(element => {
            element.textContent = text
        });
        return this
    }
    global.jQuery = jQuery
    global.$ = jQuery
})(typeof window !== "undefined" ? window : globalThis)
var dom = $('.dom').text("进行链式调用")
```
### 完善更多的方法
```js
//闭包 
(function (global) {
    // 防止变量重名
    const jQuery = function (selector, context = document) {
        return new jQuery.fn.init(selector, context)
    }
    jQuery.fn = jQuery.prototype
    jQuery.fn.init = function (selector, context) {
        if (selector) {
            // 获取dom
            this.dom = document.querySelectorAll(selector)
            // jQuery源码是怎么做的呢
            // 用正则判断 .XXX 就使用document.getElementsByClassName()
            // 用正则判断 #XXX 就使用document.getElementById()
            // 其他则用  document.getElementsByTagName()
        }
        // 链式调用的关键 --- 返回自身
        return this
    }
    // 这句代码解决了其他方法没有产生关联的问题
    // $('div').text("3124124")
    // 如果没有下面段代码则会报 TypeError: $(...).text is not a function
    // 因为它无法拿到text这个方法来执行，所以需要将jQuery.fn.init.prototype指向jQuery.fn
    // 这是利用了原型链的查找来实现的
    jQuery.fn.init.prototype = jQuery.fn

    // text
    jQuery.fn.text = function (text) {
        this.dom.forEach(element => {
            element.textContent = text
        });
        return this
    }
    // css
    jQuery.fn.css = function (key, value) {
        this.dom.forEach(el => {
            el.style[key] = value
        })
        return this;
    }

    // parent
    jQuery.fn.parent = function () {
        return this.dom[0].parentElement
    }

    // 相邻的元素
    jQuery.fn.siblings = function () {
        const parent = this.parent()
        const children = parent.children
        const siblings = []
        for (let i = 0; i < children.length; i++) {
            if (this.dom[0] !== children[i]) {
                siblings.push(children[i])
            }
        }
        return siblings
    }

    // next
    jQuery.fn.next = function () {
        return this.dom[0].nextElementSibling
    }

    // prev
    jQuery.fn.prev = function () {
        return this.dom[0].previousElementSibling
    }
    
    global.jQuery = jQuery
    global.$ = jQuery
})(typeof window !== "undefined" ? window : globalThis)
// 注意 parent、siblings、next、prev 这几个方法都无法链式调用，因为它们返回的是一个dom元素，而不是jQuery对象
var dom = $('.dom').text("进行链式调用").css('color', 'yellow').css('fontSize', '18px').parent()
```
### 动画引擎
```js
//闭包 
(function (global) {
    // 防止变量重名
    const jQuery = function (selector, context = document) {
        return new jQuery.fn.init(selector, context)
    }
    jQuery.fn = jQuery.prototype
    jQuery.fn.init = function (selector, context) {
        if (selector) {
            // 获取dom
            this.dom = document.querySelectorAll(selector)
            // jQuery源码是怎么做的呢
            // 用正则判断 .XXX 就使用document.getElementsByClassName()
            // 用正则判断 #XXX 就使用document.getElementById()
            // 其他则用  document.getElementsByTagName()
        }
        // 链式调用的关键 --- 返回自身
        return this
    }
    // 这句代码解决了其他方法没有产生关联的问题
    // $('div').text("3124124")
    // 如果没有下面段代码则会报 TypeError: $(...).text is not a function
    // 因为它无法拿到text这个方法来执行，所以需要将jQuery.fn.init.prototype指向jQuery.fn
    // 这是利用了原型链的查找来实现的
    jQuery.fn.init.prototype = jQuery.fn

    // 动画引擎animate
    jQuery.fn.animate = function (properties, duration, easing = 'linear', callback) {
        //记录原始的状态 {width:100,height:100}
        //记录要变化的状态 {width:500,height:500}
        //计算增量 {width:500-100=400,height:500-100=400}
        //计算帧率 60fps progress进度 
        //duration总耗时
        const startStyle = {}
        const startTime = performance.now() //返回微妙 其次就是他是从页面加载到此刻所经过的时间
        const currentDom = this.dom[0]

        for (let key in properties) {
            startStyle[key] = parseFloat(getComputedStyle(currentDom)[key])
        }

        const animateStep = (currentTime) => {
            const easingFunctions = {
                linear: function (t) { return t; }, // 线性
                easeIn: function (t) { return t * t; }, // 加速
                easeOut: function (t) { return t * (2 - t); }, // 减速
                easeInOut: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; } // 先加速后减速
            };
            const easingFunction = easingFunctions[easing]
            //currentTime表示上一帧的渲染结束时间
            const elapsed = currentTime - startTime //持续时间
            const progress = Math.min(elapsed / duration, 1)//进度 临界值防止溢出
            const easingvalue = easingFunction(progress)
            //这些属性是不需要加px的
            const cssNumberProperties = ['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'zoom'];
            for (let key in properties) {
                const startValue = startStyle[key] //原始值
                const endValue = properties[key] //目标值
                //startValue 100  endValue 400  progress 当前的进度
                const value = startValue + (endValue - startValue) * easingvalue
                currentDom.style[key] = cssNumberProperties.includes(key) ? value : `${value}px`
            }

            if (progress < 1) {
                requestAnimationFrame(animateStep)
            } else {
                callback && callback()
            }

        }
        requestAnimationFrame(animateStep)

        //requestAnimationFrame() //专门做动画的函数 返回当前60fps所需要的时间 他返回的格式也是微秒
    }

    global.jQuery = jQuery
    global.$ = jQuery
})(typeof window !== "undefined" ? window : globalThis)
$('.dom').ananimate({ width: 500, height: 500, opacity: 1 }, 2000, "linear", () => {

})
```
### 支持插件、ajax、ready
```js
//闭包 
(function (global) {
    // 防止变量重名
    const jQuery = function (selector, context = document) {
        return new jQuery.fn.init(selector, context)
    }
    jQuery.fn = jQuery.prototype
    jQuery.fn.init = function (selector, context) {
        if (selector) {
            // 获取dom
            this.dom = document.querySelectorAll(selector)
            // jQuery源码是怎么做的呢
            // 用正则判断 .XXX 就使用document.getElementsByClassName()
            // 用正则判断 #XXX 就使用document.getElementById()
            // 其他则用  document.getElementsByTagName()
        }
        // 链式调用的关键 --- 返回自身
        return this
    }
    // 这句代码解决了其他方法没有产生关联的问题
    // $('div').text("进行链式调用")
    // 如果没有下面段代码则会报 TypeError: $(...).text is not a function
    // 因为它无法拿到text这个方法来执行，所以需要将jQuery.fn.init.prototype指向jQuery.fn
    // 这是利用了原型链的查找来实现的
    jQuery.fn.init.prototype = jQuery.fn

    //ajax
    jQuery.ajax = function (url, options) {
        const xhr = new XMLHttpRequest()
        xhr.open(options.method || 'GET', url, true)
        xhr.send(options.data || null)
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                options.success && options.success(xhr.responseText)
            }
        }
    }

    //支持插件
    jQuery.fn.$extend = function (obj) {
        for (let key in obj) {
            this[key] = obj[key]
        }
        return this
    }


    jQuery.ready = function (callback) {
        //onload 他需要等待页面加载完成 dom元素 图片 字体 css
        //DOMContentLoaded 不需要等待图片 css 字体 他只需要等待dom加载完成即可
        //支持async defer加载
        //优化如果dom已经加载过了呢
        if (document.readyState === 'complete') {
            callback()
        } else {
            document.addEventListener('DOMContentLoaded', callback)
        }
    }

    global.jQuery = jQuery
    global.$ = jQuery
})(typeof window !== "undefined" ? window : globalThis)
$.ready(function () {
    $.ajax(
        "http://127.0.0.1:5500/asd.html", {
        success: function (data) {
            console.log(data)
        }
    })
    $.fn.$extend({
        editText: function (text) {
            this.dom.forEach((item) => {
                item.innerText = text
            })
            return this
        }
    })
    $('.dom').editText("自己注入的方法")
})

```