/*!
 * mdui.editor 1.0.2 (https://github.com/zdhxiong/mdui.editor#readme)
 * Copyright 2019-2021 zdhxiong
 * Licensed under MIT
 */
function isFunction(target) {
    return typeof target === 'function';
}
function isString(target) {
    return typeof target === 'string';
}
function isNumber(target) {
    return typeof target === 'number';
}
function isBoolean(target) {
    return typeof target === 'boolean';
}
function isUndefined(target) {
    return typeof target === 'undefined';
}
function isNull(target) {
    return target === null;
}
function isWindow(target) {
    return target instanceof Window;
}
function isDocument(target) {
    return target instanceof Document;
}
function isElement(target) {
    return target instanceof Element;
}
function isNode(target) {
    return target instanceof Node;
}
/**
 * 是否是 IE 浏览器
 */
function isIE() {
    // @ts-ignore
    return !!window.document.documentMode;
}
function isArrayLike(target) {
    if (isFunction(target) || isWindow(target)) {
        return false;
    }
    return isNumber(target.length);
}
function isObjectLike(target) {
    return typeof target === 'object' && target !== null;
}
function toElement(target) {
    return isDocument(target) ? target.documentElement : target;
}
/**
 * 把用 - 分隔的字符串转为驼峰（如 box-sizing 转换为 boxSizing）
 * @param string
 */
function toCamelCase(string) {
    return string
        .replace(/^-ms-/, 'ms-')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
/**
 * 把驼峰法转为用 - 分隔的字符串（如 boxSizing 转换为 box-sizing）
 * @param string
 */
function toKebabCase(string) {
    return string.replace(/[A-Z]/g, (replacer) => '-' + replacer.toLowerCase());
}
/**
 * 获取元素的样式值
 * @param element
 * @param name
 */
function getComputedStyleValue(element, name) {
    return window.getComputedStyle(element).getPropertyValue(toKebabCase(name));
}
/**
 * 检查元素的 box-sizing 是否是 border-box
 * @param element
 */
function isBorderBox(element) {
    return getComputedStyleValue(element, 'box-sizing') === 'border-box';
}
/**
 * 获取元素的 padding, border, margin 宽度（两侧宽度的和，单位为px）
 * @param element
 * @param direction
 * @param extra
 */
function getExtraWidth(element, direction, extra) {
    const position = direction === 'width' ? ['Left', 'Right'] : ['Top', 'Bottom'];
    return [0, 1].reduce((prev, _, index) => {
        let prop = extra + position[index];
        if (extra === 'border') {
            prop += 'Width';
        }
        return prev + parseFloat(getComputedStyleValue(element, prop) || '0');
    }, 0);
}
/**
 * 获取元素的样式值，对 width 和 height 进行过处理
 * @param element
 * @param name
 */
function getStyle(element, name) {
    // width、height 属性使用 getComputedStyle 得到的值不准确，需要使用 getBoundingClientRect 获取
    if (name === 'width' || name === 'height') {
        const valueNumber = element.getBoundingClientRect()[name];
        if (isBorderBox(element)) {
            return `${valueNumber}px`;
        }
        return `${valueNumber -
            getExtraWidth(element, name, 'border') -
            getExtraWidth(element, name, 'padding')}px`;
    }
    return getComputedStyleValue(element, name);
}
/**
 * 获取子节点组成的数组
 * @param target
 * @param parent
 */
function getChildNodesArray(target, parent) {
    const tempParent = document.createElement(parent);
    tempParent.innerHTML = target;
    return [].slice.call(tempParent.childNodes);
}
/**
 * 始终返回 false 的函数
 */
function returnFalse() {
    return false;
}
/**
 * 数值单位的 CSS 属性
 */
const cssNumber = [
    'animationIterationCount',
    'columnCount',
    'fillOpacity',
    'flexGrow',
    'flexShrink',
    'fontWeight',
    'gridArea',
    'gridColumn',
    'gridColumnEnd',
    'gridColumnStart',
    'gridRow',
    'gridRowEnd',
    'gridRowStart',
    'lineHeight',
    'opacity',
    'order',
    'orphans',
    'widows',
    'zIndex',
    'zoom',
];

function each(target, callback) {
    if (isArrayLike(target)) {
        for (let i = 0; i < target.length; i += 1) {
            if (callback.call(target[i], i, target[i]) === false) {
                return target;
            }
        }
    }
    else {
        const keys = Object.keys(target);
        for (let i = 0; i < keys.length; i += 1) {
            if (callback.call(target[keys[i]], keys[i], target[keys[i]]) === false) {
                return target;
            }
        }
    }
    return target;
}

/**
 * 为了使用模块扩充，这里不能使用默认导出
 */
class JQ {
    constructor(arr) {
        this.length = 0;
        if (!arr) {
            return this;
        }
        each(arr, (i, item) => {
            // @ts-ignore
            this[i] = item;
        });
        this.length = arr.length;
        return this;
    }
}

function get$() {
    const $ = function (selector) {
        if (!selector) {
            return new JQ();
        }
        // JQ
        if (selector instanceof JQ) {
            return selector;
        }
        // function
        if (isFunction(selector)) {
            if (/complete|loaded|interactive/.test(document.readyState) &&
                document.body) {
                selector.call(document, $);
            }
            else {
                document.addEventListener('DOMContentLoaded', () => selector.call(document, $), false);
            }
            return new JQ([document]);
        }
        // String
        if (isString(selector)) {
            const html = selector.trim();
            // 根据 HTML 字符串创建 JQ 对象
            if (html[0] === '<' && html[html.length - 1] === '>') {
                let toCreate = 'div';
                const tags = {
                    li: 'ul',
                    tr: 'tbody',
                    td: 'tr',
                    th: 'tr',
                    tbody: 'table',
                    option: 'select',
                };
                each(tags, (childTag, parentTag) => {
                    if (html.indexOf(`<${childTag}`) === 0) {
                        toCreate = parentTag;
                        return false;
                    }
                    return;
                });
                return new JQ(getChildNodesArray(html, toCreate));
            }
            // 根据 CSS 选择器创建 JQ 对象
            const isIdSelector = selector[0] === '#' && !selector.match(/[ .<>:~]/);
            if (!isIdSelector) {
                return new JQ(document.querySelectorAll(selector));
            }
            const element = document.getElementById(selector.slice(1));
            if (element) {
                return new JQ([element]);
            }
            return new JQ();
        }
        if (isArrayLike(selector) && !isNode(selector)) {
            return new JQ(selector);
        }
        return new JQ([selector]);
    };
    $.fn = JQ.prototype;
    return $;
}
const $ = get$();

function extend(target, object1, ...objectN) {
    objectN.unshift(object1);
    each(objectN, (_, object) => {
        each(object, (prop, value) => {
            if (!isUndefined(value)) {
                target[prop] = value;
            }
        });
    });
    return target;
}

$.fn.each = function (callback) {
    return each(this, callback);
};

each(['add', 'remove', 'toggle'], (_, name) => {
    $.fn[`${name}Class`] = function (className) {
        if (name === 'remove' && !arguments.length) {
            return this.each((_, element) => {
                element.setAttribute('class', '');
            });
        }
        return this.each((i, element) => {
            if (!isElement(element)) {
                return;
            }
            const classes = (isFunction(className)
                ? className.call(element, i, element.getAttribute('class') || '')
                : className)
                .split(' ')
                .filter((name) => name);
            each(classes, (_, cls) => {
                element.classList[name](cls);
            });
        });
    };
});

each(['insertBefore', 'insertAfter'], (nameIndex, name) => {
    $.fn[name] = function (target) {
        const $element = nameIndex ? $(this.get().reverse()) : this; // 顺序和 jQuery 保持一致
        const $target = $(target);
        const result = [];
        $target.each((index, target) => {
            if (!target.parentNode) {
                return;
            }
            $element.each((_, element) => {
                const newItem = index
                    ? element.cloneNode(true)
                    : element;
                const existingItem = nameIndex ? target.nextSibling : target;
                result.push(newItem);
                target.parentNode.insertBefore(newItem, existingItem);
            });
        });
        return $(nameIndex ? result.reverse() : result);
    };
});

/**
 * 是否不是 HTML 字符串（包裹在 <> 中）
 * @param target
 */
function isPlainText(target) {
    return (isString(target) && (target[0] !== '<' || target[target.length - 1] !== '>'));
}
each(['before', 'after'], (nameIndex, name) => {
    $.fn[name] = function (...args) {
        // after 方法，多个参数需要按参数顺序添加到元素后面，所以需要将参数顺序反向处理
        if (nameIndex === 1) {
            args = args.reverse();
        }
        return this.each((index, element) => {
            const targets = isFunction(args[0])
                ? [args[0].call(element, index, element.innerHTML)]
                : args;
            each(targets, (_, target) => {
                let $target;
                if (isPlainText(target)) {
                    $target = $(getChildNodesArray(target, 'div'));
                }
                else if (index && isElement(target)) {
                    $target = $(target.cloneNode(true));
                }
                else {
                    $target = $(target);
                }
                $target[nameIndex ? 'insertAfter' : 'insertBefore'](element);
            });
        });
    };
});

function map(elements, callback) {
    let value;
    const ret = [];
    each(elements, (i, element) => {
        value = callback.call(window, element, i);
        if (value != null) {
            ret.push(value);
        }
    });
    return [].concat(...ret);
}

$.fn.map = function (callback) {
    return new JQ(map(this, (element, i) => callback.call(element, i, element)));
};

$.fn.clone = function () {
    return this.map(function () {
        return this.cloneNode(true);
    });
};

$.fn.is = function (selector) {
    let isMatched = false;
    if (isFunction(selector)) {
        this.each((index, element) => {
            if (selector.call(element, index, element)) {
                isMatched = true;
            }
        });
        return isMatched;
    }
    if (isString(selector)) {
        this.each((_, element) => {
            if (isDocument(element) || isWindow(element)) {
                return;
            }
            // @ts-ignore
            const matches = element.matches || element.msMatchesSelector;
            if (matches.call(element, selector)) {
                isMatched = true;
            }
        });
        return isMatched;
    }
    const $compareWith = $(selector);
    this.each((_, element) => {
        $compareWith.each((_, compare) => {
            if (element === compare) {
                isMatched = true;
            }
        });
    });
    return isMatched;
};

$.fn.remove = function (selector) {
    return this.each((_, element) => {
        if (element.parentNode && (!selector || $(element).is(selector))) {
            element.parentNode.removeChild(element);
        }
    });
};

each(['prepend', 'append'], (nameIndex, name) => {
    $.fn[name] = function (...args) {
        return this.each((index, element) => {
            const childNodes = element.childNodes;
            const childLength = childNodes.length;
            const child = childLength
                ? childNodes[nameIndex ? childLength - 1 : 0]
                : document.createElement('div');
            if (!childLength) {
                element.appendChild(child);
            }
            let contents = isFunction(args[0])
                ? [args[0].call(element, index, element.innerHTML)]
                : args;
            // 如果不是字符串，则仅第一个元素使用原始元素，其他的都克隆自第一个元素
            if (index) {
                contents = contents.map((content) => {
                    return isString(content) ? content : $(content).clone();
                });
            }
            $(child)[nameIndex ? 'after' : 'before'](...contents);
            if (!childLength) {
                element.removeChild(child);
            }
        });
    };
});

each(['attr', 'prop', 'css'], (nameIndex, name) => {
    function set(element, key, value) {
        // 值为 undefined 时，不修改
        if (isUndefined(value)) {
            return;
        }
        switch (nameIndex) {
            // attr
            case 0:
                if (isNull(value)) {
                    element.removeAttribute(key);
                }
                else {
                    element.setAttribute(key, value);
                }
                break;
            // prop
            case 1:
                // @ts-ignore
                element[key] = value;
                break;
            // css
            default:
                key = toCamelCase(key);
                // @ts-ignore
                element.style[key] = isNumber(value)
                    ? `${value}${cssNumber.indexOf(key) > -1 ? '' : 'px'}`
                    : value;
                break;
        }
    }
    function get(element, key) {
        switch (nameIndex) {
            // attr
            case 0:
                // 属性不存在时，原生 getAttribute 方法返回 null，而 jquery 返回 undefined。这里和 jquery 保持一致
                const value = element.getAttribute(key);
                return isNull(value) ? undefined : value;
            // prop
            case 1:
                // @ts-ignore
                return element[key];
            // css
            default:
                return getStyle(element, key);
        }
    }
    $.fn[name] = function (key, value) {
        if (isObjectLike(key)) {
            each(key, (k, v) => {
                // @ts-ignore
                this[name](k, v);
            });
            return this;
        }
        if (arguments.length === 1) {
            const element = this[0];
            return isElement(element) ? get(element, key) : undefined;
        }
        return this.each((i, element) => {
            set(element, key, isFunction(value) ? value.call(element, i, get(element, key)) : value);
        });
    };
});

/**
 * 过滤掉数组中的重复元素
 * @param arr 数组
 * @example
```js
unique([1, 2, 12, 3, 2, 1, 2, 1, 1]);
// [1, 2, 12, 3]
```
 */
function unique(arr) {
    const result = [];
    each(arr, (_, val) => {
        if (result.indexOf(val) === -1) {
            result.push(val);
        }
    });
    return result;
}

$.fn.children = function (selector) {
    const children = [];
    this.each((_, element) => {
        each(element.childNodes, (__, childNode) => {
            if (!isElement(childNode)) {
                return;
            }
            if (!selector || $(childNode).is(selector)) {
                children.push(childNode);
            }
        });
    });
    return new JQ(unique(children));
};

$.fn.slice = function (...args) {
    return new JQ([].slice.apply(this, args));
};

$.fn.eq = function (index) {
    const ret = index === -1 ? this.slice(index) : this.slice(index, +index + 1);
    return new JQ(ret);
};

$.fn.first = function () {
    return this.eq(0);
};

each(['val', 'html', 'text'], (nameIndex, name) => {
    const props = {
        0: 'value',
        1: 'innerHTML',
        2: 'textContent',
    };
    const propName = props[nameIndex];
    function get($elements) {
        // text() 获取所有元素的文本
        if (nameIndex === 2) {
            // @ts-ignore
            return map($elements, (element) => toElement(element)[propName]).join('');
        }
        // 空集合时，val() 和 html() 返回 undefined
        if (!$elements.length) {
            return undefined;
        }
        // val() 和 html() 仅获取第一个元素的内容
        const firstElement = $elements[0];
        // select multiple 返回数组
        if (nameIndex === 0 && $(firstElement).is('select[multiple]')) {
            return map($(firstElement).find('option:checked'), (element) => element.value);
        }
        // @ts-ignore
        return firstElement[propName];
    }
    function set(element, value) {
        // text() 和 html() 赋值为 undefined，则保持原内容不变
        // val() 赋值为 undefined 则赋值为空
        if (isUndefined(value)) {
            if (nameIndex !== 0) {
                return;
            }
            value = '';
        }
        if (nameIndex === 1 && isElement(value)) {
            value = value.outerHTML;
        }
        // @ts-ignore
        element[propName] = value;
    }
    $.fn[name] = function (value) {
        // 获取值
        if (!arguments.length) {
            return get(this);
        }
        // 设置值
        return this.each((i, element) => {
            const computedValue = isFunction(value)
                ? value.call(element, i, get($(element)))
                : value;
            // value 是数组，则选中数组中的元素，反选不在数组中的元素
            if (nameIndex === 0 && Array.isArray(computedValue)) {
                // select[multiple]
                if ($(element).is('select[multiple]')) {
                    map($(element).find('option'), (option) => (option.selected =
                        computedValue.indexOf(option.value) >
                            -1));
                }
                // 其他 checkbox, radio 等元素
                else {
                    element.checked =
                        computedValue.indexOf(element.value) > -1;
                }
            }
            else {
                set(element, computedValue);
            }
        });
    };
});

$.fn.last = function () {
    return this.eq(-1);
};

/**
 * 检查 container 元素内是否包含 contains 元素
 * @param container 父元素
 * @param contains 子元素
 * @example
```js
contains( document, document.body ); // true
contains( document.getElementById('test'), document ); // false
contains( $('.container').get(0), $('.contains').get(0) ); // false
```
 */
function contains(container, contains) {
    return container !== contains && toElement(container).contains(contains);
}

/**
 * 把第二个数组的元素追加到第一个数组中，并返回合并后的数组
 * @param first 第一个数组
 * @param second 该数组的元素将被追加到第一个数组中
 * @example
```js
merge( [ 0, 1, 2 ], [ 2, 3, 4 ] )
// [ 0, 1, 2, 2, 3, 4 ]
```
 */
function merge(first, second) {
    each(second, (_, value) => {
        first.push(value);
    });
    return first;
}

$.fn.get = function (index) {
    return index === undefined
        ? [].slice.call(this)
        : this[index >= 0 ? index : index + this.length];
};

$.fn.find = function (selector) {
    const foundElements = [];
    this.each((_, element) => {
        merge(foundElements, $(element.querySelectorAll(selector)).get());
    });
    return new JQ(foundElements);
};

// 存储事件
const handlers = {};
// 元素ID
let mduiElementId = 1;
/**
 * 为元素赋予一个唯一的ID
 */
function getElementId(element) {
    const key = '_mduiEventId';
    // @ts-ignore
    if (!element[key]) {
        // @ts-ignore
        element[key] = ++mduiElementId;
    }
    // @ts-ignore
    return element[key];
}
/**
 * 解析事件名中的命名空间
 */
function parse(type) {
    const parts = type.split('.');
    return {
        type: parts[0],
        ns: parts.slice(1).sort().join(' '),
    };
}
/**
 * 命名空间匹配规则
 */
function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
}
/**
 * 获取匹配的事件
 * @param element
 * @param type
 * @param func
 * @param selector
 */
