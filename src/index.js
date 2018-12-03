import { JQ as $ } from 'mdui';
import Command from './helper/command';
import Selection from './helper/selection';
import Purifier from './helper/purifier';
import Menus from './menus';
import { getPasteText } from './helper/utils';

// 编辑器ID，累加
let editorId = 1;

// 默认配置参数
const config = {
  // 内容变化的回调
  onchange: () => {},

  // onchange 的触发延迟
  onchangeTimeout: 200,

  placeholder: '说点什么',

  // 工具栏按钮，| 表示众向分隔线，空格表示将两侧的内容挤向两边
  menus: ['bold', 'italic', '|', 'head', 'code', 'ol', 'ul', '|', 'link', 'image', ' ', '|', 'clear_drafts'],

  // 标签白名单，不在白名单中的标签都将被过滤
  tagsWhiteList: ['p', 'strong', 'b', 'em', 'i', 'h2', 'pre', 'code', 'ol', 'ul', 'li', 'a', 'img', 'figure', 'figcaption'],

  // 是否自动实时保存编辑器内容到 localStorage
  autoSave: false,

  // 保存编辑器内容到 localstorage 中的键名，仅 autoSave 为 true 时有效
  autoSaveKey: 'mdui-editor-content',

  // 舍弃草稿后的回调
  onClearDrafts: () => {},
};

/**
 * 编辑器
 */
class Editor {
  /**
   * @param contentSelector 内容区域选择器
   * @param toolbarSelector 工具栏区域选择器
   * @param _options        配置参数
   */
  constructor(contentSelector, toolbarSelector, _options = {}) {
    editorId += 1;

    this.id = `mc-editor-${editorId}`;
    this.options = $.extend({}, config, _options);

    this.$toolbar = $(toolbarSelector);
    this.$content = $(contentSelector).attr({
      'contenteditable': '',
      'placeholder': this.options.placeholder,
    });

    this.cmd = new Command(this);
    this.purifier = new Purifier(this);
    this.selection = new Selection(this);
    this.menus = new Menus(this);

    // 写入草稿的内容
    if (this.options.autoSave) {
      this.setHTML(window.localStorage.getItem(this.options.autoSaveKey) || '');
    }

    this.initSelection(true);
    this._bindEvent();

    // 使用 p 换行
    this.cmd.do('defaultParagraphSeparator', 'p');

    // 禁止 IE 自动加链接
    try {
      this.cmd.do('AutoUrlDetect', false);
    } catch (e) {
      /* eslint-disable no-empty */
    }
  }

  /**
   * 初始化选区，将光标定位到内容尾部
   * @param newLine    是否在内容后面添加一个空行
   */
  initSelection(newLine) {
    const { $content } = this;
    const $children = $content.children();

    // 如果编辑器区域无内容，添加一个空行，重新设置选区
    if (!$children.length) {
      $content.append('<p><br></p>');
      this.initSelection();
      return;
    }

    const $last = $children.last();

    // 最后一个元素不是 <p><br></p>，添加一个空行，重新设置选区
    if (newLine) {
      const html = $last.html().toLowerCase();
      const { nodeName } = $last[0];
      if ((html !== '<br>' && html !== '<br/>') || nodeName !== 'P') {
        $content.append($('<p><br></p>'));
        this.initSelection();
        return;
      }
    }

    this._updatePlaceholder();
    this.selection.createRangeByElem($last, false, true);
    this.selection.restore();
  }

  /**
   * 获取编辑器 html
   * @returns {*|string|void}
   */
  getHTML() {
    return this.$content.html().replace(/\u200b/gm, '');
  }

  /**
   * 设置编辑器 html
   * @param html
   */
  setHTML(html) {
    this.$content.html(html);
    this.initSelection();
  }

