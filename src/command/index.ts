import $ from 'mdui.jq/es/$';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/appendTo';
import 'mdui.jq/es/methods/insertAfter';
import 'mdui.jq/es/methods/remove';
import CommonAbstract from '../abstracts/commonAbstract';

/**
 * 封装 document.execCommand 命令
 */
class Command extends CommonAbstract {
  /**
   * 执行命令
   * @param name
   * @param value
   */
  do(name: string, value?: any): void {
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
    } else {
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
  private insertHTML(html: string): void {
    // W3C
    if (document.queryCommandSupported('insertHTML')) {
      document.execCommand('insertHTML', false, html);
      return;
    }

    const range = this.selection.getRange()!;

    if (range.insertNode) {
      // IE
      range.deleteContents();
      range.insertNode($(html)[0]);
      // @ts-ignore
    } else if (range.pasteHTML) {
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
  private replaceRoot(html: string): void {
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
  private insertAfterRoot(html: string): void {
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
  private appendHTML(html: string): void {
    const $newElem = $(html).appendTo(this.$container);

    this.selection.createRangeByElem($newElem, false, true);
    this.selection.restore();
  }

  /**
   * 插入 elem
   * @param $elem
   */
  // @ts-ignore
  private insertElem($elem: JQ): void {
    const range = this.selection.getRange()!;

    if (range.insertNode) {
      range.deleteContents();
      range.insertNode($elem[0]);
    }
  }
}

export default Command;
