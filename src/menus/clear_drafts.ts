import { returnFalse } from 'mdui.jq/es/utils';
import 'mdui/es/components/dialog/confirm';
import mdui from 'mdui/es/mdui';
import MenuAbstract from '../abstracts/menuAbstract';

/**
 * 舍弃草稿
 */
class ClearDrafts extends MenuAbstract {
  static icon = 'delete';
  static title = '舍弃草稿';

  public onclick(): void {
    mdui.confirm(
      '确定要清空内容？',
      () => {
        const options = this.editor.options;

        this.editor.setHTML('');

        if (options.autoSave) {
          window.localStorage.removeItem(options.autoSaveKey!);
          options.onClearDrafts!();
        }
      },
      returnFalse,
      {
        confirmText: '确定',
        cancelText: '取消',
      },
    );
  }
}

export default ClearDrafts;