  /**
   * 获取编辑器纯文本内容
   * @returns {*}
   */
  getText() {
    return this.$content.text().replace(/\u200b/gm, '');
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
  _bindEvent() {
    const { $toolbar, $content } = this;

    // 记录输入法的开始和结束
    let compositionEnd = true;

    $content
      .on('compositionstart', () => {
        // 输入法开始输入
        compositionEnd = false;
      })
      .on('compositionend', () => {
        // 输入法结束输入
        compositionEnd = true;
      });

    // 绑定 onchange
    $content.on('click keyup', () => {
      if (compositionEnd && this.change) {
        this.change();
      }
    });

    $toolbar.on('click', () => {
      if (this.change) {
        this.change();
      }
    });

    this._bindOnchange();
    this._saveRangeRealTime();
    this._pasteHandle();
    this._deleteHandle();
    this._contentClickHandle();
    this._dragHandle();
    this._undoHandle();
  }

  /**
   * 更新 placeholder 显示状态
   * @private
   */
  _updatePlaceholder() {
    const { $content } = this;
    const className = 'mduiEditor-content-empty';

    if ($content.html() === '<p><br></p>') {
      $content.addClass(className);
    } else {
      $content.removeClass(className);
    }
  }

  /**
   * 绑定 onchange 事件
   * @private
   */
  _bindOnchange() {
    let onchangeTimeoutId = 0;
    let beforeChangeHTML = this.getHTML();
    const onchangeTimeout = parseInt(this.options.onchangeTimeout, 10);

    // 触发 change 的有三个场景：
    // 1. $content.on('click keyup')
    // 2. $toolbar.on('click')
    // 3. editor.cmd.do()
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
        this.options.onchange(this);
        beforeChangeHTML = currentHTML;

        // 保存到 localStorage
        if (this.options.autoSave) {
          localStorage.setItem(this.options.autoSaveKey, this.getHTML());
        }

        // 更新 placeholder 显示状态
        this._updatePlaceholder();
      }, onchangeTimeout);
    };
  }

  /**
   * 实时保存选区
   * @private
   */
  _saveRangeRealTime() {
    const { $content } = this;

    // 保存当前的选区
    const saveRange = () => {
      // 随时保存选区
      this.selection.saveRange();
      // 更新按钮状态
      this.menus.changeStatus();
    };

    $content
      .on('keyup', saveRange)
      .on('mousedown', () => {
        // mousedown 状态下，鼠标滑动到编辑区域外面，也需要保存选区
        $content.on('mouseleave', saveRange);
      })
      .on('mouseup', () => {
        saveRange();
        // 在编辑器区域之内完成点击，取消鼠标滑动到编辑区外面的事件
        $content.off('mouseleave', saveRange);
      });
  }

  /**
   * 粘贴文字、图片事件
   * @private
   */
  _pasteHandle() {
    const { $content } = this;

    $content.on('paste', (e) => {
      e.preventDefault();

      // 获取粘贴的文字
      const pasteHTML = this.purifier.do(getPasteText(e)); // todo 后续需要通过 getPasteHTML 获取内容，并进行过滤
      const pasteText = getPasteText(e);

      const $selectionElem = this.selection.getContainerElem();
      if (!$selectionElem.length) {
        return;
      }

      const { nodeName } = $selectionElem[0];

      // 代码块中只能粘贴纯文本
      if (nodeName === 'CODE' || nodeName === 'PRE') {
        this.cmd.do('insertHTML', pasteText);
        return;
      }

      if (!pasteHTML) {
        return;
      }

      try {
        // firefox 中，获取的 pasteHtml 可能是没有 <ul> 包裹的 <li>
        // 因此执行 insertHTML 会报错
        this.cmd.do('insertHTML', pasteHTML);
      } catch (ex) {
        // 此时使用 pasteText 来兼容一下
        this.cmd.do('insertHTML', pasteText);
      }
    });
  }

  /**
   * 按删除键时的处理
   * @private
   */
  _deleteHandle() {
    const { $content } = this;

    $content.on('keydown keyup', (event) => {
      if (event.keyCode === 8 || event.keyCode === 46) {
        // 按删除键时，始终保留最后一个空行
        const html = $content.html().toLowerCase().trim();

        if (event.type === 'keydown') {
          if (html === '<p><br></p>') {
            event.preventDefault();
          } else if (!html) {
            $content.html('<p><br></p>');
            event.preventDefault();
          }
        }

        if (event.type === 'keyup') {
          if (!html) {
            $content.html('<p><br></p>');
          }
        }
      }

      this._updatePlaceholder();
    });
  }

  /**
   * 在 $content 上点击的处理
   * @private
   */
  _contentClickHandle() {
    const { $content } = this;

    $content.on('click', (event) => {
      // 在 $content 上点击时，如果最后一行不是 p，则在最后添加一个空行，并聚焦
      if ($(event.target).is($content)) {
        const $last = $content.children().last();

        if (!$last.length || $last[0].nodeName !== 'P') {
          // $content 中不存在元素，或最后一行不是 p，添加一行
          this.cmd.do('appendHTML', '<p><br></p>');
        }
      }
    });
  }

  /**
   * 拖拽事件
   * @private
   */
  _dragHandle() {
    // 禁用编辑器内容拖拽事件
    $(document).on('dragleave drop dragenter dragover', (e) => {
      e.preventDefault();
    });

    // todo 编辑区域拖拽上传图片
  }

  /**
   * Ctrl + Z 处理
   * @private
   */
  _undoHandle() {
    // undo 操作无法撤销直接操作 DOM 的清空，先直接禁用 undo，以后想办法
    this.$content.on('keydown', (event) => {
      if (event.ctrlKey && event.keyCode === 90) {
        event.preventDefault();
      }
    });
  }
}

export default Editor;
