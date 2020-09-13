import $ from 'mdui.jq/es/$';
import extend from 'mdui.jq/es/functions/extend';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/addClass';
import 'mdui.jq/es/methods/append';
import 'mdui.jq/es/methods/attr';
import 'mdui.jq/es/methods/children';
import 'mdui.jq/es/methods/first';
import 'mdui.jq/es/methods/html';
import 'mdui.jq/es/methods/is';
import 'mdui.jq/es/methods/last';
import 'mdui.jq/es/methods/off';
import 'mdui.jq/es/methods/on';
import 'mdui.jq/es/methods/removeClass';
import 'mdui.jq/es/methods/text';
import Selector from 'mdui.jq/es/types/Selector';
import Command from './command/index';
import Menus from './menus/index';
import Selection from './selection/index';
import { getPasteText } from './utils/paste';
import { purifier } from './utils/purifier';

/**
 * 菜单项
 */
type MENUS =
  | 'bold'
  | 'italic'
  | 'head'
  | 'code'
  | 'ol'
  | 'ul'
  | 'link'
  | 'image'
  | 'clear_drafts'
  | ' '
  | '|';

/**
 * 标签白名单
 */
type TAGS_WHITELIST =
  | 'p'
  | 'strong'
  | 'b'
  | 'em'
  | 'i'
  | 'h2'
  | 'pre'
  | 'code'
  | 'ol'
  | 'ul'
  | 'li'
  | 'a'
  | 'img'
  | 'figure'
  | 'figcaption';

/**
 * 配置参数
 */
type OPTIONS = {
  /**
   * 编辑器内容变化时的回调函数
   */
  onchange?: (editor: Editor) => void;

  /**
   * 舍弃草稿后的回调
   */
  onClearDrafts?: () => void;

  /**
   * onchange 回调的延迟，单位为毫秒
   */
  onchangeTimeout?: number;

  /**
   * 编辑器的占位文本
   */
  placeholder?: string;

  /**
   * 工具栏按钮，`|` 表示纵向分割线，空格表示将两侧的内容挤向两边
   */
  menus?: MENUS[];

  /**
   * 标签白名单，不在白名单中的标签都将被过滤
   */
  tagsWhiteList?: TAGS_WHITELIST[];

  /**
   * 是否自动实时保存编辑器内容到 localStorage
   */
  autoSave?: boolean;

  /**
   * 保存编辑器内容到 localstorage 中的键名，仅 autoSave 为 true 时有效
   */
  autoSaveKey?: string;

  /**
   * 图片上传服务器的链接
   */
  imageUploadUrl?: string;

  /**
   * 允许上传的图片的最大体积，设置为 0 表示不限制
   */
  imageUploadMaxSize?: number;

  /**
   * 允许上传的图片的后缀
   */
  imageUploadSuffix?: string[];

  /**
   * 图片上传的键名，用于服务端获取图片
   */
  imageUploadName?: string;

  /**
   * 上传接口的响应值必须符合该格式。若不符合，可以使用该函数进行转换
   */
  imageUploadResponseTransform?:
    | ((
        response: any,
      ) => {
        code: number;
        message?: string;
        data: { url: string };
      })
    | false;
};

