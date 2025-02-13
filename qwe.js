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

        console.log(options)

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
        text: function (text) {
            this.dom.forEach((item) => {
                item.innerText = text
            })
            return this
        }
    })
    $('.dom').text("进行链式调用")
})