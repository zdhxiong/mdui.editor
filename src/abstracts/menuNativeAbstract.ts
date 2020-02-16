import MenuAbstract from './menuAbstract';

/**
 * 原生命令抽象类
 */
abstract class MenuNativeAbstract extends MenuAbstract {
  /**
   * 获取原生命令的名称
   */
  protected abstract getCommandName(): string;

  /**
   * 在非 webkit 浏览器中空白元素的标签
   */
  protected abstract getElementName(): string;

  public onclick(): void {
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

  public isActive(): boolean {
    return document.queryCommandState(this.getCommandName());
  }
}

export default MenuNativeAbstract;