function getHandlers(element, type, func, selector) {
    const event = parse(type);
    return (handlers[getElementId(element)] || []).filter((handler) => handler &&
        (!event.type || handler.type === event.type) &&
        (!event.ns || matcherFor(event.ns).test(handler.ns)) &&
        (!func || getElementId(handler.func) === getElementId(func)) &&
        (!selector || handler.selector === selector));
}
/**
 * 添加事件监听
 * @param element
 * @param types
 * @param func
 * @param data
 * @param selector
 */
function add(element, types, func, data, selector) {
    const elementId = getElementId(element);
    if (!handlers[elementId]) {
        handlers[elementId] = [];
    }
    // 传入 data.useCapture 来设置 useCapture: true
    let useCapture = false;
    if (isObjectLike(data) && data.useCapture) {
        useCapture = true;
    }
    types.split(' ').forEach((type) => {
        if (!type) {
            return;
        }
        const event = parse(type);
        function callFn(e, elem) {
            // 因为鼠标事件模拟事件的 detail 属性是只读的，因此在 e._detail 中存储参数
            const result = func.apply(elem, 
            // @ts-ignore
            e._detail === undefined ? [e] : [e].concat(e._detail));
            if (result === false) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        function proxyFn(e) {
            // @ts-ignore
            if (e._ns && !matcherFor(e._ns).test(event.ns)) {
                return;
            }
            // @ts-ignore
            e._data = data;
            if (selector) {
                // 事件代理
                $(element)
                    .find(selector)
                    .get()
                    .reverse()
                    .forEach((elem) => {
                    if (elem === e.target ||
                        contains(elem, e.target)) {
                        callFn(e, elem);
                    }
                });
            }
            else {
                // 不使用事件代理
                callFn(e, element);
            }
        }
        const handler = {
            type: event.type,
            ns: event.ns,
            func,
            selector,
            id: handlers[elementId].length,
            proxy: proxyFn,
        };
        handlers[elementId].push(handler);
        element.addEventListener(handler.type, proxyFn, useCapture);
    });
}
/**
 * 移除事件监听
 * @param element
 * @param types
 * @param func
 * @param selector
 */
function remove(element, types, func, selector) {
    const handlersInElement = handlers[getElementId(element)] || [];
    const removeEvent = (handler) => {
        delete handlersInElement[handler.id];
        element.removeEventListener(handler.type, handler.proxy, false);
    };
    if (!types) {
        handlersInElement.forEach((handler) => removeEvent(handler));
    }
    else {
        types.split(' ').forEach((type) => {
            if (type) {
                getHandlers(element, type, func, selector).forEach((handler) => removeEvent(handler));
            }
        });
    }
}

$.fn.off = function (types, selector, callback) {
    // types 是对象
    if (isObjectLike(types)) {
        each(types, (type, fn) => {
            // this.off('click', undefined, function () {})
            // this.off('click', '.box', function () {})
            this.off(type, selector, fn);
        });
        return this;
    }
    // selector 不存在
    if (selector === false || isFunction(selector)) {
        callback = selector;
        selector = undefined;
        // this.off('click', undefined, function () {})
    }
    // callback 传入 `false`，相当于 `return false`
    if (callback === false) {
        callback = returnFalse;
    }
    return this.each(function () {
        remove(this, types, callback, selector);
    });
};

$.fn.on = function (types, selector, data, callback, one) {
    // types 可以是 type/func 对象
    if (isObjectLike(types)) {
        // (types-Object, selector, data)
        if (!isString(selector)) {
            // (types-Object, data)
            data = data || selector;
            selector = undefined;
        }
        each(types, (type, fn) => {
            // selector 和 data 都可能是 undefined
            // @ts-ignore
            this.on(type, selector, data, fn, one);
        });
        return this;
    }
    if (data == null && callback == null) {
        // (types, fn)
        callback = selector;
        data = selector = undefined;
    }
    else if (callback == null) {
        if (isString(selector)) {
            // (types, selector, fn)
            callback = data;
            data = undefined;
        }
        else {
            // (types, data, fn)
            callback = data;
            data = selector;
            selector = undefined;
        }
    }
    if (callback === false) {
        callback = returnFalse;
    }
    else if (!callback) {
        return this;
    }
    // $().one()
    if (one) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        const origCallback = callback;
        callback = function (event) {
            _this.off(event.type, selector, callback);
            // eslint-disable-next-line prefer-rest-params
            return origCallback.apply(this, arguments);
        };
    }
    return this.each(function () {
        add(this, types, callback, data, selector);
    });
};

each(['appendTo', 'prependTo'], (nameIndex, name) => {
    $.fn[name] = function (target) {
        const extraChilds = [];
        const $target = $(target).map((_, element) => {
            const childNodes = element.childNodes;
            const childLength = childNodes.length;
            if (childLength) {
                return childNodes[nameIndex ? 0 : childLength - 1];
            }
            const child = document.createElement('div');
            element.appendChild(child);
            extraChilds.push(child);
            return child;
        });
        const $result = this[nameIndex ? 'insertBefore' : 'insertAfter']($target);
        $(extraChilds).remove();
        return $result;
    };
});

class CommonAbstract {
    /**
     * @param editor 编辑器实例
     */
    constructor(editor) {
        this.editor = editor;
    }
    /**
     * 工具栏 JQ 对象
     */
    get $toolbar() {
        return this.editor.$toolbar;
    }
    /**
     * 内容区域 JQ 对象
     */
    get $container() {
        return this.editor.$container;
    }
    /**
     * 选区实例
     */
    get selection() {
        return this.editor.selection;
    }
    /**
     * 命令实例
     */
    get command() {
        return this.editor.command;
    }
}

/**
 * 封装 document.execCommand 命令
 */
class Command extends CommonAbstract {
    /**
     * 执行命令
     * @param name
     * @param value
     */
    do(name, value) {
        // 如果无选区，忽略
        if (!this.selection.getRange()) {
            return;
        }
        // 恢复选区
        this.selection.restore();
        const customName = name;
        // 执行命令
        // @ts-ignore
        if (this[customName]) {
            // @ts-ignore
            this[customName](value);
        }
        else {
            document.execCommand(name, false, value);
        }
        // 修改菜单状态
        this.editor.menus.changeStatus();
        // 最后，恢复选区保证光标在原来的位置闪烁
        this.selection.saveRange();
        this.selection.restore();
        // 触发 onchange
        if (this.editor.change) {
            this.editor.change();
        }
    }
    /**
     * 自定义 insertHTML 事件，在当前选区中插入指定 HTML
     * @param html
     */
    // @ts-ignore
    insertHTML(html) {
        // W3C
        if (document.queryCommandSupported('insertHTML')) {
            document.execCommand('insertHTML', false, html);
            return;
        }
        const range = this.selection.getRange();
        if (range.insertNode) {
            // IE
            range.deleteContents();
            range.insertNode($(html)[0]);
            // @ts-ignore
        }
        else if (range.pasteHTML) {
            // IE <= 10
            // @ts-ignore
            range.pasteHTML(html);
        }
    }
    /**
     * 用指定 HTML 替换当前选区的 root 元素
     * @param html
     */
    // @ts-ignore
    replaceRoot(html) {
        const $oldElem = this.selection.getRootElem();
        const $newElem = $(html).insertAfter($oldElem);
        $oldElem.remove();
        this.selection.createRangeByElem($newElem, false, true);
        this.selection.restore();
    }
    /**
     * 在当前选区的 root 元素后面插入指定 html
     * @param html
     */
    // @ts-ignore
    insertAfterRoot(html) {
        const $oldElem = this.selection.getRootElem();
        const $newElem = $(html).insertAfter($oldElem);
        this.selection.createRangeByElem($newElem, false, true);
        this.selection.restore();
    }
    /**
     * 在当前 $content 的最后追加 html
     * @param html
     */
    // @ts-ignore
    appendHTML(html) {
        const $newElem = $(html).appendTo(this.$container);
        this.selection.createRangeByElem($newElem, false, true);
        this.selection.restore();
    }
    /**
     * 插入 elem
     * @param $elem
     */
    // @ts-ignore
    insertElem($elem) {
        const range = this.selection.getRange();
        if (range.insertNode) {
            range.deleteContents();
            range.insertNode($elem[0]);
        }
    }
}

class MenuAbstract extends CommonAbstract {
    /**
     * @param editor 编辑器实例
     * @param $button 按钮 JQ 对象
     */
    constructor(editor, $button) {
        super(editor);
        this.$button = $button;
    }
    /**
     * 按钮是否激活
     */
    isActive() {
        return false;
    }
}
/**
 * 按钮图标
 */
MenuAbstract.icon = '';
/**
 * 按钮名称
 */
MenuAbstract.title = '';
/**
 * 激活按钮时，需要禁用的其他按钮
 */
MenuAbstract.disable = [];

/**
 * 原生命令抽象类
 */
class MenuNativeAbstract extends MenuAbstract {
    onclick() {
        const isSelectionEmpty = this.selection.isEmpty();
        if (isSelectionEmpty) {
            // 选区是空的，插入并选中一个“空白”
            this.selection.createEmptyRange(this.getElementName());
        }
        // 执行 bold 命令
        this.command.do(this.getCommandName());
        if (isSelectionEmpty) {
            // 需要将选区折叠起来
            this.selection.collapseRange();
            this.selection.restore();
        }
    }
    isActive() {
        return document.queryCommandState(this.getCommandName());
    }
}

/**
 * 加粗
 */
class Bold extends MenuNativeAbstract {
    getCommandName() {
        return 'bold';
    }
    getElementName() {
        return 'strong';
    }
}
Bold.icon = 'format_bold';
Bold.title = '粗体';
Bold.disable = ['image'];

