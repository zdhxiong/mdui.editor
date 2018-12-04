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
    const { options } = editor;

    editor.setHTML('');

    if (options.autoSave) {
      window.localStorage.removeItem(options.autoSaveKey);
      options.onClearDrafts();
    }
  }
}

export default ClearDrafts;
