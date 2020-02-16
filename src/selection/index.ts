import $ from 'mdui.jq/es/$';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/is';
import 'mdui.jq/es/methods/last';
import 'mdui.jq/es/methods/parent';
import 'mdui.jq/es/methods/parentsUntil';
import CommonAbstract from '../abstracts/commonAbstract';
import { isWebkit } from '../utils/ua';

/**
 * selection range API
 */
class Selection extends CommonAbstract {
  /**
   * 当前选区
   */
  private currentRange: Range | undefined = undefined;

  /**
   * 获取 range 对象
   */
  public getRange(): Range | undefined {
    return this.currentRange;
  }

  /**
   * 保存选区
   * @param range 指定的选取。若未指定，则获取当前选区并保存
   */
  public saveRange(range?: Range): void {
    if (range) {
      // 保存已有选区
      this.currentRange = range;
      return;
    }

    // 获取当前的选区
    const selection = window.getSelection()!;
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
  public collapseRange(toStart = false): void {
    const range = this.currentRange;

    if (range) {
      range.collapse(toStart);
    }
  }

  /**
   * 获取选中区域的文字
   */
  public getText(): string {
    return this.currentRange ? this.currentRange.toString() : '';
  }

  /**
   * 获取选区元素的 JQ 对象
   * @param range
   */
  public getContainerElem(range?: Range): JQ {
    range = range || this.currentRange;

    if (range) {
      const elem = range.commonAncestorContainer;
      return $(
        elem.nodeType === 1
          ? (elem as HTMLElement)
          : (elem.parentNode as HTMLElement),
      );
    }

    return $();
  }

  /**
   * 获取当前选区的最顶级元素的 JQ 对象
   * @param range
   */
  public getRootElem(range?: Range): JQ {
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
  public isEmpty(): boolean {
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
  public restore(): void {
    const selection = window.getSelection()!;

    selection.removeAllRanges();
    selection.addRange(this.currentRange!);
  }

  /**
   * 创建一个空白（即 &#8203 字符）选区
   * @param tag 标签名，非 webkit 浏览器不支持插入纯文本，需要指定包裹空白元素的标签
   */
  public createEmptyRange(tag = 'strong'): void {
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
      } else {
        $elem = $(`<${tag}>&#8203;</${tag}>`);
        this.command.do('insertElem', $elem);
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
  public createRangeByElem(
    $elem: JQ,
    toStart = false,
    isContent = false,
  ): void {
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

    range.collapse(toStart);

    this.saveRange(range);
  }
}

export default Selection;