// 避免页面加载完后直接执行css动画
// https://css-tricks.com/transitions-only-after-page-load/
setTimeout(() => $('body').addClass('mdui-loaded'));
const mdui = {
    $: $,
};

const $document = $(document);
const $window = $(window);
$('body');

$.fn.hasClass = function (className) {
    return this[0].classList.contains(className);
};

/**
 * 值上面的 padding、border、margin 处理
 * @param element
 * @param name
 * @param value
 * @param funcIndex
 * @param includeMargin
 * @param multiply
 */
function handleExtraWidth(element, name, value, funcIndex, includeMargin, multiply) {
    // 获取元素的 padding, border, margin 宽度（两侧宽度的和）
    const getExtraWidthValue = (extra) => {
        return (getExtraWidth(element, name.toLowerCase(), extra) *
            multiply);
    };
    if (funcIndex === 2 && includeMargin) {
        value += getExtraWidthValue('margin');
    }
    if (isBorderBox(element)) {
        // IE 为 box-sizing: border-box 时，得到的值不含 border 和 padding，这里先修复
        // 仅获取时需要处理，multiply === 1 为 get
        if (isIE() && multiply === 1) {
            value += getExtraWidthValue('border');
            value += getExtraWidthValue('padding');
        }
        if (funcIndex === 0) {
            value -= getExtraWidthValue('border');
        }
        if (funcIndex === 1) {
            value -= getExtraWidthValue('border');
            value -= getExtraWidthValue('padding');
        }
    }
    else {
        if (funcIndex === 0) {
            value += getExtraWidthValue('padding');
        }
        if (funcIndex === 2) {
            value += getExtraWidthValue('border');
            value += getExtraWidthValue('padding');
        }
    }
    return value;
}
/**
 * 获取元素的样式值
 * @param element
 * @param name
 * @param funcIndex 0: innerWidth, innerHeight; 1: width, height; 2: outerWidth, outerHeight
 * @param includeMargin
 */
function get(element, name, funcIndex, includeMargin) {
    const clientProp = `client${name}`;
    const scrollProp = `scroll${name}`;
    const offsetProp = `offset${name}`;
    const innerProp = `inner${name}`;
    // $(window).width()
    if (isWindow(element)) {
        // outerWidth, outerHeight 需要包含滚动条的宽度
        return funcIndex === 2
            ? element[innerProp]
            : toElement(document)[clientProp];
    }
    // $(document).width()
    if (isDocument(element)) {
        const doc = toElement(element);
        return Math.max(
        // @ts-ignore
        element.body[scrollProp], doc[scrollProp], 
        // @ts-ignore
        element.body[offsetProp], doc[offsetProp], doc[clientProp]);
    }
    const value = parseFloat(getComputedStyleValue(element, name.toLowerCase()) || '0');
    return handleExtraWidth(element, name, value, funcIndex, includeMargin, 1);
}
/**
 * 设置元素的样式值
 * @param element
 * @param elementIndex
 * @param name
 * @param funcIndex 0: innerWidth, innerHeight; 1: width, height; 2: outerWidth, outerHeight
 * @param includeMargin
 * @param value
 */
function set(element, elementIndex, name, funcIndex, includeMargin, value) {
    let computedValue = isFunction(value)
        ? value.call(element, elementIndex, get(element, name, funcIndex, includeMargin))
        : value;
    if (computedValue == null) {
        return;
    }
    const $element = $(element);
    const dimension = name.toLowerCase();
    // 特殊的值，不需要计算 padding、border、margin
    if (['auto', 'inherit', ''].indexOf(computedValue) > -1) {
        $element.css(dimension, computedValue);
        return;
    }
    // 其他值保留原始单位。注意：如果不使用 px 作为单位，则算出的值一般是不准确的
    const suffix = computedValue.toString().replace(/\b[0-9.]*/, '');
    const numerical = parseFloat(computedValue);
    computedValue =
        handleExtraWidth(element, name, numerical, funcIndex, includeMargin, -1) +
            (suffix || 'px');
    $element.css(dimension, computedValue);
}
each(['Width', 'Height'], (_, name) => {
    each([`inner${name}`, name.toLowerCase(), `outer${name}`], (funcIndex, funcName) => {
        $.fn[funcName] = function (margin, value) {
            // 是否是赋值操作
            const isSet = arguments.length && (funcIndex < 2 || !isBoolean(margin));
            const includeMargin = margin === true || value === true;
            // 获取第一个元素的值
            if (!isSet) {
                return this.length
                    ? get(this[0], name, funcIndex, includeMargin)
                    : undefined;
            }
            // 设置每个元素的值
            return this.each((index, element) => set(element, index, name, funcIndex, includeMargin, margin));
        };
    });
});

$.fn.hide = function () {
    return this.each(function () {
        this.style.display = 'none';
    });
};

const elementDisplay = {};
/**
 * 获取元素的初始 display 值，用于 .show() 方法
 * @param nodeName
 */
function defaultDisplay(nodeName) {
    let element;
    let display;
    if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName);
        document.body.appendChild(element);
        display = getStyle(element, 'display');
        element.parentNode.removeChild(element);
        if (display === 'none') {
            display = 'block';
        }
        elementDisplay[nodeName] = display;
    }
    return elementDisplay[nodeName];
}
/**
 * 显示指定元素
 * @returns {JQ}
 */
$.fn.show = function () {
    return this.each(function () {
        if (this.style.display === 'none') {
            this.style.display = '';
        }
        if (getStyle(this, 'display') === 'none') {
            this.style.display = defaultDisplay(this.nodeName);
        }
    });
};

$.fn.transitionEnd = function (callback) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const events = ['webkitTransitionEnd', 'transitionend'];
    function fireCallback(e) {
        if (e.target !== this) {
            return;
        }
        // @ts-ignore
        callback.call(this, e);
        each(events, (_, event) => {
            that.off(event, fireCallback);
        });
    }
    each(events, (_, event) => {
        that.on(event, fireCallback);
    });
    return this;
};

const dataNS = '_mduiElementDataStorage';

/**
 * 在元素上设置键值对数据
 * @param element
 * @param object
 */
function setObjectToElement(element, object) {
    // @ts-ignore
    if (!element[dataNS]) {
        // @ts-ignore
        element[dataNS] = {};
    }
    each(object, (key, value) => {
        // @ts-ignore
        element[dataNS][toCamelCase(key)] = value;
    });
}
function data(element, key, value) {
    // 根据键值对设置值
    // data(element, { 'key' : 'value' })
    if (isObjectLike(key)) {
        setObjectToElement(element, key);
        return key;
    }
    // 根据 key、value 设置值
    // data(element, 'key', 'value')
    if (!isUndefined(value)) {
        setObjectToElement(element, { [key]: value });
        return value;
    }
    // 获取所有值
    // data(element)
    if (isUndefined(key)) {
        // @ts-ignore
        return element[dataNS] ? element[dataNS] : {};
    }
    // 从 dataNS 中获取指定值
    // data(element, 'key')
    key = toCamelCase(key);
    // @ts-ignore
    if (element[dataNS] && key in element[dataNS]) {
        // @ts-ignore
        return element[dataNS][key];
    }
    return undefined;
}

const rbrace = /^(?:{[\w\W]*\}|\[[\w\W]*\])$/;
// 从 `data-*` 中获取的值，需要经过该函数转换
function getData(value) {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (value === 'null') {
        return null;
    }
    if (value === +value + '') {
        return +value;
    }
    if (rbrace.test(value)) {
        return JSON.parse(value);
    }
    return value;
}
// 若 value 不存在，则从 `data-*` 中获取值
function dataAttr(element, key, value) {
    if (isUndefined(value) && element.nodeType === 1) {
        const name = 'data-' + toKebabCase(key);
        value = element.getAttribute(name);
        if (isString(value)) {
            try {
                value = getData(value);
            }
            catch (e) { }
        }
        else {
            value = undefined;
        }
    }
    return value;
}
$.fn.data = function (key, value) {
    // 获取所有值
    if (isUndefined(key)) {
        if (!this.length) {
            return undefined;
        }
        const element = this[0];
        const resultData = data(element);
        // window, document 上不存在 `data-*` 属性
        if (element.nodeType !== 1) {
            return resultData;
        }
        // 从 `data-*` 中获取值
        const attrs = element.attributes;
        let i = attrs.length;
        while (i--) {
            if (attrs[i]) {
                let name = attrs[i].name;
                if (name.indexOf('data-') === 0) {
                    name = toCamelCase(name.slice(5));
                    resultData[name] = dataAttr(element, name, resultData[name]);
                }
            }
        }
        return resultData;
    }
    // 同时设置多个值
    if (isObjectLike(key)) {
        return this.each(function () {
            data(this, key);
        });
    }
    // value 传入了 undefined
    if (arguments.length === 2 && isUndefined(value)) {
        return this;
    }
    // 设置值
    if (!isUndefined(value)) {
        return this.each(function () {
            data(this, key, value);
        });
    }
    // 获取值
    if (!this.length) {
        return undefined;
    }
    return dataAttr(this[0], key, data(this[0], key));
};

$.hideOverlay = function (force = false) {
    const $overlay = $('.mdui-overlay');
    if (!$overlay.length) {
        return;
    }
    let level = force ? 1 : $overlay.data('_overlay_level');
    if (level > 1) {
        $overlay.data('_overlay_level', --level);
        return;
    }
    $overlay
        .data('_overlay_level', 0)
        .removeClass('mdui-overlay-show')
        .data('_overlay_is_deleted', true)
        .transitionEnd(() => {
        if ($overlay.data('_overlay_is_deleted')) {
            $overlay.remove();
        }
    });
};

$.lockScreen = function () {
    const $body = $('body');
    // 不直接把 body 设为 box-sizing: border-box，避免污染全局样式
    const newBodyWidth = $body.width();
    let level = $body.data('_lockscreen_level') || 0;
    $body
        .addClass('mdui-locked')
        .width(newBodyWidth)
        .data('_lockscreen_level', ++level);
};

$.fn.reflow = function () {
    return this.each(function () {
        return this.clientLeft;
    });
};

$.showOverlay = function (zIndex) {
    let $overlay = $('.mdui-overlay');
    if ($overlay.length) {
        $overlay.data('_overlay_is_deleted', false);
        if (!isUndefined(zIndex)) {
            $overlay.css('z-index', zIndex);
        }
    }
    else {
        if (isUndefined(zIndex)) {
            zIndex = 2000;
        }
        $overlay = $('<div class="mdui-overlay">')
            .appendTo(document.body)
            .reflow()
            .css('z-index', zIndex);
    }
    let level = $overlay.data('_overlay_level') || 0;
    return $overlay.data('_overlay_level', ++level).addClass('mdui-overlay-show');
};

$.throttle = function (fn, delay = 16) {
    let timer = null;
    return function (...args) {
        if (isNull(timer)) {
            timer = setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, delay);
        }
    };
};

$.unlockScreen = function (force = false) {
    const $body = $('body');
    let level = force ? 1 : $body.data('_lockscreen_level');
    if (level > 1) {
        $body.data('_lockscreen_level', --level);
        return;
    }
    $body.data('_lockscreen_level', 0).removeClass('mdui-locked').width('');
};

$.fn.trigger = function (type, extraParameters) {
    const event = parse(type);
    let eventObject;
    const eventParams = {
        bubbles: true,
        cancelable: true,
    };
    const isMouseEvent = ['click', 'mousedown', 'mouseup', 'mousemove'].indexOf(event.type) > -1;
    if (isMouseEvent) {
        // Note: MouseEvent 无法传入 detail 参数
        eventObject = new MouseEvent(event.type, eventParams);
    }
    else {
        eventParams.detail = extraParameters;
        eventObject = new CustomEvent(event.type, eventParams);
    }
    // @ts-ignore
    eventObject._detail = extraParameters;
    // @ts-ignore
    eventObject._ns = event.ns;
    return this.each(function () {
        this.dispatchEvent(eventObject);
    });
};

/**
 * 触发组件上的事件
 * @param eventName 事件名
 * @param componentName 组件名
 * @param target 在该元素上触发事件
 * @param instance 组件实例
 * @param parameters 事件参数
 */
function componentEvent(eventName, componentName, target, instance, parameters) {
    if (!parameters) {
        parameters = {};
    }
    // @ts-ignore
    parameters.inst = instance;
    const fullEventName = `${eventName}.mdui.${componentName}`;
    // jQuery 事件
    // @ts-ignore
    if (typeof jQuery !== 'undefined') {
        // @ts-ignore
        jQuery(target).trigger(fullEventName, parameters);
    }
    const $target = $(target);
    // mdui.jq 事件
    $target.trigger(fullEventName, parameters);
    const eventParams = {
        bubbles: true,
        cancelable: true,
        detail: parameters,
    };
    const eventObject = new CustomEvent(fullEventName, eventParams);
    // @ts-ignore
    eventObject._detail = parameters;
    $target[0].dispatchEvent(eventObject);
}

const container = {};
function queue(name, func) {
    if (isUndefined(container[name])) {
        container[name] = [];
    }
    if (isUndefined(func)) {
        return container[name];
    }
    container[name].push(func);
}
/**
 * 从队列中移除第一个函数，并执行该函数
 * @param name 队列满
 */
function dequeue(name) {
    if (isUndefined(container[name])) {
        return;
    }
    if (!container[name].length) {
        return;
    }
    const func = container[name].shift();
    func();
}

const DEFAULT_OPTIONS = {
    history: true,
    overlay: true,
    modal: false,
    closeOnEsc: true,
    closeOnCancel: true,
    closeOnConfirm: true,
    destroyOnClosed: false,
};
/**
 * 当前显示的对话框实例
 */
