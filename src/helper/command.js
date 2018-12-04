import { JQ as $ } from 'mdui';

/**
 * 命令
 */
class Command {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * 执行命令
   * @param name
   * @param value
   */
  do(name, value) {
    const { editor } = this;
    const { selection, menus, change } = editor;

    // 如果无选区，忽略
    if (!selection.getRange()) {
      return;
    }

    // 恢复选区
    selection.restore();

    const customName = `_${name}`;

    // 执行命令
    if (this[customName]) {
      this[customName](value);
    } else {
      document.execCommand(name, false, value);
    }

    // 修改菜单状态
    menus.changeStatus();

    // 最后，恢复选区保证光标在原来的位置闪烁
    selection.saveRange();
    selection.restore();

    // 触发 onchange
    if (change) {
      change();
    }
  }

  /**
   * 自定义 insertHTML 事件，在当前选区中插入指定 HTML
   * @param html
   * @private
   */
  _insertHTML(html) {
    const { editor } = this;
    const range = editor.selection.getRange();

    if (document.queryCommandSupported('insertHTML')) {
      // W3C
      document.execCommand('insertHTML', false, html);
    } else if (range.insertNode) {
      // IE
      range.deleteContents();
      range.insertNode($(html)[0]);
    } else if (range.pasteHTML) {
      // IE <= 10
      range.pasteHTML(html);
    }
  }

  /**
   * 用指定 HTML 替换当前选区的 root 元素
   * @param html
   * @private
   */
  _replaceRoot(html) {
    const { editor } = this;
    const { selection } = editor;

    const $oldElem = selection.getRootElem();
    const $newElem = $(html).insertAfter($oldElem);
    $oldElem.remove();
    selection.createRangeByElem($newElem, false, true);
    selection.restore();
  }

  /**
   * 在当前选区的 root 元素后面插入指定 html
   * @param html
   * @private
   */
  _insertAfterRoot(html) {
    const { editor } = this;
    const { selection } = editor;

    const $oldElem = selection.getRootElem();
    const $newElem = $(html).insertAfter($oldElem);
    selection.createRangeByElem($newElem, false, true);
    selection.restore();
  }

  /**
   * 在当前 $content 的最后追加 html
   * @param html
   * @private
   */
  _appendHTML(html) {
    const { editor } = this;
    const { selection, $content } = editor;

    const $newElem = $(html).appendTo($content);
    selection.createRangeByElem($newElem, false, true);
    selection.restore();
  }

  /**
   * 插入 elem
   * @param $elem
   * @private
   */
  _insertElem($elem) {
    const { editor } = this;
    const range = editor.selection.getRange();

    if (range.insertNode) {
      range.deleteContents();
      range.insertNode($elem[0]);
    }
  }
}

export default Command;
