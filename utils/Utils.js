export default class Utils {
    static timeList = [];
    // 随机色
    static randomColor(a, r, g, b) {
        var col = "rgba(";
        for (var i = 0; i < 3; i++) {
            col += ((isNaN(arguments[i + 1]) || arguments[i + 1] > 255 || arguments[i + 1] < 0) ? Math.floor(Math.random() * 256) : Math.floor(arguments[i + 1])) + ",";
        }
        col += (isNaN(a) ? Math.random().toFixed(2) : a) + ")";
        return col;
    }
    // 随机数
    static random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    // 计算时间差开始
    static timeStart() {
        return Utils.timeList.push(new Date().getTime()) - 1;
    }
    // 计算事件差 结束
    static timeEnd(id) {
        if (Utils.timeList[id] === undefined) return 0;
        return new Date().getTime() - Utils.timeList[id];
    }
    // 创建元素
    static ce(type, style, prop, parent) {
        var div = document.createElement(type);
        if (style && typeof style === "object") Object.assign(div.style, style)
        if (prop && typeof prop === "object") Object.assign(div, prop);
        if (parent) {
            if (typeof parent === "string") parent = document.querySelector(parent);
            parent.appendChild(div);
        }
        return div;
    }
    // 设置css样式
    static setCss(style) {
        if (document.styleSheets.length === 0) {
            var style = document.createElement("style");
            document.head.appendChild(style);
        }
        var styleSheet = document.styleSheets[document.styleSheets.length - 1];
        for (var prop in style) {
            var css = Object.keys(style[prop]).reduce(function (value, item) {
                var v = style[prop][item];
                if (["width", "height", "left", "top", "fontSize"].includes(item) && !String(v).includes("px")) {
                    v += "px";
                }
                return value + item + ":" + v + ";"
            }, "");
            css = css.replace(/([A-Z])/g, function ($1) {
                return "-" + $1.toLowerCase();
            });
            styleSheet.addRule(prop, css, styleSheet.cssRules.length);
        }
    }
    // 添加css样式
    static addCss(css) {
        if (document.styleSheets.length === 0) {
            var style = document.createElement("style");
            document.head.appendChild(style);
        }
        var styleSheet = document.styleSheets[document.styleSheets.length - 1];
        css.replace(/\r|\n/g, "").replace(/(.*?)\{(.*?)\}/g, function (item, a, b) {
            styleSheet.addRule(a, b, styleSheet.cssRules.length);
        })

    }
    // 图片预加载
    static loadImage(srcList, callback, basePath = "", extension = "jpg") {
        var img = new Image();
        img.index = 0;
        img.list = [];
        var extens = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
        img.srcList = srcList.map(function (item) {
            basePath = basePath.slice(-1) === "/" ? basePath : basePath + "/";
            var itemName = item.split(".").pop();
            return basePath + (extens.indexOf(itemName) > -1 ? item : item + "." + extension);
        })
        img.callback = callback;
        img.obj = this;
        img.addEventListener("load", this.loadHanlder);
        img.src = img.srcList[img.index];
    }
    static loadHanlder(e) {
        this.list.push(this.cloneNode(false));
        this.index++;
        if (this.index === this.srcList.length) {
            this.removeEventListener("load", this.obj.loadHanlder)
            this.callback(this.list);
            return
        }
        this.src = this.srcList[this.index];
    }
    // 拖拽
    static dragOn(elem, clock) {
        document.obj = this;
        elem.clock = clock;
        elem.w = elem.offsetWidth;
        elem.h = elem.offsetHeight;
        elem.addEventListener("mousedown", this.mouseHandler);
    }
    static dragOff(elem) {
        elem.removeEventListener("mousedown", this.mouseHandler);
    }
    static mouseHandler(e) {
        if (e.type === "mousedown") {
            e.preventDefault();
            document.offsetX = e.offsetX;
            document.offsetY = e.offsetY;
            document.currentTarget = this;
            document.addEventListener("mousemove", document.obj.mouseHandler);
            document.addEventListener("mouseup", document.obj.mouseHandler);
        } else if (e.type === "mousemove") {
            var rect = this.currentTarget.parentElement.getBoundingClientRect();
            var x = e.clientX - this.offsetX - rect.x;
            var y = e.clientY - this.offsetY - rect.y;
            if (this.currentTarget.clock) {
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x > rect.width - this.currentTarget.w) x = rect.width - this.currentTarget.w
                if (y > rect.height - this.currentTarget.h) y = rect.height - this.currentTarget.h
            }
            this.currentTarget.style.left = x + "px";
            this.currentTarget.style.top = y + "px";
        } else if (e.type === "mouseup") {
            document.removeEventListener("mousemove", document.obj.mouseHandler);
            document.removeEventListener("mouseup", document.obj.mouseHandler);
        }
    }
    // 发送ajax请求
    static ajax(_options) {
        // 默认数据
        let _default = {
            type: "GET",
            contentType: "application/x-www-form-urlencoded",
            jsonp: "cb",   // callback在get请求中的字段，(默认值是callback)后端通过它来获取全局函数名
            dataType: "json",   // dataType 为jsonp时执行jsonp跨域请求； 其他值时为解析响应的格式
            cb: "cb"         // 拼接全局函数的自定义前缀
        };
        let options = _options;
        if (!options) options = {};
        for (var prop in options) {
            _default[prop] = options[prop];
        }
        options = _default;
        if (Utils.isObject(options.data)) {
            var data = "";
            for (var prop in options.data) {
                data += "&" + prop + "=" + options.data[prop];
            }
            options.data = data.slice(1);
        }
        switch (options.dataType) {
            case "jsonp":
                this._jsonp(options);
                break;
            default:
                this.xhrRequest(options);
                break;
        }
    }
    static _jsonp(options) {
        var global_fn_name = options.cb + Date.now() + Math.random()
        global_fn_name = global_fn_name.replace(/0\./g, "_");
        // 制造伪全局变量; 
        window[global_fn_name] = function (res) {
              delete window[global_fn_name]; 
              typeof options.callback === "function" ? options.callback(res) : "";
        }
        // 判断URL有没有? 如果有我们用 & 拼接; 
        options.url += (/\?/.test(options.url) ? "&" : "?") + options.jsonp + "=" + global_fn_name;
        console.log(options);
        var script = document.createElement("script");
        script.src = options.url;
        document.body.appendChild(script);
        script.addEventListener("load", this.removeHander);
    }
    static removeHander(e) {
        document.body.removeChild(e.target);
    }
    static xhrRequest(options) {
        let req_type = options.type.toUpperCase();
        if (req_type === "GET") {
            options.url += "?" + options.data;
        }
        let xhr = new XMLHttpRequest();
        xhr.open(req_type, options.url);
        // POST 请求时，加上请求头
        if (req_type === "POST") {
            xhr.setRequestHeader("Content-Type", options.contentType);
        }
        xhr.send(req_type === "GET" ? null : options.data);
        // 监听请求状态，当readyState改变时触发
        xhr.options = options;
        xhr.addEventListener("readystatechange", this.readyStateHandler);
    }
    static readyStateHandler(e) {
        // 这里this指向xhr对象
        if (this.readyState === 4 && /^2\d{2}$/.test(this.status)) {
            var res = this.responseText;
            console.log(res)
            switch(this.options.dataType) {
                case "html":
                    res = res;
                    break;
                case "json":
                    res = JSON.parse(res);
            }
            typeof this.options.callback === "function" ? this.options.callback(res) : "返回信息";
        }
        // 删除事件
        // console.log(this)
        // console.log(this.readyStateHandler, "-");
        this.removeEventListener("readystatechange", this.readyStateHandler);
    }
    // 判断是否是对象
    static isObject(obj) {
        return (typeof obj === "object" && obj !== null && !(obj instanceof Array));
    }
    // 判断是否为数组
    static isArray(arr) {
        // typeof arr === "object" 
        //  arr instanceof Array  检测Array的prototype属性是否出现在arr原型链上，原型链可修改，不可靠
        // arr.constructor === Array 多全局环境时，问题同上
        // Object.prototype.toString.call(arr) === '[object Array]'  最强大，支持多全局环境
        // Array.isArray(arr) 简单好用 可能不支持ES5之前
        return Object.prototype.toString.call(arr) === '[onject Array]'
    }
}
