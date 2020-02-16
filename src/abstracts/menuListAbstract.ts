import $ from 'mdui.jq/es/$';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/each';
import 'mdui.jq/es/methods/is';
import 'mdui.jq/es/methods/parent';
import 'mdui.jq/es/methods/prev';
import 'mdui.jq/es/methods/remove';
import MenuAbstract from './menuAbstract';

/**
 * ul、ol 两个功能需要继承该类
 */
abstract class MenuListAbstract extends MenuAbstract {
  public disable = ['head', 'code', 'image'];

  /**
   * 获取元素名称：ol 或 ul
   */
  protected abstract getName(): string;

  /**
   * 获取命令名称
   */
  private getCommandName(): string {
    return this.getName() === 'ol'
      ? 'insertOrderedList'
      : 'insertUnorderedList';
  }

  /**
   * 验证列表是否被包裹在 <p> 之内，因为可能同时操作多个列表，所以检查所有列表
   * @param $list
   */
  protected moveListToRoot($list: JQ): void {
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
  protected moveElemToP(): void {
    $(this.$container[0].childNodes).each((_, curElem) => {
      const $curElem = ($(curElem) as unknown) as JQ;
      const {
        nodeType,
        nodeName,
        nodeValue,
        outerHTML,
      } = (curElem as unknown) as HTMLElement;

      if (nodeType === 3) {
        // 纯文本，移动到 p 标签中
        this.selection.createRangeByElem($curElem.prev(), false, true);
        this.command.do(
          'insertAfterRoot',
          nodeValue ? `<p>${nodeValue}</p>` : '<p><br></p>',
        );
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
        this.command.do(
          'replaceRoot',
          outerHTML ? `<p>${outerHTML}</p>` : '<p><br></p>',
        );

        return;
      }

      if (nodeName === 'BR') {
        // 移除 br 元素
        $curElem.remove();
      }
    });
  }

  public onclick(): void {
    this.command.do(this.getCommandName());

    this.moveListToRoot(this.$container.find(this.getName()));
    this.moveElemToP();
  }

  public isActive(): boolean {
    return document.queryCommandState(this.getCommandName());
  }
}

export default MenuListAbstract;
