import { JQ as $ } from 'mdui';
import UA from './ua';

/**
 * 选区
 */
class Selection {
  constructor(editor) {
    this.editor = editor;
    this._currentRange = null;
  }

  /**
   * 获取 range 对象
   * @returns {null}
   */
  getRange() {
    return this._currentRange;
  }

  /**
   * 保存选区
   * @param _range
   */
  saveRange(_range) {
    if (_range) {
      // 保存已有选区
      this._currentRange = _range;
      return;
    }

    // 获取当前的选区
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // 判断选区内容是否在编辑内容之内
    const $containerElem = this.getContainerElem(range);
    if (!$containerElem.length) {
      return;
    }

    const { editor } = this;
    if (editor.$content[0].contains($containerElem[0])) {
      // 是编辑内容之内的
      this._currentRange = range;
    }
  }

  /**
   * 折叠选区
   * @param toStart
   */
  collapseRange(toStart = false) {
    const range = this._currentRange;

    if (range) {
      range.collapse(toStart);
    }
  }

  /**
   * 获取选中区域的文字
   * @returns {string}
   */
  getText() {
    let text = '';

    if (this._currentRange) {
      text = this._currentRange.toString();
    }

    return text;
  }

  /**
   * 获取选区元素的 JQ 对象
   * @param _range
   * @returns []
   */
  getContainerElem(_range) {
    const range = _range || this._currentRange;

    if (range) {
      const elem = range.commonAncestorContainer;
      return $(elem.nodeType === 1 ? elem : elem.parentNode);
    }

    return $();
  }

  /**
   * 获取当前选区的最顶级元素的 JQ 对象
   * @param _range
   * @returns []
   */
  getRootElem(_range) {
    const $elem = this.getContainerElem(_range);
    const { $content } = this.editor;

    if ($content.is($elem)) {
      // 当前选区选中了多个元素，返回 $content
      return $();
    }

    if ($elem.parent().is($content)) {
      // 当前选区的元素就是 root 元素
      return $elem;
    }

    return $elem.parentsUntil($content).last();
  }

  /**
   * 判断选区是否为空
   * @returns {boolean}
   */
  isEmpty() {
    const range = this._currentRange;

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
    selection.addRange(this._currentRange);
  }

  /**
   * 创建一个空白（即 &#8203 字符）选区
   * @param tag 标签名，非 webkit 浏览器不支持插入纯文本，需要指定包裹空白元素的标签
   */
  createEmptyRange(tag = 'strong') {
    const { editor } = this;
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
      if (UA.isWebkit()) {
        // 插入 &#8203
        editor.cmd.do('insertHTML', '&#8203;');
        // 修改 offset 位置
        range.setEnd(range.endContainer, range.endOffset + 1);
        // 存储
        this.saveRange(range);
      } else {
        $elem = $(`<${tag}>&#8203;</${tag}>`);
        editor.cmd.do('insertElem', $elem);
        this.createRangeByElem($elem, true);
      }
    } catch (ex) {
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
    } else {
      range.selectNode(elem);
    }

    if (typeof toStart === 'boolean') {
      range.collapse(toStart);
    }

    this.saveRange(range);
  }
}

export default Selection;
