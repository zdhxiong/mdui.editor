import { moveListToRoot, moveElemToP } from '../helper/utils';

/**
 * 有序列表
 */
class Ol {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'format_list_numbered';
    this.title = '有序列表';
    this.disable = ['head', 'code', 'image'];
    this._active = false;
  }

  onclick() {
    const { editor } = this;

    editor.cmd.do('insertOrderedList');

    moveListToRoot(editor.$content.find('ol'), editor);
    moveElemToP(editor);
  }

  isActive() {
    this._active = !!this.editor.cmd.queryCommandState('insertOrderedList');

    return this._active;
  }
}

export default Ol;
