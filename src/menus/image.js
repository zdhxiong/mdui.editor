import mdui from 'mdui';
import { correctUrl } from '../helper/utils';

/**
 * 图片
 */
class Image {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'image';
    this.title = '插入图片';
    this._init();
  }

  _init() {
    const { editor } = this;
    const { selection, cmd, $content } = editor;

    $content.on('keydown', (event) => {
      const { keyCode } = event;

      selection.saveRange();

      const $curElem = selection.getContainerElem();

      if (keyCode === 8 || keyCode === 46) {
        if ($curElem.is('figcaption')) {
          // 在 figcaption 元素中按删除键时，若该元素内容为空，则不删除
          const html = $curElem.html().toLowerCase().trim();

          if (!html || html === '<br>' || html === '<br/>') {
            $curElem.html('');

            event.preventDefault();
          }
        }
      }

      if ($curElem.is('figure')) {
        if (keyCode === 8 || keyCode === 46) {
          // 删除图片时，删除 figure 元素，并聚焦到下一行
          selection.createRangeByElem($curElem.next());
          $curElem.remove();
          selection.restore();
        }

        event.preventDefault();
      }

      if (keyCode === 13) {
        // 在 figcaption 中按回车键时，跳出图片元素，聚焦到下一个 root 元素
        if ($curElem.is('figcaption')) {
          const $nextElem = selection.getRootElem().next();

          if (!$nextElem.length) {
            // 没有下一个元素，新增一行
            cmd.do('insertAfterRoot', '<p><br></p>');
          } else {
            // 有下一个元素，聚焦到下一行
            selection.createRangeByElem($nextElem);
            selection.restore();
          }

          event.preventDefault();
        }
      }
    });

    $content.on('keyup', (event) => {
      const { keyCode } = event;
      const $curElem = selection.getContainerElem();

      if (keyCode === 8 || keyCode === 46) {
        // 在 figcaption 中删除时，若该元素不含文字，则清空该元素
        if ($curElem.is('figcaption')) {
          const html = $curElem.html().toLowerCase().trim();

          if (!html || html === '<br>' || html === '<br/>') {
            $curElem.html('');
          }
        }
      }
    });
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd } = editor;

    const onConfirm = (url) => {
      if (!url) {
        return;
      }

      const $rootElem = selection.getRootElem();
      const rootHTML = $rootElem.html().toLowerCase().trim();
      const imgHTML = `<figure><img src="${correctUrl(url)}"/><figcaption placeholder="图片描述（选填）"></figcaption></figure>`;

      if ($rootElem[0].nodeName === 'P' && (rootHTML === '<br>' || rootHTML === '<br/>')) {
        // 当前为空的 p 元素，替换该元素
        cmd.do('replaceRoot', imgHTML);
      } else {
        // 当前不是空的 p 元素，在当前元素后面插入图片
        cmd.do('insertAfterRoot', imgHTML);
      }

      // 在图片下面重新插入一行，并聚焦
      cmd.do('insertAfterRoot', '<p><br></p>');
    };

    const promptOptions = {
      confirmText: '确认',
      cancelText: '取消',
    };

    mdui.prompt('请输入图片链接', onConfirm, false, promptOptions);
  }
}

export default Image;
