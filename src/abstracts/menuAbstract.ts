import { JQ } from 'mdui.jq/es/JQ';
import Editor from '../index';
import CommonAbstract from './commonAbstract';

abstract class MenuAbstract extends CommonAbstract {
  /**
   * 按钮图标
   */
  static icon = '';

  /**
   * 按钮名称
   */
  static title = '';

  /**
   * 激活按钮时，需要禁用的其他按钮
   */
  static disable: string[] = [];

  /**
   * 按钮元素的 JQ 对象
   */
  public $button: JQ;

  /**
   * @param editor 编辑器实例
   * @param $button 按钮 JQ 对象
   */
  protected constructor(editor: Editor, $button: JQ) {
    super(editor);
    this.$button = $button;
  }

  /**
   * 点击按钮时
   */
  public abstract onclick(): void;

  /**
   * 按钮是否激活
   */
  public isActive(): boolean {
    return false;
  }
}

export default MenuAbstract;