let currentInst = null;
/**
 * 队列名
 */
const queueName = '_mdui_dialog';
/**
 * 窗口是否已锁定
 */
let isLockScreen = false;
/**
 * 遮罩层元素
 */
let $overlay;
class Dialog {
    constructor(selector, options = {}) {
        /**
         * 配置参数
         */
        this.options = extend({}, DEFAULT_OPTIONS);
        /**
         * 当前 dialog 的状态
         */
        this.state = 'closed';
        /**
         * dialog 元素是否是动态添加的
         */
        this.append = false;
        this.$element = $(selector).first();
        // 如果对话框元素没有在当前文档中，则需要添加
        if (!contains(document.body, this.$element[0])) {
            this.append = true;
            $('body').append(this.$element);
        }
        extend(this.options, options);
        // 绑定取消按钮事件
        this.$element.find('[mdui-dialog-cancel]').each((_, cancel) => {
            $(cancel).on('click', () => {
                this.triggerEvent('cancel');
                if (this.options.closeOnCancel) {
                    this.close();
                }
            });
        });
        // 绑定确认按钮事件
        this.$element.find('[mdui-dialog-confirm]').each((_, confirm) => {
            $(confirm).on('click', () => {
                this.triggerEvent('confirm');
                if (this.options.closeOnConfirm) {
                    this.close();
                }
            });
        });
        // 绑定关闭按钮事件
        this.$element.find('[mdui-dialog-close]').each((_, close) => {
            $(close).on('click', () => this.close());
        });
    }
    /**
     * 触发组件事件
     * @param name
     */
    triggerEvent(name) {
        componentEvent(name, 'dialog', this.$element, this);
    }
    /**
     * 窗口宽度变化，或对话框内容变化时，调整对话框位置和对话框内的滚动条
     */
    readjust() {
        if (!currentInst) {
            return;
        }
        const $element = currentInst.$element;
        const $title = $element.children('.mdui-dialog-title');
        const $content = $element.children('.mdui-dialog-content');
        const $actions = $element.children('.mdui-dialog-actions');
        // 调整 dialog 的 top 和 height 值
        $element.height('');
        $content.height('');
        const elementHeight = $element.height();
        $element.css({
            top: `${($window.height() - elementHeight) / 2}px`,
            height: `${elementHeight}px`,
        });
        // 调整 mdui-dialog-content 的高度
        $content.innerHeight(elementHeight -
            ($title.innerHeight() || 0) -
            ($actions.innerHeight() || 0));
    }
    /**
     * hashchange 事件触发时关闭对话框
     */
    hashchangeEvent() {
        if (window.location.hash.substring(1).indexOf('mdui-dialog') < 0) {
            currentInst.close(true);
        }
    }
    /**
     * 点击遮罩层关闭对话框
     * @param event
     */
    overlayClick(event) {
        if ($(event.target).hasClass('mdui-overlay') &&
            currentInst) {
            currentInst.close();
        }
    }
    /**
     * 动画结束回调
     */
    transitionEnd() {
        if (this.$element.hasClass('mdui-dialog-open')) {
            this.state = 'opened';
            this.triggerEvent('opened');
        }
        else {
            this.state = 'closed';
            this.triggerEvent('closed');
            this.$element.hide();
            // 所有对话框都关闭，且当前没有打开的对话框时，解锁屏幕
            if (!queue(queueName).length && !currentInst && isLockScreen) {
                $.unlockScreen();
                isLockScreen = false;
            }
            $window.off('resize', $.throttle(this.readjust, 100));
            if (this.options.destroyOnClosed) {
                this.destroy();
            }
        }
    }
    /**
     * 打开指定对话框
     */
    doOpen() {
        currentInst = this;
        if (!isLockScreen) {
            $.lockScreen();
            isLockScreen = true;
        }
        this.$element.show();
        this.readjust();
        $window.on('resize', $.throttle(this.readjust, 100));
        // 打开消息框
        this.state = 'opening';
        this.triggerEvent('open');
        this.$element
            .addClass('mdui-dialog-open')
            .transitionEnd(() => this.transitionEnd());
        // 不存在遮罩层元素时，添加遮罩层
        if (!$overlay) {
            $overlay = $.showOverlay(5100);
        }
        // 点击遮罩层时是否关闭对话框
        if (this.options.modal) {
            $overlay.off('click', this.overlayClick);
        }
        else {
            $overlay.on('click', this.overlayClick);
        }
        // 是否显示遮罩层，不显示时，把遮罩层背景透明
        $overlay.css('opacity', this.options.overlay ? '' : 0);
        if (this.options.history) {
            // 如果 hash 中原来就有 mdui-dialog，先删除，避免后退历史纪录后仍然有 mdui-dialog 导致无法关闭
            // 包括 mdui-dialog 和 &mdui-dialog 和 ?mdui-dialog
            let hash = window.location.hash.substring(1);
            if (hash.indexOf('mdui-dialog') > -1) {
                hash = hash.replace(/[&?]?mdui-dialog/g, '');
            }
            // 后退按钮关闭对话框
            if (hash) {
                window.location.hash = `${hash}${hash.indexOf('?') > -1 ? '&' : '?'}mdui-dialog`;
            }
            else {
                window.location.hash = 'mdui-dialog';
            }
            $window.on('hashchange', this.hashchangeEvent);
        }
    }
    /**
     * 当前对话框是否为打开状态
     */
    isOpen() {
        return this.state === 'opening' || this.state === 'opened';
    }
    /**
     * 打开对话框
     */
    open() {
        if (this.isOpen()) {
            return;
        }
        // 如果当前有正在打开或已经打开的对话框,或队列不为空，则先加入队列，等旧对话框开始关闭时再打开
        if ((currentInst &&
            (currentInst.state === 'opening' || currentInst.state === 'opened')) ||
            queue(queueName).length) {
            queue(queueName, () => this.doOpen());
            return;
        }
        this.doOpen();
    }
    /**
     * 关闭对话框
     */
    close(historyBack = false) {
        // historyBack 是否需要后退历史纪录，默认为 `false`。该参数仅内部使用
        // 为 `false` 时是通过 js 关闭，需要后退一个历史记录
        // 为 `true` 时是通过后退按钮关闭，不需要后退历史记录
        // setTimeout 的作用是：
        // 当同时关闭一个对话框，并打开另一个对话框时，使打开对话框的操作先执行，以使需要打开的对话框先加入队列
        setTimeout(() => {
            if (!this.isOpen()) {
                return;
            }
            currentInst = null;
            this.state = 'closing';
            this.triggerEvent('close');
            // 所有对话框都关闭，且当前没有打开的对话框时，隐藏遮罩
            if (!queue(queueName).length && $overlay) {
                $.hideOverlay();
                $overlay = null;
                // 若仍存在遮罩，恢复遮罩的 z-index
                $('.mdui-overlay').css('z-index', 2000);
            }
            this.$element
                .removeClass('mdui-dialog-open')
                .transitionEnd(() => this.transitionEnd());
            if (this.options.history && !queue(queueName).length) {
                if (!historyBack) {
                    window.history.back();
                }
                $window.off('hashchange', this.hashchangeEvent);
            }
            // 关闭旧对话框，打开新对话框。
            // 加一点延迟，仅仅为了视觉效果更好。不加延时也不影响功能
            setTimeout(() => {
                dequeue(queueName);
            }, 100);
        });
    }
    /**
     * 切换对话框打开/关闭状态
     */
    toggle() {
        this.isOpen() ? this.close() : this.open();
    }
    /**
     * 获取对话框状态。共包含四种状态：`opening`、`opened`、`closing`、`closed`
     */
    getState() {
        return this.state;
    }
    /**
     * 销毁对话框
     */
    destroy() {
        if (this.append) {
            this.$element.remove();
        }
        if (!queue(queueName).length && !currentInst) {
            if ($overlay) {
                $.hideOverlay();
                $overlay = null;
            }
            if (isLockScreen) {
                $.unlockScreen();
                isLockScreen = false;
            }
        }
    }
    /**
     * 对话框内容变化时，需要调用该方法来调整对话框位置和滚动条高度
     */
    handleUpdate() {
        this.readjust();
    }
}

// esc 按下时关闭对话框
$document.on('keydown', (event) => {
    if (currentInst &&
        currentInst.options.closeOnEsc &&
        currentInst.state === 'opened' &&
        event.keyCode === 27) {
        currentInst.close();
    }
});
mdui.Dialog = Dialog;

const DEFAULT_BUTTON = {
    text: '',
    bold: false,
    close: true,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClick: () => { },
};
const DEFAULT_OPTIONS$1 = {
    title: '',
    content: '',
    buttons: [],
    stackedButtons: false,
    cssClass: '',
    history: true,
    overlay: true,
    modal: false,
    closeOnEsc: true,
    destroyOnClosed: true,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onOpen: () => { },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onOpened: () => { },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClose: () => { },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClosed: () => { },
};
mdui.dialog = function (options) {
    var _a, _b;
    // 合并配置参数
    options = extend({}, DEFAULT_OPTIONS$1, options);
    each(options.buttons, (i, button) => {
        options.buttons[i] = extend({}, DEFAULT_BUTTON, button);
    });
    // 按钮的 HTML
    let buttonsHTML = '';
    if ((_a = options.buttons) === null || _a === void 0 ? void 0 : _a.length) {
        buttonsHTML = `<div class="mdui-dialog-actions${options.stackedButtons ? ' mdui-dialog-actions-stacked' : ''}">`;
        each(options.buttons, (_, button) => {
            buttonsHTML +=
                '<a href="javascript:void(0)" ' +
                    `class="mdui-btn mdui-ripple mdui-text-color-primary ${button.bold ? 'mdui-btn-bold' : ''}">${button.text}</a>`;
        });
        buttonsHTML += '</div>';
    }
    // Dialog 的 HTML
    const HTML = `<div class="mdui-dialog ${options.cssClass}">` +
        (options.title
            ? `<div class="mdui-dialog-title">${options.title}</div>`
            : '') +
        (options.content
            ? `<div class="mdui-dialog-content">${options.content}</div>`
            : '') +
        buttonsHTML +
        '</div>';
    // 实例化 Dialog
    const instance = new mdui.Dialog(HTML, {
        history: options.history,
        overlay: options.overlay,
        modal: options.modal,
        closeOnEsc: options.closeOnEsc,
        destroyOnClosed: options.destroyOnClosed,
    });
    // 绑定按钮事件
    if ((_b = options.buttons) === null || _b === void 0 ? void 0 : _b.length) {
        instance.$element
            .find('.mdui-dialog-actions .mdui-btn')
            .each((index, button) => {
            $(button).on('click', () => {
                options.buttons[index].onClick(instance);
                if (options.buttons[index].close) {
                    instance.close();
                }
            });
        });
    }
    // 绑定打开关闭事件
    instance.$element
        .on('open.mdui.dialog', () => {
        options.onOpen(instance);
    })
        .on('opened.mdui.dialog', () => {
        options.onOpened(instance);
    })
        .on('close.mdui.dialog', () => {
        options.onClose(instance);
    })
        .on('closed.mdui.dialog', () => {
        options.onClosed(instance);
    });
    instance.open();
    return instance;
};

const DEFAULT_OPTIONS$2 = {
    confirmText: 'ok',
    cancelText: 'cancel',
    history: true,
    modal: false,
    closeOnEsc: true,
    closeOnCancel: true,
    closeOnConfirm: true,
};
mdui.confirm = function (text, title, onConfirm, onCancel, options) {
    if (isFunction(title)) {
        options = onCancel;
        onCancel = onConfirm;
        onConfirm = title;
        title = '';
    }
    if (isUndefined(onConfirm)) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onConfirm = () => { };
    }
    if (isUndefined(onCancel)) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onCancel = () => { };
    }
    if (isUndefined(options)) {
        options = {};
    }
    options = extend({}, DEFAULT_OPTIONS$2, options);
    return mdui.dialog({
        title: title,
        content: text,
        buttons: [
            {
                text: options.cancelText,
                bold: false,
                close: options.closeOnCancel,
                onClick: onCancel,
            },
            {
                text: options.confirmText,
                bold: false,
                close: options.closeOnConfirm,
                onClick: onConfirm,
            },
        ],
        cssClass: 'mdui-dialog-confirm',
        history: options.history,
        modal: options.modal,
        closeOnEsc: options.closeOnEsc,
    });
};

/**
 * 舍弃草稿
 */
class ClearDrafts extends MenuAbstract {
    onclick() {
        mdui.confirm('确定要清空内容？', () => {
            const options = this.editor.options;
            this.editor.setHTML('');
            if (options.autoSave) {
                window.localStorage.removeItem(options.autoSaveKey);
                options.onClearDrafts();
            }
        }, returnFalse, {
            confirmText: '确定',
            cancelText: '取消',
        });
    }
}
ClearDrafts.icon = 'delete';
ClearDrafts.title = '舍弃草稿';

$.fn.add = function (selector) {
    return new JQ(unique(merge(this.get(), $(selector).get())));
};

/**
 * 替换 html 特殊字符
 * @param html
 */
