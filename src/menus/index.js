import { JQ as $ } from 'mdui';
import Bold from './bold';
import Italic from './italic';
import Head from './head';
import Code from './code';
import Ol from './ol';
import Ul from './ul';
import Link from './link';
import Image from './image';
import ClearDrafts from './clear_drafts';

const MenuConstructors = {
  bold: Bold,
  clear_drafts: ClearDrafts,
  code: Code,
  head: Head,
  image: Image,
  italic: Italic,
  link: Link,
  ol: Ol,
  ul: Ul,
};

class Menus {
  constructor(editor) {
    this.editor = editor;
    this.menus = {};
    this._init();
  }

  /**
   * 初始化菜单
   * @private
   */
  _init() {
    const { editor } = this;
    const { selection, $toolbar } = editor;

    editor.options.menus.forEach((name) => {
      // 插入分隔符
      if (name === '|') {
        $toolbar.append($('<div class="mduiEditor-toolbar-divider"></div>'));
        return;
      }

      // 插入 spacer
      if (name === ' ') {
        $toolbar.append($('<div class="mdui-toolbar-spacer"></div>'));
        return;
      }

      const MenuConstructor = MenuConstructors[name];

      if (!MenuConstructor || typeof MenuConstructor !== 'function') {
        return;
      }

      // 实例化按钮
      const menu = new MenuConstructor(editor);
      this.menus[name] = menu;

      const onClick = () => {
        if (selection.getRange() === null) {
          return;
        }

        menu.onclick();
      };

      // 添加到工具栏
      menu.$button = $(`<button class="mdui-btn mduiEditor-toolbar-menu mduiEditor-toolbar-menu-${name}" type="button" title="${menu.title}"><i class="mdui-icon material-icons">${menu.icon}</i></button>`)
        .appendTo($toolbar)
        .on('click', onClick);
    });
  }

  /**
   * 修改菜单按钮状态
   */
  changeStatus() {
    const { editor } = this;
    let disableMenus = [];

    $.each(this.menus, (name, menu) => {
      setTimeout(() => {
        // 切换激活状态
        if (menu.isActive) {
          if (menu.isActive()) {
            menu.$button.addClass('mduiEditor-toolbar-menu-active');

            if (menu.disable) {
              disableMenus = disableMenus.concat(menu.disable);
            }
          } else {
            menu.$button.removeClass('mduiEditor-toolbar-menu-active');
          }
        }

        // 禁用按钮，遍历到最后一个按钮再统一处理
        if (name === editor.options.menus[editor.options.menus.length - 1]) {
          disableMenus = $.unique(disableMenus);

          $.each(this.menus, (_name, _menu) => {
            _menu.$button.prop('disabled', disableMenus.indexOf(_name) > -1);
          });
        }
      }, 0);
    });
  }
}

export default Menus;
