/**
 * 加粗
 */
class Bold {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'format_bold';
    this.title = '粗体';
    this.disable = ['image'];
    this._active = false;
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd } = editor;
    const isSelectionEmpty = selection.isEmpty();

    if (isSelectionEmpty) {
      // 选区是空的，插入并选中一个“空白”
      selection.createEmptyRange('strong');
    }

    // 执行 bold 命令
    cmd.do('bold');

    if (isSelectionEmpty) {
      // 需要将选区折叠起来
      selection.collapseRange();
      selection.restore();
    }
  }

  isActive() {
    this._active = document.queryCommandState('bold');

    return this._active;
  }
}

export default Bold;