function replaceHtmlSymbol(html = '') {
    return html
        .replace(/</gm, '&lt;')
        .replace(/>/gm, '&gt;')
        .replace(/"/gm, '&quot;');
}

/**
 * 代码块
 */
class Code extends MenuAbstract {
    constructor(editor, $button) {
        super(editor, $button);
        this.active = false;
        this.init();
    }
    init() {
        this.$container.on('keydown', (event) => {
            if (event.keyCode === 13) {
                // 按回车时，添加 \n
                if (this.active) {
                    event.preventDefault();
                    const startOffset = this.selection.getRange().startOffset;
                    this.command.do('insertHTML', '\n');
                    this.selection.saveRange();
                    if (this.selection.getRange().startOffset === startOffset) {
                        // 没起作用，再来一次
                        this.command.do('insertHTML', '\n');
                    }
                    // 换行后滚动条回到最左侧
                    this.selection.getContainerElem()[0].scrollLeft = 0;
                }
            }
            if (event.keyCode === 9) {
                // 按 tab 时，添加四个空格
                if (this.active) {
                    event.preventDefault();
                    this.command.do('insertHTML', '    ');
                }
            }
        });
    }
    onclick() {
        const $rootElem = this.selection.getRootElem();
        if (this.active) {
            // 若当前是代码块，则每一行都转换为 p 标签
            const textArray = $rootElem.text().split('\n');
            let html = '';
            textArray.forEach((line) => {
                line = replaceHtmlSymbol(line);
                html = line ? `<p>${line}</p>${html}` : `<p><br></p>${html}`;
            });
            this.command.do('replaceRoot', html);
            return;
        }
        if (!$rootElem.length) {
            const range = this.selection.getRange();
            if (range.collapsed) {
                // 没有选中任何选区，在最后添加一行
                this.command.do('appendHTML', '<pre><code><br></code></pre>');
            }
            else {
                // 选中了多行，把多行包裹在同一个 pre 中
                let text = '';
                let isInRange = false;
                let $linesRemove = $();
                this.$container.children().each((_, line) => {
                    const $line = $(line);
                    if (!isInRange) {
                        if ($line.is(range.startContainer) ||
                            $line[0].contains(range.startContainer) ||
                            this.$container.is(range.startContainer)) {
                            isInRange = true;
                        }
                    }
                    if (isInRange) {
                        text += `${replaceHtmlSymbol($line.text())}\n`;
                        $linesRemove = $linesRemove.add($line);
                        if ($line.is(range.endContainer) ||
                            $line[0].contains(range.endContainer)) {
                            return false;
                        }
                    }
                    return true;
                });
                $linesRemove.each((i, line) => {
                    const $line = $(line);
                    if (i < $linesRemove.length - 1) {
                        $line.remove();
                    }
                });
                this.selection.createRangeByElem($linesRemove.last(), false, true);
                this.command.do('replaceRoot', `<pre><code>${text}</code></pre>`);
            }
            return;
        }
        // 选中单行，需要移除选区内容所有子元素的标签，然后转换为 pre
        const text = replaceHtmlSymbol($rootElem.text());
        this.command.do('replaceRoot', text ? `<pre><code>${text}</code></pre>` : '<pre><code><br></code></pre>');
    }
    isActive() {
        this.active = this.selection.getRootElem().is('pre');
        return this.active;
    }
}
Code.icon = 'code';
Code.title = '代码块';
Code.disable = ['bold', 'italic', 'head', 'ol', 'ul', 'link', 'image'];

/**
 * 标题
 */
class Head extends MenuAbstract {
    constructor() {
        super(...arguments);
        this.active = false;
    }
    onclick() {
        const $rootElem = this.selection.getRootElem();
        if (this.active) {
            // 若当前是 h2，则转换为 p
            const text = $rootElem.text();
            this.command.do('replaceRoot', text ? `<p>${text}</p>` : '<p><br></p>');
            return;
        }
        if (!$rootElem.length) {
            const range = this.selection.getRange();
            if (range.collapsed) {
                // 没有选中任何选区，在最后添加一行
                this.command.do('appendHTML', '<h2><br></h2>');
            }
            return;
        }
        // 选中单行，需要移除选区内所有子元素的标签，然后转换为 h2
        this.command.do('replaceRoot', `<h2>${replaceHtmlSymbol($rootElem.text())}</h2>`);
    }
    isActive() {
        this.active = this.selection.getRootElem().is('h2');
        return this.active;
    }
}
Head.icon = 'title';
Head.title = '标题';
Head.disable = ['bold', 'italic', 'image'];

/**
 * 将数组或对象序列化，序列化后的字符串可作为 URL 查询字符串使用
 *
 * 若传入数组，则格式必须和 serializeArray 方法的返回值一样
 * @param obj 对象或数组
 * @example
```js
param({ width: 1680, height: 1050 });
// width=1680&height=1050
```
 * @example
```js
param({ foo: { one: 1, two: 2 }})
// foo[one]=1&foo[two]=2
```
 * @example
```js
param({ids: [1, 2, 3]})
// ids[]=1&ids[]=2&ids[]=3
```
 * @example
```js
param([
  {"name":"name","value":"mdui"},
  {"name":"password","value":"123456"}
])
// name=mdui&password=123456
```
 */
function param(obj) {
    if (!isObjectLike(obj) && !Array.isArray(obj)) {
        return '';
    }
    const args = [];
    function destructure(key, value) {
        let keyTmp;
        if (isObjectLike(value)) {
            each(value, (i, v) => {
                if (Array.isArray(value) && !isObjectLike(v)) {
                    keyTmp = '';
                }
                else {
                    keyTmp = i;
                }
                destructure(`${key}[${keyTmp}]`, v);
            });
        }
        else {
            if (value == null || value === '') {
                keyTmp = '=';
            }
            else {
                keyTmp = `=${encodeURIComponent(value)}`;
            }
            args.push(encodeURIComponent(key) + keyTmp);
        }
    }
    if (Array.isArray(obj)) {
        each(obj, function () {
            destructure(this.name, this.value);
        });
    }
    else {
        each(obj, destructure);
    }
    return args.join('&');
}

// 全局配置参数
const globalOptions = {};
// 全局事件名
const ajaxEvents = {
    ajaxStart: 'start.mdui.ajax',
    ajaxSuccess: 'success.mdui.ajax',
    ajaxError: 'error.mdui.ajax',
    ajaxComplete: 'complete.mdui.ajax',
};

/**
 * 判断此请求方法是否通过查询字符串提交参数
 * @param method 请求方法，大写
 */
function isQueryStringData(method) {
    return ['GET', 'HEAD'].indexOf(method) >= 0;
}
/**
 * 添加参数到 URL 上，且 URL 中不存在 ? 时，自动把第一个 & 替换为 ?
 * @param url
 * @param query
 */
function appendQuery(url, query) {
    return `${url}&${query}`.replace(/[&?]{1,2}/, '?');
}
/**
 * 合并请求参数，参数优先级：options > globalOptions > defaults
 * @param options
 */
function mergeOptions(options) {
    // 默认参数
    const defaults = {
        url: '',
        method: 'GET',
        data: '',
        processData: true,
        async: true,
        cache: true,
        username: '',
        password: '',
        headers: {},
        xhrFields: {},
        statusCode: {},
        dataType: 'text',
        contentType: 'application/x-www-form-urlencoded',
        timeout: 0,
        global: true,
    };
    // globalOptions 中的回调函数不合并
    each(globalOptions, (key, value) => {
        const callbacks = [
            'beforeSend',
            'success',
            'error',
            'complete',
            'statusCode',
        ];
        // @ts-ignore
        if (callbacks.indexOf(key) < 0 && !isUndefined(value)) {
            defaults[key] = value;
        }
    });
    return extend({}, defaults, options);
}
/**
 * 发送 ajax 请求
 * @param options
 * @example
```js
ajax({
  method: "POST",
  url: "some.php",
  data: { name: "John", location: "Boston" }
}).then(function( msg ) {
  alert( "Data Saved: " + msg );
});
```
 */
function ajax(options) {
    // 是否已取消请求
    let isCanceled = false;
    // 事件参数
    const eventParams = {};
    // 参数合并
    const mergedOptions = mergeOptions(options);
    let url = mergedOptions.url || window.location.toString();
    const method = mergedOptions.method.toUpperCase();
    let data = mergedOptions.data;
    const processData = mergedOptions.processData;
    const async = mergedOptions.async;
    const cache = mergedOptions.cache;
    const username = mergedOptions.username;
    const password = mergedOptions.password;
    const headers = mergedOptions.headers;
    const xhrFields = mergedOptions.xhrFields;
    const statusCode = mergedOptions.statusCode;
    const dataType = mergedOptions.dataType;
    const contentType = mergedOptions.contentType;
    const timeout = mergedOptions.timeout;
    const global = mergedOptions.global;
    // 需要发送的数据
    // GET/HEAD 请求和 processData 为 true 时，转换为查询字符串格式，特殊格式不转换
    if (data &&
        (isQueryStringData(method) || processData) &&
        !isString(data) &&
        !(data instanceof ArrayBuffer) &&
        !(data instanceof Blob) &&
        !(data instanceof Document) &&
        !(data instanceof FormData)) {
        data = param(data);
    }
    // 对于 GET、HEAD 类型的请求，把 data 数据添加到 URL 中
    if (data && isQueryStringData(method)) {
        // 查询字符串拼接到 URL 中
        url = appendQuery(url, data);
        data = null;
    }
    /**
     * 触发事件和回调函数
     * @param event
     * @param params
     * @param callback
     * @param args
     */
    function trigger(event, params, callback, ...args) {
        // 触发全局事件
        if (global) {
            $(document).trigger(event, params);
        }
        // 触发 ajax 回调和事件
        let result1;
        let result2;
        if (callback) {
            // 全局回调
            if (callback in globalOptions) {
                // @ts-ignore
                result1 = globalOptions[callback](...args);
            }
            // 自定义回调
            if (mergedOptions[callback]) {
                // @ts-ignore
                result2 = mergedOptions[callback](...args);
            }
            // beforeSend 回调返回 false 时取消 ajax 请求
            if (callback === 'beforeSend' &&
                (result1 === false || result2 === false)) {
                isCanceled = true;
            }
        }
    }
    // XMLHttpRequest 请求
    function XHR() {
        let textStatus;
        return new Promise((resolve, reject) => {
            // GET/HEAD 请求的缓存处理
            if (isQueryStringData(method) && !cache) {
                url = appendQuery(url, `_=${Date.now()}`);
            }
            // 创建 XHR
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, async, username, password);
            if (contentType ||
                (data && !isQueryStringData(method) && contentType !== false)) {
                xhr.setRequestHeader('Content-Type', contentType);
            }
            // 设置 Accept
            if (dataType === 'json') {
                xhr.setRequestHeader('Accept', 'application/json, text/javascript');
            }
            // 添加 headers
            if (headers) {
                each(headers, (key, value) => {
                    // undefined 值不发送，string 和 null 需要发送
                    if (!isUndefined(value)) {
                        xhr.setRequestHeader(key, value + ''); // 把 null 转换成字符串
                    }
                });
            }
            // 检查是否是跨域请求，跨域请求时不添加 X-Requested-With
            const crossDomain = /^([\w-]+:)?\/\/([^/]+)/.test(url) &&
                RegExp.$2 !== window.location.host;
            if (!crossDomain) {
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            }
            if (xhrFields) {
                each(xhrFields, (key, value) => {
                    // @ts-ignore
                    xhr[key] = value;
                });
            }
            eventParams.xhr = xhr;
            eventParams.options = mergedOptions;
            let xhrTimeout;
            xhr.onload = function () {
                if (xhrTimeout) {
                    clearTimeout(xhrTimeout);
                }
                // AJAX 返回的 HTTP 响应码是否表示成功
                const isHttpStatusSuccess = (xhr.status >= 200 && xhr.status < 300) ||
                    xhr.status === 304 ||
                    xhr.status === 0;
                let responseData;
                if (isHttpStatusSuccess) {
                    if (xhr.status === 204 || method === 'HEAD') {
                        textStatus = 'nocontent';
                    }
                    else if (xhr.status === 304) {
                        textStatus = 'notmodified';
                    }
                    else {
                        textStatus = 'success';
                    }
                    if (dataType === 'json') {
                        try {
                            responseData =
                                method === 'HEAD' ? undefined : JSON.parse(xhr.responseText);
                            eventParams.data = responseData;
                        }
                        catch (err) {
                            textStatus = 'parsererror';
                            trigger(ajaxEvents.ajaxError, eventParams, 'error', xhr, textStatus);
                            reject(new Error(textStatus));
                        }
                        if (textStatus !== 'parsererror') {
                            trigger(ajaxEvents.ajaxSuccess, eventParams, 'success', responseData, textStatus, xhr);
                            resolve(responseData);
                        }
                    }
                    else {
                        responseData =
                            method === 'HEAD'
                                ? undefined
                                : xhr.responseType === 'text' || xhr.responseType === ''
                                    ? xhr.responseText
                                    : xhr.response;
                        eventParams.data = responseData;
                        trigger(ajaxEvents.ajaxSuccess, eventParams, 'success', responseData, textStatus, xhr);
                        resolve(responseData);
                    }
                }
                else {
                    textStatus = 'error';
                    trigger(ajaxEvents.ajaxError, eventParams, 'error', xhr, textStatus);
                    reject(new Error(textStatus));
                }
                // statusCode
                each([globalOptions.statusCode, statusCode], (_, func) => {
                    if (func && func[xhr.status]) {
                        if (isHttpStatusSuccess) {
                            func[xhr.status](responseData, textStatus, xhr);
                        }
                        else {
                            func[xhr.status](xhr, textStatus);
                        }
                    }
                });
                trigger(ajaxEvents.ajaxComplete, eventParams, 'complete', xhr, textStatus);
            };
            xhr.onerror = function () {
                if (xhrTimeout) {
                    clearTimeout(xhrTimeout);
                }
                trigger(ajaxEvents.ajaxError, eventParams, 'error', xhr, xhr.statusText);
                trigger(ajaxEvents.ajaxComplete, eventParams, 'complete', xhr, 'error');
                reject(new Error(xhr.statusText));
            };
            xhr.onabort = function () {
                let statusText = 'abort';
                if (xhrTimeout) {
                    statusText = 'timeout';
                    clearTimeout(xhrTimeout);
                }
                trigger(ajaxEvents.ajaxError, eventParams, 'error', xhr, statusText);
                trigger(ajaxEvents.ajaxComplete, eventParams, 'complete', xhr, statusText);
                reject(new Error(statusText));
            };
            // ajax start 回调
            trigger(ajaxEvents.ajaxStart, eventParams, 'beforeSend', xhr);
            if (isCanceled) {
                reject(new Error('cancel'));
                return;
            }
            // Timeout
            if (timeout > 0) {
                xhrTimeout = setTimeout(() => {
                    xhr.abort();
                }, timeout);
            }
            // 发送 XHR
            xhr.send(data);
        });
    }
    return XHR();
}

