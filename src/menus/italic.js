/**
 * 斜体
 */
class Italic {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'format_italic';
    this.title = '斜体';
    this.disable = ['image'];
    this._active = false;
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd } = editor;
    const isSelectionEmpty = selection.isEmpty();

    if (isSelectionEmpty) {
      // 选区是空的，插入并选中一个“空白”
      selection.createEmptyRange('em');
    }

    // 执行 italic 命令
    cmd.do('italic');

    if (isSelectionEmpty) {
      // 需要将选区折叠起来
      selection.collapseRange();
      selection.restore();
    }
  }

  isActive() {
    this._active = document.queryCommandState('italic');

    return this._active;
  }
}

export default Italic;
