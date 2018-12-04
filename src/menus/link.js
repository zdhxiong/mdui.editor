import mdui from 'mdui';
import { correctUrl } from '../helper/utils';

/**
 * 添加链接
 */
class Link {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'link';
    this.title = '插入链接';
    this.disable = ['image'];
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd } = editor;
    const $curElem = selection.getContainerElem();
    let defaultUrl = '';

    if ($curElem.is('a')) {
      // 当前选区为 a 元素，则选中整个 a 元素
      selection.createRangeByElem($curElem, null, true);
      defaultUrl = $curElem.attr('href');
    }

    const onConfirm = (url) => {
      if (url) {
        // 链接不为空，添加链接
        cmd.do('createLink', correctUrl(url));
      } else {
        // 链接为空，移除链接
        cmd.do('unlink');
      }
    };

    const promptOptions = {
      confirmText: '确认',
      cancelText: '取消',
      defaultValue: defaultUrl,
    };

    mdui.prompt('请输入链接地址', onConfirm, false, promptOptions);
  }

  isActive() {
    this._active = this.editor.selection.getContainerElem().is('a');

    return this._active;
  }
}

export default Link;
