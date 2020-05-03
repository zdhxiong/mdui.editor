import 'mdui.jq/es/methods/after';
import 'mdui.jq/es/methods/attr';
import 'mdui.jq/es/methods/find';
import 'mdui.jq/es/methods/is';
import { returnFalse } from 'mdui.jq/es/utils';
import 'mdui/es/components/dialog/prompt';
import 'mdui/es/components/textfield';
import mdui from 'mdui/es/mdui';
import MenuAbstract from '../abstracts/menuAbstract';

/**
 * 添加链接
 */
class Link extends MenuAbstract {
  static icon = 'link';
  static title = '插入链接';
  static disable = ['image'];

  public onclick(): void {
    const $curElem = this.selection.getContainerElem();
    let defaultUrl = '';

    if ($curElem.is('a')) {
      // 当前选区为 a 元素，则选中整个 a 元素
      this.selection.createRangeByElem($curElem, false, true);
      defaultUrl = $curElem.attr('href') || '';
    }

    const dialog = mdui.prompt(
      '请输入链接地址',
      (url, dialog): void => {
        if (!url) {
          // 链接为空，移除链接
          this.command.do('unlink');
          dialog.close();
          return;
        }

        const input = dialog.$element.find(
          '.mdui-textfield-input',
        )[0] as HTMLInputElement;

        if (input.validity && input.validity.valid) {
          this.command.do('createLink', url);
          dialog.close();
          return;
        }
      },
      returnFalse,
      {
        confirmText: '确认',
        cancelText: '取消',
        defaultValue: defaultUrl,
        confirmOnEnter: true,
        closeOnConfirm: false,
      },
    );

    dialog.$element
      .find('.mdui-textfield-input')
      .attr('type', 'text')
      .attr('pattern', '^(https?|ftp|file)://[\\S]+\\.[\\S]+$')
      .after('<div class="mdui-textfield-error">链接格式错误</div>');

    mdui.updateTextFields(dialog.$element.find('.mdui-textfield'));
    dialog.handleUpdate();
  }

  public isActive(): boolean {
    return this.selection.getContainerElem().is('a');
  }
}

export default Link;
