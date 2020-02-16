import 'mdui.jq/es/methods/find';
import MenuListAbstract from '../abstracts/menuListAbstract';

/**
 * 无序列表
 */
class Ul extends MenuListAbstract {
  static icon = 'format_list_bulleted';
  static title = '无序列表';

  protected getName(): string {
    return 'ul';
  }
}

export default Ul;
