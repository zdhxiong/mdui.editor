import { JQ } from 'mdui.jq/es/JQ';
import Command from '../command/index';
import Editor from '../index';
import Selection from '../selection/index';

abstract class CommonAbstract {
  /**
   * 编辑器实例
   */
  protected editor: Editor;

  /**
   * @param editor 编辑器实例
   */
  public constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * 工具栏 JQ 对象
   */
  get $toolbar(): JQ {
    return this.editor.$toolbar;
  }

  /**
   * 内容区域 JQ 对象
   */
  get $container(): JQ {
    return this.editor.$container;
  }

  /**
   * 选区实例
   */
  get selection(): Selection {
    return this.editor.selection;
  }

  /**
   * 命令实例
   */
  get command(): Command {
    return this.editor.command;
  }
}

export default CommonAbstract;
