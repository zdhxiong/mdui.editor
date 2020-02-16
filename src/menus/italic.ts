import MenuNativeAbstract from '../abstracts/menuNativeAbstract';

/**
 * 斜体
 */
class Italic extends MenuNativeAbstract {
  static icon = 'format_italic';
  static title = '斜体';
  static disable = ['image'];

  protected getCommandName(): string {
    return 'italic';
  }

  protected getElementName(): string {
    return 'em';
  }
}

export default Italic;