function dir($elements, nameIndex, node, selector, filter) {
    const ret = [];
    let target;
    $elements.each((_, element) => {
        target = element[node];
        // 不能包含最顶层的 document 元素
        while (target && isElement(target)) {
            // prevUntil, nextUntil, parentsUntil
            if (nameIndex === 2) {
                if (selector && $(target).is(selector)) {
                    break;
                }
                if (!filter || $(target).is(filter)) {
                    ret.push(target);
                }
            }
            // prev, next, parent
            else if (nameIndex === 0) {
                if (!selector || $(target).is(selector)) {
                    ret.push(target);
                }
                break;
            }
            // prevAll, nextAll, parents
            else {
                if (!selector || $(target).is(selector)) {
                    ret.push(target);
                }
            }
            // @ts-ignore
            target = target[node];
        }
    });
    return new JQ(unique(ret));
}

each(['', 'All', 'Until'], (nameIndex, name) => {
    $.fn[`next${name}`] = function (selector, filter) {
        return dir(this, nameIndex, 'nextElementSibling', selector, filter);
    };
});

const DEFAULT_OPTIONS$3 = {
    confirmText: 'ok',
    history: true,
    modal: false,
    closeOnEsc: true,
    closeOnConfirm: true,
};
mdui.alert = function (text, title, onConfirm, options) {
    if (isFunction(title)) {
        options = onConfirm;
        onConfirm = title;
        title = '';
    }
    if (isUndefined(onConfirm)) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onConfirm = () => { };
    }
    if (isUndefined(options)) {
        options = {};
    }
    options = extend({}, DEFAULT_OPTIONS$3, options);
    return mdui.dialog({
        title: title,
        content: text,
        buttons: [
            {
                text: options.confirmText,
                bold: false,
                close: options.closeOnConfirm,
                onClick: onConfirm,
            },
        ],
        cssClass: 'mdui-dialog-alert',
        history: options.history,
        modal: options.modal,
        closeOnEsc: options.closeOnEsc,
    });
};

const GUID = {};
$.guid = function (name) {
    if (!isUndefined(name) && !isUndefined(GUID[name])) {
        return GUID[name];
    }
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    const guid = '_' +
        s4() +
        s4() +
        '-' +
        s4() +
        '-' +
        s4() +
        '-' +
        s4() +
        '-' +
        s4() +
        s4() +
        s4();
    if (!isUndefined(name)) {
        GUID[name] = guid;
    }
    return guid;
};

/**
 * 格式化内存大小
 * @param memory
 */
function memoryFormat(memory) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let pos = 0;
    while (memory >= 1024) {
        memory /= 1024;
        pos++;
    }
    return memory.toFixed(2) + units[pos];
}

class Image extends MenuAbstract {
    constructor(editor, $button) {
        super(editor, $button);
        /**
         * <input type="file"/> 元素
         */
        this.$input = $();
        /**
         * <input type="file"/> 元素的 ID
         */
        this.inputID = $.guid();
        /**
         * 允许上传的图片后缀
         */
        this.suffixs = [];
        /**
         * 允许上传的图片格式
         */
        this.accepts = [];
        this.setAccepts();
        this.setInput();
        this.bindInputChange();
        this.bindKeyboardEvent();
    }
    bindKeyboardEvent() {
        this.$container.on('keydown', (event) => {
            const keyCode = event.keyCode;
            this.selection.saveRange();
            const $curElem = this.selection.getContainerElem();
            if (keyCode === 8 || keyCode === 46) {
                if ($curElem.is('figcaption')) {
                    // 在 figcaption 元素中按删除键时，若该元素内容为空，则不删除
                    const html = $curElem.html().toLowerCase().trim();
                    if (!html || html === '<br>' || html === '<br/>') {
                        $curElem.html('');
                        event.preventDefault();
                    }
                }
            }
            if ($curElem.is('figure')) {
                if (keyCode === 8 || keyCode === 46) {
                    // 删除图片时，删除 figure 元素，并聚焦到下一行
                    this.selection.createRangeByElem($curElem.next());
                    $curElem.remove();
                    this.selection.restore();
                }
                event.preventDefault();
            }
            if (keyCode === 13) {
                // 在 figcaption 中按回车键时，跳出图片元素，聚焦到下一个 root 元素
                if ($curElem.is('figcaption')) {
                    const $nextElem = this.selection.getRootElem().next();
                    if (!$nextElem.length) {
                        // 没有下一个元素，新增一行
                        this.command.do('insertAfterRoot', '<p><br></p>');
                    }
                    else {
                        // 有下一个元素，聚焦到下一行
                        this.selection.createRangeByElem($nextElem);
                        this.selection.restore();
                    }
                    event.preventDefault();
                }
            }
        });
        this.$container.on('keyup', (event) => {
            const keyCode = event.keyCode;
            const $curElem = this.selection.getContainerElem();
            if (keyCode === 8 || keyCode === 46) {
                // 在 figcaption 中删除时，若该元素不含文字，则清空该元素
                if ($curElem.is('figcaption')) {
                    const html = $curElem.html().toLowerCase().trim();
                    if (!html || html === '<br>' || html === '<br/>') {
                        $curElem.html('');
                    }
                }
            }
        });
    }
    /**
     * 设置允许上传的图片类型
     */
    setAccepts() {
        this.suffixs = this.editor.options.imageUploadSuffix;
        const map = {
            png: 'image/png',
            jpg: 'image/jpeg',
            gif: 'image/gif',
        };
        this.accepts = this.suffixs.map((suffix) => map[suffix]);
    }
    /**
     * 在按钮后面插入 <input type="file"/> 元素
     */
    setInput() {
        this.$input = $(`<input type="file" id="${this.inputID}" name="${this.editor.options.imageUploadName}" accept="${this.accepts.join(', ')}"/>`).insertAfter(this.$button);
    }
    /**
     * 选择文件后触发的事件
     */
    bindInputChange() {
        this.$input.on('change', (event) => {
            // @ts-ignore
            const files = event.target.files;
            if (!files.length) {
                return;
            }
            this.upload(files[0]);
            this.$input.val('');
        });
    }
    /**
     * 执行上传
     * @param file
     */
    upload(file) {
        if (this.accepts.indexOf(file.type) < 0) {
            mdui.alert(`仅允许上传 ${this.suffixs.join(', ')} 格式的图片`);
            return;
        }
        if (this.editor.options.imageUploadMaxSize &&
            file.size > this.editor.options.imageUploadMaxSize) {
            mdui.alert(`图片体积不能超过 ${memoryFormat(this.editor.options.imageUploadMaxSize)}`);
            return;
        }
        const formData = new FormData();
        formData.append(this.editor.options.imageUploadName, file);
        let loadingDialog;
        let uploadTime;
        let uploadTimeInterval;
        ajax({
            url: this.editor.options.imageUploadUrl,
            method: 'POST',
            data: formData,
            processData: false,
            dataType: 'json',
            contentType: false,
            global: false,
            beforeSend: (xhr) => {
                uploadTime = 0;
                uploadTimeInterval = setInterval(() => (uploadTime += 100), 100);
                loadingDialog = mdui.dialog({
                    title: '上传中…',
                    content: '<p class="mdui_editor-upload-progress">0%</p>',
                    history: false,
                    modal: true,
                    cssClass: 'mdui_editor-upload-progress-dialog',
                });
                const $progress = loadingDialog.$element.find('.mdui_editor-upload-progress');
                xhr.upload.onprogress = (event) => {
                    // @ts-ignore
                    $progress.html(`${((event.loaded / event.total) * 100).toFixed(0)}%`);
                };
            },
            complete: () => {
                clearInterval(uploadTimeInterval);
                if (uploadTime < 500) {
                    setTimeout(() => {
                        loadingDialog.close();
                    }, 500 - uploadTime);
                }
                else {
                    loadingDialog.close();
                }
            },
        })
            .then((response) => {
            if (this.editor.options.imageUploadResponseTransform) {
                response = this.editor.options.imageUploadResponseTransform(response);
            }
            if (response.code) {
                mdui.alert(response.message);
                return;
            }
            const $rootElem = this.selection.getRootElem();
            const rootHTML = $rootElem.html().toLowerCase().trim();
            const imgHTML = `<figure><img src="${response.data.url}"/><figcaption placeholder="图片描述（选填）"></figcaption></figure>`;
            if ($rootElem[0].nodeName === 'P' &&
                (rootHTML === '<br>' || rootHTML === '<br/>')) {
                // 当前为空的 p 元素，替换该元素
                this.command.do('replaceRoot', imgHTML);
            }
            else {
                // 当前不是空的 p 元素，在当前元素后面插入图片
                this.command.do('insertAfterRoot', imgHTML);
            }
            // 在图片下面重新插入一行，并聚焦
            this.command.do('insertAfterRoot', '<p><br></p>');
        })
            .catch(() => mdui.alert('图片上传失败'));
    }
    onclick() {
        $(`#${this.inputID}`).trigger('click');
    }
}
Image.icon = 'image';
Image.title = '插入图片';

/**
 * 斜体
 */
class Italic extends MenuNativeAbstract {
    getCommandName() {
        return 'italic';
    }
    getElementName() {
        return 'em';
    }
}
Italic.icon = 'format_italic';
Italic.title = '斜体';
Italic.disable = ['image'];

each(['', 's', 'sUntil'], (nameIndex, name) => {
    $.fn[`parent${name}`] = function (selector, filter) {
        // parents、parentsUntil 需要把元素的顺序反向处理，以便和 jQuery 的结果一致
        const $nodes = !nameIndex ? this : $(this.get().reverse());
        return dir($nodes, nameIndex, 'parentNode', selector, filter);
    };
});

/**
 * CSS 选择器和初始化函数组成的对象
 */
const entries = {};
/**
 * 注册并执行初始化函数
 * @param selector CSS 选择器
 * @param apiInit 初始化函数
 * @param i 元素索引
 * @param element 元素
 */
function mutation(selector, apiInit, i, element) {
    let selectors = data(element, '_mdui_mutation');
    if (!selectors) {
        selectors = [];
        data(element, '_mdui_mutation', selectors);
    }
    if (selectors.indexOf(selector) === -1) {
        selectors.push(selector);
        apiInit.call(element, i, element);
    }
}

$.fn.mutation = function () {
    return this.each((i, element) => {
        const $this = $(element);
        each(entries, (selector, apiInit) => {
            if ($this.is(selector)) {
                mutation(selector, apiInit, i, element);
            }
            $this.find(selector).each((i, element) => {
                mutation(selector, apiInit, i, element);
            });
        });
    });
};

mdui.mutation = function (selector, apiInit) {
    if (isUndefined(selector) || isUndefined(apiInit)) {
        $(document).mutation();
        return;
    }
    entries[selector] = apiInit;
    $(selector).each((i, element) => mutation(selector, apiInit, i, element));
};

const defaultData = {
    reInit: false,
    domLoadedEvent: false,
};
/**
 * 输入框事件
 * @param event
 * @param data
 */
