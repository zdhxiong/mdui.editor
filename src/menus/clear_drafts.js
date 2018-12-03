/**
 * 舍弃草稿
 */
class ClearDrafts {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'delete';
    this.title = '舍弃草稿';
  }

  onclick() {
    const { editor } = this;

    editor.setHTML('');

    if (editor.options.autoSave) {
      localStorage.removeItem(editor.options.autoSaveKey);
      editor.options.onClearDrafts();
    }
  }
}

export default ClearDrafts;