const DEFAULT_OPTIONS: OPTIONS = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onchange: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClearDrafts: () => {},
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
   * 配置参数
   */
  public options: OPTIONS = extend({}, DEFAULT_OPTIONS);

  /**
   * 工具栏元素
   */
  public $toolbar: JQ;

  /**
   * 内容区域元素
   */
  public $container: JQ;

  /**
   * 命令实例
   */
  public command: Command;

  /**
   * 选区实例
   */
  public selection: Selection;

  /**
   * 菜单实例
   */
  public menus: Menus;

  /**
   * 输入内容时执行的函数
   */
  public change: (() => void) | null = null;

  /**
   * 初始化编辑器
   * @param toolbar 工具栏的 CSS 选择器、或 DOM 元素、或 JQ 对象
   * @param container 编辑器内容的 CSS 选择器、或 DOM 元素、或 JQ 对象
   * @param options 配置参数
   */
  constructor(
    toolbar: Selector | HTMLElement | HTMLElement[],
    container: Selector | HTMLElement | HTMLElement[],
    options: OPTIONS = {},
  ) {
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
      this.setHTML(
        window.localStorage.getItem(this.options.autoSaveKey!) || '',
      );
    }

    this.initSelection(true);
    this.bindEvent();

    // 使用 p 换行
    this.command.do('defaultParagraphSeparator', 'p');

    // 禁止 IE 自动加链接
    try {
      this.command.do('AutoUrlDetect', false);
    } catch (e) {
      /* eslint-disable no-empty */
    }
  }

  /**
   * 初始化选区，将光标定位到内容尾部
   * @param newLine 是否在内容后面添加一个空行
   */
  public initSelection(newLine = false): void {
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
  public getHTML(): string {
    return this.$container.html().replace(/\u200b/gm, '');
  }

  /**
   * 设置编辑器 html
   * @param html
   */
  public setHTML(html: string): void {
    this.$container.html(html);
    this.initSelection();
  }

  /**
   * 获取编辑器纯文本内容
   */
  public getText(): string {
    return this.$container.text().replace(/\u200b/gm, '');
  }

  /**
   * 设置编辑器纯文本内容
   * @param text
   */
  public setText(text: string): void {
    this.setHTML(text ? `<p>${text}</p>` : '<p><br></p>');
  }

  /**
   * 清空编辑器内容
   */
  public clear(): void {
    this.setHTML('<p><br></p>');
  }

  /**
   * 聚焦到输入框
   */
  public focus(): void {
    this.initSelection();
  }

  /**
   * 绑定事件
   * @private
   */
  private bindEvent(): void {
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
  private updatePlaceholder(): void {
    const className = 'mdui_editor-content-empty';

    this.$container.html() === '<p><br></p>'
      ? this.$container.addClass(className)
      : this.$container.removeClass(className);
  }

  /**
   * 绑定 onchange 事件
   * @private
   */
  private bindChange(): void {
    const options = this.options;
    const onchangeTimeout = options.onchangeTimeout!;

    let onchangeTimeoutId = 0;
    let beforeChangeHTML = this.getHTML();

    // 触发 change 的有三个场景：
    // 1. editor.$container.on('click keyup')
    // 2. editor.$toolbar.on('click')
    // 3. editor.command.do()
    this.change = (): void => {
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
        options.onchange!(this);
        beforeChangeHTML = currentHTML;

        // 保存到 localStorage
        if (options.autoSave) {
          window.localStorage.setItem(options.autoSaveKey!, this.getHTML());
        }

        // 更新 placeholder 显示状态
        this.updatePlaceholder();
      }, onchangeTimeout);
    };
  }

  /**
   * 实时保存选区
   */
  private saveRangeRealTime(): void {
    // 保存当前的选区
    const saveRange = (): void => {
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
  private pasteHandler(): void {
    this.$container.on('paste', (event) => {
      event.preventDefault();

      // 获取粘贴的文字
      const pasteHTML = purifier(getPasteText(event as ClipboardEvent)); // todo 后续需要通过 getPasteHTML 获取内容，并进行过滤
      const pasteText = getPasteText(event as ClipboardEvent);

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
      } catch (ex) {
        // 此时使用 pasteText 来兼容一下
        this.command.do('insertHTML', pasteText);
      }
    });
  }

  /**
   * 按删除键时的处理
   */
  private deleteHandler(): void {
    this.$container.on('keydown keyup', (event) => {
      const { keyCode, type } = event as KeyboardEvent;

      if (keyCode === 8 || keyCode === 46) {
        // 按删除键时，始终保留最后一个空行
        const html = this.$container.html().toLowerCase().trim();

        if (type === 'keydown') {
          if (html === '<p><br></p>') {
            event.preventDefault();
          } else if (!html) {
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
  private containerClickHandler(): void {
    this.$container.on('click', (event) => {
      const target = event.target as HTMLElement;

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
  private dragHandler(): void {
    // 禁用编辑器内容拖拽事件
    this.$container.on('dragleave drop dragenter dragover', false);

    // todo 编辑区域拖拽上传图片
  }

  /**
   * Ctrl + Z 处理
   */
  private undoHandler(): void {
    // undo 操作无法撤销直接操作 DOM 的清空，先直接禁用 undo，以后想办法
    this.$container.on('keydown', (event: Event): void | false => {
      if (
        (event as KeyboardEvent).ctrlKey &&
        (event as KeyboardEvent).keyCode === 90
      ) {
        return false;
      }
    });
  }
}

export default Editor;