function inputEvent(event, data = {}) {
    data = extend({}, defaultData, data);
    const input = event.target;
    const $input = $(input);
    const eventType = event.type;
    const value = $input.val();
    // 文本框类型
    const inputType = $input.attr('type') || '';
    if (['checkbox', 'button', 'submit', 'range', 'radio', 'image'].indexOf(inputType) > -1) {
        return;
    }
    const $textfield = $input.parent('.mdui-textfield');
    // 输入框是否聚焦
    if (eventType === 'focus') {
        $textfield.addClass('mdui-textfield-focus');
    }
    if (eventType === 'blur') {
        $textfield.removeClass('mdui-textfield-focus');
    }
    // 输入框是否为空
    if (eventType === 'blur' || eventType === 'input') {
        value
            ? $textfield.addClass('mdui-textfield-not-empty')
            : $textfield.removeClass('mdui-textfield-not-empty');
    }
    // 输入框是否禁用
    input.disabled
        ? $textfield.addClass('mdui-textfield-disabled')
        : $textfield.removeClass('mdui-textfield-disabled');
    // 表单验证
    if ((eventType === 'input' || eventType === 'blur') &&
        !data.domLoadedEvent &&
        input.validity) {
        input.validity.valid
            ? $textfield.removeClass('mdui-textfield-invalid-html5')
            : $textfield.addClass('mdui-textfield-invalid-html5');
    }
    // textarea 高度自动调整
    if ($input.is('textarea')) {
        // IE bug：textarea 的值仅为多个换行，不含其他内容时，textarea 的高度不准确
        //         此时，在计算高度前，在值的开头加入一个空格，计算完后，移除空格
        const inputValue = value;
        let hasExtraSpace = false;
        if (inputValue.replace(/[\r\n]/g, '') === '') {
            $input.val(' ' + inputValue);
            hasExtraSpace = true;
        }
        // 设置 textarea 高度
        $input.outerHeight('');
        const height = $input.outerHeight();
        const scrollHeight = input.scrollHeight;
        if (scrollHeight > height) {
            $input.outerHeight(scrollHeight);
        }
        // 计算完，还原 textarea 的值
        if (hasExtraSpace) {
            $input.val(inputValue);
        }
    }
    // 实时字数统计
    if (data.reInit) {
        $textfield.find('.mdui-textfield-counter').remove();
    }
    const maxLength = $input.attr('maxlength');
    if (maxLength) {
        if (data.reInit || data.domLoadedEvent) {
            $('<div class="mdui-textfield-counter">' +
                `<span class="mdui-textfield-counter-inputed"></span> / ${maxLength}` +
                '</div>').appendTo($textfield);
        }
        $textfield
            .find('.mdui-textfield-counter-inputed')
            .text(value.length.toString());
    }
    // 含 帮助文本、错误提示、字数统计 时，增加文本框底部内边距
    if ($textfield.find('.mdui-textfield-helper').length ||
        $textfield.find('.mdui-textfield-error').length ||
        maxLength) {
        $textfield.addClass('mdui-textfield-has-bottom');
    }
}
$(() => {
    // 绑定事件
    $document.on('input focus blur', '.mdui-textfield-input', { useCapture: true }, inputEvent);
    // 可展开文本框展开
    $document.on('click', '.mdui-textfield-expandable .mdui-textfield-icon', function () {
        $(this)
            .parents('.mdui-textfield')
            .addClass('mdui-textfield-expanded')
            .find('.mdui-textfield-input')[0]
            .focus();
    });
    // 可展开文本框关闭
    $document.on('click', '.mdui-textfield-expanded .mdui-textfield-close', function () {
        $(this)
            .parents('.mdui-textfield')
            .removeClass('mdui-textfield-expanded')
            .find('.mdui-textfield-input')
            .val('');
    });
    /**
     * 初始化文本框
     */
    mdui.mutation('.mdui-textfield', function () {
        $(this).find('.mdui-textfield-input').trigger('input', {
            domLoadedEvent: true,
        });
    });
});
mdui.updateTextFields = function (selector) {
    const $elements = isUndefined(selector) ? $('.mdui-textfield') : $(selector);
    $elements.each((_, element) => {
        $(element).find('.mdui-textfield-input').trigger('input', {
            reInit: true,
        });
    });
};

const DEFAULT_OPTIONS$4 = {
    confirmText: 'ok',
    cancelText: 'cancel',
    history: true,
    modal: false,
    closeOnEsc: true,
    closeOnCancel: true,
    closeOnConfirm: true,
    type: 'text',
    maxlength: 0,
    defaultValue: '',
    confirmOnEnter: false,
};
mdui.prompt = function (label, title, onConfirm, onCancel, options) {
    if (isFunction(title)) {
        options = onCancel;
        onCancel = onConfirm;
        onConfirm = title;
        title = '';
    }
    if (isUndefined(onConfirm)) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onConfirm = () => { };
    }
    if (isUndefined(onCancel)) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onCancel = () => { };
    }
    if (isUndefined(options)) {
        options = {};
    }
    options = extend({}, DEFAULT_OPTIONS$4, options);
    const content = '<div class="mdui-textfield">' +
        (label ? `<label class="mdui-textfield-label">${label}</label>` : '') +
        (options.type === 'text'
            ? `<input class="mdui-textfield-input" type="text" value="${options.defaultValue}" ${options.maxlength ? 'maxlength="' + options.maxlength + '"' : ''}/>`
            : '') +
        (options.type === 'textarea'
            ? `<textarea class="mdui-textfield-input" ${options.maxlength ? 'maxlength="' + options.maxlength + '"' : ''}>${options.defaultValue}</textarea>`
            : '') +
        '</div>';
    const onCancelClick = (dialog) => {
        const value = dialog.$element.find('.mdui-textfield-input').val();
        onCancel(value, dialog);
    };
    const onConfirmClick = (dialog) => {
        const value = dialog.$element.find('.mdui-textfield-input').val();
        onConfirm(value, dialog);
    };
    return mdui.dialog({
        title,
        content,
        buttons: [
            {
                text: options.cancelText,
                bold: false,
                close: options.closeOnCancel,
                onClick: onCancelClick,
            },
            {
                text: options.confirmText,
                bold: false,
                close: options.closeOnConfirm,
                onClick: onConfirmClick,
            },
        ],
        cssClass: 'mdui-dialog-prompt',
        history: options.history,
        modal: options.modal,
        closeOnEsc: options.closeOnEsc,
        onOpen: (dialog) => {
            // 初始化输入框
            const $input = dialog.$element.find('.mdui-textfield-input');
            mdui.updateTextFields($input);
            // 聚焦到输入框
            $input[0].focus();
            // 捕捉文本框回车键，在单行文本框的情况下触发回调
            if (options.type !== 'textarea' && options.confirmOnEnter === true) {
                $input.on('keydown', (event) => {
                    if (event.keyCode === 13) {
                        const value = dialog.$element.find('.mdui-textfield-input').val();
                        onConfirm(value, dialog);
                        if (options.closeOnConfirm) {
                            dialog.close();
                        }
                        return false;
                    }
                    return;
                });
            }
            // 如果是多行输入框，监听输入框的 input 事件，更新对话框高度
            if (options.type === 'textarea') {
                $input.on('input', () => dialog.handleUpdate());
            }
            // 有字符数限制时，加载完文本框后 DOM 会变化，需要更新对话框高度
            if (options.maxlength) {
                dialog.handleUpdate();
            }
        },
    });
};

/**
 * 添加链接
 */
class Link extends MenuAbstract {
    onclick() {
        const $curElem = this.selection.getContainerElem();
        let defaultUrl = '';
        if ($curElem.is('a')) {
            // 当前选区为 a 元素，则选中整个 a 元素
            this.selection.createRangeByElem($curElem, false, true);
            defaultUrl = $curElem.attr('href') || '';
        }
        const dialog = mdui.prompt('请输入链接地址', (url, dialog) => {
            if (!url) {
                // 链接为空，移除链接
                this.command.do('unlink');
                dialog.close();
                return;
            }
            const input = dialog.$element.find('.mdui-textfield-input')[0];
            if (input.validity && input.validity.valid) {
                this.command.do('createLink', url);
                dialog.close();
                return;
            }
        }, returnFalse, {
            confirmText: '确认',
            cancelText: '取消',
            defaultValue: defaultUrl,
            confirmOnEnter: true,
            closeOnConfirm: false,
        });
        dialog.$element
            .find('.mdui-textfield-input')
            .attr('type', 'text')
            .attr('pattern', '^(https?|ftp|file)://[\\S]+\\.[\\S]+$')
            .after('<div class="mdui-textfield-error">链接格式错误</div>');
        mdui.updateTextFields(dialog.$element.find('.mdui-textfield'));
        dialog.handleUpdate();
    }
    isActive() {
        return this.selection.getContainerElem().is('a');
    }
}
Link.icon = 'link';
Link.title = '插入链接';
Link.disable = ['image'];

each(['', 'All', 'Until'], (nameIndex, name) => {
    $.fn[`prev${name}`] = function (selector, filter) {
        // prevAll、prevUntil 需要把元素的顺序倒序处理，以便和 jQuery 的结果一致
        const $nodes = !nameIndex ? this : $(this.get().reverse());
        return dir($nodes, nameIndex, 'previousElementSibling', selector, filter);
    };
});

/**
 * ul、ol 两个功能需要继承该类
 */
class MenuListAbstract extends MenuAbstract {
    constructor() {
        super(...arguments);
        this.disable = ['head', 'code', 'image'];
    }
    /**
     * 获取命令名称
     */
    getCommandName() {
        return this.getName() === 'ol'
            ? 'insertOrderedList'
            : 'insertUnorderedList';
    }
    /**
     * 验证列表是否被包裹在 <p> 之内，因为可能同时操作多个列表，所以检查所有列表
     * @param $list
     */
    moveListToRoot($list) {
        $list.each((_, ol) => {
            const $parent = $(ol).parent();
            if ($parent.is(this.$container)) {
                return;
            }
            this.selection.createRangeByElem($parent, false, true);
            this.command.do('replaceRoot', ol);
        });
    }
    /**
     * 把纯文本、b、strong、i、em、a 标签包裹的元素移到 p 标签中，移除 br 标签
     */
    moveElemToP() {
        $(this.$container[0].childNodes).each((_, curElem) => {
            const $curElem = $(curElem);
            const { nodeType, nodeName, nodeValue, outerHTML, } = curElem;
            if (nodeType === 3) {
                // 纯文本，移动到 p 标签中
                this.selection.createRangeByElem($curElem.prev(), false, true);
                this.command.do('insertAfterRoot', nodeValue ? `<p>${nodeValue}</p>` : '<p><br></p>');
                $curElem.remove();
                return;
            }
            if (nodeType !== 1) {
                // 不是普通 DOM 节点，跳过
                return;
            }
            if (['B', 'STRONG', 'I', 'EM', 'A'].indexOf(nodeName) > -1) {
                // 移动到 p 标签中
                this.selection.createRangeByElem($curElem, false, true);
                this.command.do('replaceRoot', outerHTML ? `<p>${outerHTML}</p>` : '<p><br></p>');
                return;
            }
            if (nodeName === 'BR') {
                // 移除 br 元素
                $curElem.remove();
            }
        });
    }
    onclick() {
        this.command.do(this.getCommandName());
        this.moveListToRoot(this.$container.find(this.getName()));
        this.moveElemToP();
    }
    isActive() {
        return document.queryCommandState(this.getCommandName());
    }
}

/**
 * 有序列表
 */
class Ol extends MenuListAbstract {
    getName() {
        return 'ol';
    }
}
Ol.icon = 'format_list_numbered';
Ol.title = '有序列表';

/**
 * 无序列表
 */
class Ul extends MenuListAbstract {
    getName() {
        return 'ul';
    }
}
Ul.icon = 'format_list_bulleted';
Ul.title = '无序列表';

const MenuConstructors = {
    bold: Bold,
    clear_drafts: ClearDrafts,
    code: Code,
    head: Head,
    image: Image,
    italic: Italic,
    link: Link,
    ol: Ol,
    ul: Ul,
};
class Menus extends CommonAbstract {
    constructor(editor) {
        super(editor);
        /**
         * { 按钮名称: 按钮实例 }
         */
        this.menus = {};
        this.init();
    }
    /**
     * 初始化菜单
     * @private
     */
    init() {
        this.editor.options.menus.forEach((name) => {
            // 插入分隔符
            if (name === '|') {
                this.$toolbar.append('<div class="mdui_editor-toolbar-divider"></div>');
                return;
            }
            // 插入 spacer
            if (name === ' ') {
                this.$toolbar.append('<div class="mdui-toolbar-spacer"></div>');
                return;
            }
            const MenuConstructor = MenuConstructors[name];
            if (!MenuConstructor || typeof MenuConstructor !== 'function') {
                return;
            }
            // 创建按钮
            const $button = $(`<button class="mdui-btn mdui_editor-toolbar-menu mdui_editor-toolbar-menu-${name}" type="button" title="${MenuConstructor.title}">` +
                `<i class="mdui-icon material-icons">${MenuConstructor.icon}</i>` +
                '</button>').appendTo(this.$toolbar);
            // 实例化菜单项
            const menu = new MenuConstructor(this.editor, $button);
            this.menus[name] = menu;
            const onClick = () => {
                if (this.selection.getRange() === null) {
                    return;
                }
                menu.onclick();
            };
            $button.on('click', onClick);
        });
    }
    /**
     * 修改菜单按钮状态
     */
    changeStatus() {
        let disableMenus = [];
        each(this.menus, (name, menu) => {
            setTimeout(() => {
                // 切换激活状态
                if (menu.isActive()) {
                    menu.$button.addClass('mdui_editor-toolbar-menu-active');
                    if (MenuConstructors[name].disable) {
                        disableMenus = disableMenus.concat(MenuConstructors[name].disable);
                    }
                }
                else {
                    menu.$button.removeClass('mdui_editor-toolbar-menu-active');
                }
                // 禁用按钮，遍历到最后一个按钮再统一处理
                if (name ===
                    this.editor.options.menus[this.editor.options.menus.length - 1]) {
                    disableMenus = unique(disableMenus);
                    each(this.menus, (name, menu) => {
                        menu.$button.prop('disabled', disableMenus.indexOf(name) > -1);
                    });
                }
            }, 0);
        });
    }
}

/**
 * 是否是 webkit 浏览器
 */
function isWebkit() {
    return /webkit/i.test(navigator.userAgent);
}

/**
 * selection range API
 */
