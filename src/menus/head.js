import { replaceHtmlSymbol } from '../helper/utils';

/**
 * 标题
 */
class Head {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'title';
    this.title = '标题';
    this.disable = ['bold', 'italic', 'image'];
    this._active = false;
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd } = editor;
    const $rootElem = selection.getRootElem();

    if (this._active) {
      // 若当前是 h2，则转换为 p
      const text = $rootElem.text();
      cmd.do('replaceRoot', text ? `<p>${text}</p>` : '<p><br></p>');

      return;
    }

    if (!$rootElem.length) {
      const range = selection.getRange();

      if (range.collapsed) {
        // 没有选中任何选区，在最后添加一行
        cmd.do('appendHTML', '<h2><br></h2>');
      } else {
        // 选中了多行，不处理
      }

      return;
    }

    // 选中单行，需要移除选区内所有子元素的标签，然后转换为 h2
    cmd.do('replaceRoot', `<h2>${replaceHtmlSymbol($rootElem.text())}</h2>`);
  }

  isActive() {
    this._active = this.editor.selection.getRootElem().is('h2');

    return this._active;
  }
}

export default Head;
