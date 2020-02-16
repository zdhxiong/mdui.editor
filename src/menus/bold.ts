import MenuNativeAbstract from '../abstracts/menuNativeAbstract';

/**
 * 加粗
 */
class Bold extends MenuNativeAbstract {
  static icon = 'format_bold';
  static title = '粗体';
  static disable = ['image'];

  protected getCommandName(): string {
    return 'bold';
  }

  protected getElementName(): string {
    return 'strong';
  }
}

export default Bold;