class Selection extends CommonAbstract {
    constructor() {
        super(...arguments);
        /**
         * 当前选区
         */
        this.currentRange = undefined;
    }
    /**
     * 获取 range 对象
     */
    getRange() {
        return this.currentRange;
    }
    /**
     * 保存选区
     * @param range 指定的选取。若未指定，则获取当前选区并保存
     */
    saveRange(range) {
        if (range) {
            // 保存已有选区
            this.currentRange = range;
            return;
        }
        // 获取当前的选区
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            return;
        }
        const rangeAt = selection.getRangeAt(0);
        // 判断选区内容是否在编辑内容之内
        const $containerElem = this.getContainerElem(rangeAt);
        if (!$containerElem.length) {
            return;
        }
        if (this.$container[0].contains($containerElem[0])) {
            // 是编辑内容之内的
            this.currentRange = rangeAt;
        }
    }
    /**
     * 折叠选区
     * @param toStart
     */
    collapseRange(toStart = false) {
        const range = this.currentRange;
        if (range) {
            range.collapse(toStart);
        }
    }
    /**
     * 获取选中区域的文字
     */
    getText() {
        return this.currentRange ? this.currentRange.toString() : '';
    }
    /**
     * 获取选区元素的 JQ 对象
     * @param range
     */
    getContainerElem(range) {
        range = range || this.currentRange;
        if (range) {
            const elem = range.commonAncestorContainer;
            return $(elem.nodeType === 1
                ? elem
                : elem.parentNode);
        }
        return $();
    }
    /**
     * 获取当前选区的最顶级元素的 JQ 对象
     * @param range
     */
    getRootElem(range) {
        const $elem = this.getContainerElem(range);
        if (this.$container.is($elem)) {
            // 当前选区选中了多个元素，返回 $container
            return $();
        }
        if ($elem.parent().is(this.$container)) {
            // 当前选区的元素就是 root 元素
            return $elem;
        }
        return $elem.parentsUntil(this.$container).last();
    }
    /**
     * 判断选区是否为空
     */
    isEmpty() {
        const range = this.currentRange;
        if (!range || !range.startContainer) {
            return false;
        }
        if (range.startContainer !== range.endContainer) {
            return false;
        }
        return range.startOffset === range.endOffset;
    }
    /**
     * 恢复选区
     */
    restore() {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this.currentRange);
    }
    /**
     * 创建一个空白（即 &#8203 字符）选区
     * @param tag 标签名，非 webkit 浏览器不支持插入纯文本，需要指定包裹空白元素的标签
     */
    createEmptyRange(tag = 'strong') {
        const range = this.getRange();
        let $elem;
        if (!range) {
            // 当前无 range
            return;
        }
        if (!this.isEmpty()) {
            // 当前选区必须没有内容才可以
            return;
        }
        try {
            // 目前只支持 webkit 内核
            if (isWebkit()) {
                // 插入 &#8203
                this.command.do('insertHTML', '&#8203;');
                // 修改 offset 位置
                range.setEnd(range.endContainer, range.endOffset + 1);
                // 存储
                this.saveRange(range);
            }
            else {
                $elem = $(`<${tag}>&#8203;</${tag}>`);
                this.command.do('insertElem', $elem);
                this.createRangeByElem($elem, true);
            }
        }
        catch (ex) {
            // 部分情况下会报错，兼容一下
        }
    }
    /**
     * 根据 JQ 对象设置选区
     * @param $elem
     * @param toStart   true 光标在开始位置，false 光标在结束位置
     * @param isContent 是否选中 elem 的内容
     */
    createRangeByElem($elem, toStart = false, isContent = false) {
        if (!$elem.length) {
            return;
        }
        const elem = $elem[0];
        const range = document.createRange();
        if (isContent) {
            range.selectNodeContents(elem);
        }
        else {
            range.selectNode(elem);
        }
        range.collapse(toStart);
        this.saveRange(range);
    }
}

/**
 * 获取剪贴板数据
 * @param event
 */
function getPasteData(event) {
    const clipboardData = event.clipboardData ||
        // @ts-ignore
        (event.originalEvent && event.originalEvent.clipboardData);
    let pasteText = '';
    let pasteHtml = '';
    if (clipboardData === null) {
        // @ts-ignore
        pasteText = window.clipboardData && window.clipboardData.getData('text');
    }
    else {
        pasteText = clipboardData.getData('text/plain');
        pasteHtml = clipboardData.getData('text/html');
    }
    return { pasteText, pasteHtml };
}
/**
 * 获取粘贴的纯文本
 * @param event
 */
function getPasteText(event) {
    const { pasteText } = getPasteData(event);
    return replaceHtmlSymbol(pasteText);
}

/**
 * 净化器
 */
function purifier(html) {
    let result = '';
    // todo 目前直接返回用每一行都用 p 标签包裹的 html，后续开发根据白名单进行过滤
    html.split('\n').forEach((line) => {
        // 移除行内的换行符
        line = line.replace(/[\r\n]/gm, '');
        result += line ? `<p>${line}</p>` : '<p><br></p>';
    });
    return result;
}

const DEFAULT_OPTIONS$5 = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onchange: () => { },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClearDrafts: () => { },
    onchangeTimeout: 200,
    placeholder: '说点什么',
    menus: [
        'bold',
        'italic',
        'head',
        'code',
        'ol',
        'ul',
        'link',
        'image',
        ' ',
        'clear_drafts',
    ],
    tagsWhiteList: [
        'p',
        'strong',
        'b',
        'em',
        'i',
        'h2',
        'pre',
        'code',
        'ol',
        'ul',
        'li',
        'a',
        'img',
        'figure',
        'figcaption',
    ],
    autoSave: false,
    autoSaveKey: 'mdui-editor-content',
    imageUploadUrl: '',
    imageUploadMaxSize: 1024 * 1024 * 2,
    imageUploadSuffix: ['png', 'jpg', 'gif'],
    imageUploadName: 'file',
    imageUploadResponseTransform: false,
};
/**
 * 编辑器
 */
class Editor {
    /**
     * 初始化编辑器
     * @param toolbar 工具栏的 CSS 选择器、或 DOM 元素、或 JQ 对象
     * @param container 编辑器内容的 CSS 选择器、或 DOM 元素、或 JQ 对象
     * @param options 配置参数
     */
    constructor(toolbar, container, options = {}) {
        /**
         * 配置参数
         */
        this.options = extend({}, DEFAULT_OPTIONS$5);
        /**
         * 输入内容时执行的函数
         */
        this.change = null;
        extend(this.options, options);
        this.$toolbar = $(toolbar).first().addClass('mdui_editor-toolbar');
        this.$container = $(container)
            .first()
            .addClass('mdui_editor-content mdui-typo')
            .attr({
            contenteditable: '',
            placeholder: this.options.placeholder,
        });
        this.command = new Command(this);
        this.selection = new Selection(this);
        this.menus = new Menus(this);
        // 写入草稿的内容
        if (this.options.autoSave) {
            this.setHTML(window.localStorage.getItem(this.options.autoSaveKey) || '');
        }
        this.initSelection(true);
        this.bindEvent();
        // 使用 p 换行
        this.command.do('defaultParagraphSeparator', 'p');
        // 禁止 IE 自动加链接
        try {
            this.command.do('AutoUrlDetect', false);
        }
        catch (e) {
            /* eslint-disable no-empty */
        }
    }
    /**
     * 初始化选区，将光标定位到内容尾部
     * @param newLine 是否在内容后面添加一个空行
     */
    initSelection(newLine = false) {
        const $children = this.$container.children();
        // 如果编辑器区域无内容，添加一个空行，重新设置选区
        if (!$children.length) {
            this.$container.append('<p><br></p>');
            return this.initSelection();
        }
        const $last = $children.last();
        // 最后一个元素不是 <p><br></p>，添加一个空行，重新设置选区
        if (newLine) {
            const html = $last.html().toLowerCase();
            const nodeName = $last[0].nodeName;
            if ((html !== '<br>' && html !== '<br/>') || nodeName !== 'P') {
                this.$container.append('<p><br></p>');
                return this.initSelection();
            }
        }
        this.updatePlaceholder();
        this.selection.createRangeByElem($last, false, true);
        this.selection.restore();
    }
    /**
     * 获取编辑器 html
     */
    getHTML() {
        return this.$container.html().replace(/\u200b/gm, '');
    }
    /**
     * 设置编辑器 html
     * @param html
     */
    setHTML(html) {
        this.$container.html(html);
        this.initSelection();
    }
    /**
     * 获取编辑器纯文本内容
     */
    getText() {
        return this.$container.text().replace(/\u200b/gm, '');
    }
    /**
     * 设置编辑器纯文本内容
     * @param text
     */
    setText(text) {
        this.setHTML(text ? `<p>${text}</p>` : '<p><br></p>');
    }
    /**
     * 清空编辑器内容
     */
    clear() {
        this.setHTML('<p><br></p>');
    }
    /**
     * 聚焦到输入框
     */
    focus() {
        this.initSelection();
    }
    /**
     * 绑定事件
     * @private
     */
    bindEvent() {
        // 记录输入法的开始和结束
        let compositionEnd = true;
        this.$container
            // 输入法开始输入
            .on('compositionstart', () => {
            compositionEnd = false;
        })
            // 输入法结束输入
            .on('compositionend', () => {
            compositionEnd = true;
        })
            // 绑定 onchange
            .on('click keyup', () => {
            if (compositionEnd && this.change) {
                this.change();
            }
        });
        this.$toolbar.on('click', () => {
            if (this.change) {
                this.change();
            }
        });
        this.bindChange();
        this.saveRangeRealTime();
        this.pasteHandler();
        this.deleteHandler();
        this.containerClickHandler();
        this.dragHandler();
        this.undoHandler();
    }
    /**
     * 更新 placeholder 显示状态
     */
    updatePlaceholder() {
        const className = 'mdui_editor-content-empty';
        this.$container.html() === '<p><br></p>'
            ? this.$container.addClass(className)
            : this.$container.removeClass(className);
    }
    /**
     * 绑定 onchange 事件
     * @private
     */
    bindChange() {
        const options = this.options;
        const onchangeTimeout = options.onchangeTimeout;
        let onchangeTimeoutId = 0;
        let beforeChangeHTML = this.getHTML();
        // 触发 change 的有三个场景：
        // 1. editor.$container.on('click keyup')
        // 2. editor.$toolbar.on('click')
        // 3. editor.command.do()
        this.change = () => {
            const currentHTML = this.getHTML();
            // 内容没有变化，则不处理
            if (currentHTML === beforeChangeHTML) {
                return;
            }
            // 执行，使用节流
            if (onchangeTimeoutId) {
                clearTimeout(onchangeTimeoutId);
            }
            onchangeTimeoutId = setTimeout(() => {
                // 触发配置参数中的 onchange 函数
                options.onchange(this);
                beforeChangeHTML = currentHTML;
                // 保存到 localStorage
                if (options.autoSave) {
                    window.localStorage.setItem(options.autoSaveKey, this.getHTML());
                }
                // 更新 placeholder 显示状态
                this.updatePlaceholder();
            }, onchangeTimeout);
        };
    }
    /**
     * 实时保存选区
     */
    saveRangeRealTime() {
        // 保存当前的选区
        const saveRange = () => {
            // 随时保存选区
            this.selection.saveRange();
            // 更新按钮状态
            this.menus.changeStatus();
        };
        this.$container
            .on('keyup', saveRange)
            .on('mousedown', () => {
            // mousedown 状态下，鼠标滑动到编辑区域外面，也需要保存选区
            this.$container.on('mouseleave', saveRange);
        })
            .on('mouseup', () => {
            saveRange();
            // 在编辑器区域之内完成点击，取消鼠标滑动到编辑区外面的事件
            this.$container.off('mouseleave', saveRange);
        });
    }
    /**
     * 粘贴文字、图片事件
     */
    pasteHandler() {
        this.$container.on('paste', (event) => {
            event.preventDefault();
            // 获取粘贴的文字
            const pasteHTML = purifier(getPasteText(event)); // todo 后续需要通过 getPasteHTML 获取内容，并进行过滤
            const pasteText = getPasteText(event);
            const $selectionElem = this.selection.getContainerElem();
            if (!$selectionElem.length) {
                return;
            }
            const { nodeName } = $selectionElem[0];
            // 代码块中只能粘贴纯文本
            if (nodeName === 'CODE' || nodeName === 'PRE') {
                this.command.do('insertHTML', pasteText);
                return;
            }
            if (!pasteHTML) {
                return;
            }
            try {
                // firefox 中，获取的 pasteHtml 可能是没有 <ul> 包裹的 <li>
                // 因此执行 insertHTML 会报错
                this.command.do('insertHTML', pasteHTML);
            }
            catch (ex) {
                // 此时使用 pasteText 来兼容一下
                this.command.do('insertHTML', pasteText);
            }
        });
    }
    /**
     * 按删除键时的处理
     */
    deleteHandler() {
        this.$container.on('keydown keyup', (event) => {
            const { keyCode, type } = event;
            if (keyCode === 8 || keyCode === 46) {
                // 按删除键时，始终保留最后一个空行
                const html = this.$container.html().toLowerCase().trim();
                if (type === 'keydown') {
                    if (html === '<p><br></p>') {
                        event.preventDefault();
                    }
                    else if (!html) {
                        this.$container.html('<p><br></p>');
                        event.preventDefault();
                    }
                }
                if (type === 'keyup') {
                    if (!html) {
                        this.$container.html('<p><br></p>');
                    }
                }
            }
            this.updatePlaceholder();
        });
    }
    /**
     * 在 $container 上点击的处理
     * @private
     */
    containerClickHandler() {
        this.$container.on('click', (event) => {
            const target = event.target;
            if (!$(target).is(this.$container)) {
                return;
            }
            const $last = this.$container.children().last();
            // 在 $container 上点击时，如果最后一行不是 p，则在最后添加一个空行，并聚焦
            // $container 中不存在元素，或最后一行不是 p，添加一行
            if (!$last.length || $last[0].nodeName !== 'P') {
                this.command.do('appendHTML', '<p><br></p>');
            }
        });
    }
    /**
     * 拖拽事件
     */
    dragHandler() {
        // 禁用编辑器内容拖拽事件
        this.$container.on('dragleave drop dragenter dragover', false);
        // todo 编辑区域拖拽上传图片
    }
    /**
     * Ctrl + Z 处理
     */
    undoHandler() {
        // undo 操作无法撤销直接操作 DOM 的清空，先直接禁用 undo，以后想办法
        this.$container.on('keydown', (event) => {
            if (event.ctrlKey &&
                event.keyCode === 90) {
                return false;
            }
        });
    }
}

export default Editor;
//# sourceMappingURL=editor.esm.js.map
