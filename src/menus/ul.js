import { moveListToRoot, moveElemToP } from '../helper/utils';

/**
 * 无序列表
 */
class Ul {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'format_list_bulleted';
    this.title = '无序列表';
    this.disable = ['head', 'code', 'image'];
    this._active = false;
  }

  onclick() {
    const { editor } = this;

    editor.cmd.do('insertUnorderedList');

    moveListToRoot(editor.$content.find('ul'), editor);
    moveElemToP(editor);
  }

  isActive() {
    this._active = !!this.editor.cmd.queryCommandState('insertUnOrderedList');

    return this._active;
  }
}

export default Ul;
