import $ from 'mdui.jq/es/$';
import each from 'mdui.jq/es/functions/each';
import unique from 'mdui.jq/es/functions/unique';
import PlainObject from 'mdui.jq/es/interfaces/PlainObject';
import 'mdui.jq/es/methods/addClass';
import 'mdui.jq/es/methods/append';
import 'mdui.jq/es/methods/appendTo';
import 'mdui.jq/es/methods/on';
import 'mdui.jq/es/methods/prop';
import 'mdui.jq/es/methods/removeClass';
import CommonAbstract from '../abstracts/commonAbstract';
import MenuAbstract from '../abstracts/menuAbstract';
import Editor from '../index';
import Bold from './bold';
import ClearDrafts from './clear_drafts';
import Code from './code';
import Head from './head';
import Image from './image';
import Italic from './italic';
import Link from './link';
import Ol from './ol';
import Ul from './ul';

const MenuConstructors: PlainObject = {
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

class Menus extends CommonAbstract {
  /**
   * { 按钮名称: 按钮实例 }
   */
  menus: { [name: string]: MenuAbstract } = {};

  public constructor(editor: Editor) {
    super(editor);
    this.init();
  }

  /**
   * 初始化菜单
   * @private
   */
  private init(): void {
    this.editor.options.menus!.forEach((name) => {
      // 插入分隔符
      if (name === '|') {
        this.$toolbar.append('<div class="mdui_editor-toolbar-divider"></div>');
        return;
      }

      // 插入 spacer
      if (name === ' ') {
        this.$toolbar.append('<div class="mdui-toolbar-spacer"></div>');
        return;
      }

      const MenuConstructor = MenuConstructors[name];

      if (!MenuConstructor || typeof MenuConstructor !== 'function') {
        return;
      }

      // 创建按钮
      const $button = $(
        `<button class="mdui-btn mdui_editor-toolbar-menu mdui_editor-toolbar-menu-${name}" type="button" title="${MenuConstructor.title}">` +
          `<i class="mdui-icon material-icons">${MenuConstructor.icon}</i>` +
          '</button>',
      ).appendTo(this.$toolbar);

      // 实例化菜单项
      const menu = new MenuConstructor(this.editor, $button) as MenuAbstract;
      this.menus[name] = menu;

      const onClick = (): void => {
        if (this.selection.getRange() === null) {
          return;
        }

        menu.onclick();
      };

      $button.on('click', onClick);
    });
  }

  /**
   * 修改菜单按钮状态
   */
  public changeStatus(): void {
    let disableMenus: string[] = [];

    each(this.menus, (name: string, menu) => {
      setTimeout(() => {
        // 切换激活状态
        if (menu.isActive()) {
          menu.$button.addClass('mdui_editor-toolbar-menu-active');

          if (MenuConstructors[name].disable) {
            disableMenus = disableMenus.concat(MenuConstructors[name].disable);
          }
        } else {
          menu.$button.removeClass('mdui_editor-toolbar-menu-active');
        }

        // 禁用按钮，遍历到最后一个按钮再统一处理
        if (
          name ===
          this.editor.options.menus![this.editor.options.menus!.length - 1]
        ) {
          disableMenus = unique(disableMenus);

          each(this.menus, (name: string, menu) => {
            menu.$button.prop('disabled', disableMenus.indexOf(name) > -1);
          });
        }
      }, 0);
    });
  }
}

export default Menus;
