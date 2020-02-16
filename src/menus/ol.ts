import 'mdui.jq/es/methods/find';
import MenuListAbstract from '../abstracts/menuListAbstract';

/**
 * 有序列表
 */
class Ol extends MenuListAbstract {
  static icon = 'format_list_numbered';
  static title = '有序列表';

  protected getName(): string {
    return 'ol';
  }
}

export default Ol;
