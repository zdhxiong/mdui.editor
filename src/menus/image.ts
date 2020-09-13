import $ from 'mdui.jq/es/$';
import ajax from 'mdui.jq/es/functions/ajax';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/find';
import 'mdui.jq/es/methods/html';
import 'mdui.jq/es/methods/insertAfter';
import 'mdui.jq/es/methods/is';
import 'mdui.jq/es/methods/next';
import 'mdui.jq/es/methods/on';
import 'mdui.jq/es/methods/remove';
import 'mdui.jq/es/methods/val';
import 'mdui.jq/es/methods/trigger';
import 'mdui/es/components/dialog/alert';
import { Dialog } from 'mdui/es/components/dialog/class';
import 'mdui/es/components/dialog/dialog';
import mdui from 'mdui/es/mdui';
import 'mdui/es/jq_extends/static/guid';
import MenuAbstract from '../abstracts/menuAbstract';
import Editor from '../index';
import { memoryFormat } from '../utils/format';

class Image extends MenuAbstract {
  static icon = 'image';
  static title = '插入图片';

  /**
   * <input type="file"/> 元素
   */
  private $input: JQ = $();

  /**
   * <input type="file"/> 元素的 ID
   */
  private inputID: string = $.guid();

  /**
   * 允许上传的图片后缀
   */
  private suffixs: string[] = [];

  /**
   * 允许上传的图片格式
   */
  private accepts: string[] = [];

  public constructor(editor: Editor, $button: JQ) {
    super(editor, $button);

    this.setAccepts();
    this.setInput();
    this.bindInputChange();
    this.bindKeyboardEvent();
  }

  private bindKeyboardEvent(): void {
    this.$container.on('keydown', (event) => {
      const keyCode = (event as KeyboardEvent).keyCode;

      this.selection.saveRange();

      const $curElem = this.selection.getContainerElem();

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
          this.selection.createRangeByElem($curElem.next());
          $curElem.remove();
          this.selection.restore();
        }

        event.preventDefault();
      }

      if (keyCode === 13) {
        // 在 figcaption 中按回车键时，跳出图片元素，聚焦到下一个 root 元素
        if ($curElem.is('figcaption')) {
          const $nextElem = this.selection.getRootElem().next();

          if (!$nextElem.length) {
            // 没有下一个元素，新增一行
            this.command.do('insertAfterRoot', '<p><br></p>');
          } else {
            // 有下一个元素，聚焦到下一行
            this.selection.createRangeByElem($nextElem);
            this.selection.restore();
          }

          event.preventDefault();
        }
      }
    });

    this.$container.on('keyup', (event) => {
      const keyCode = (event as KeyboardEvent).keyCode;
      const $curElem = this.selection.getContainerElem();

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

  /**
   * 设置允许上传的图片类型
   */
  private setAccepts(): void {
    this.suffixs = this.editor.options.imageUploadSuffix!;
    const map: { [name: string]: string } = {
      png: 'image/png',
      jpg: 'image/jpeg',
      gif: 'image/gif',
    };

    this.accepts = this.suffixs.map((suffix) => map[suffix]);
  }

  /**
   * 在按钮后面插入 <input type="file"/> 元素
   */
  private setInput(): void {
    this.$input = $(
      `<input type="file" id="${this.inputID}" name="${
        this.editor.options.imageUploadName
      }" accept="${this.accepts.join(', ')}"/>`,
    ).insertAfter(this.$button);
  }

  /**
   * 选择文件后触发的事件
   */
  private bindInputChange(): void {
    this.$input.on('change', (event) => {
      // @ts-ignore
      const files = event.target.files as FileList;

      if (!files.length) {
        return;
      }

      this.upload(files[0]);
      this.$input.val('');
    });
  }

  /**
   * 执行上传
   * @param file
   */
  private upload(file: File): void {
    if (this.accepts.indexOf(file.type) < 0) {
      mdui.alert(`仅允许上传 ${this.suffixs.join(', ')} 格式的图片`);

      return;
    }

    if (
      this.editor.options.imageUploadMaxSize! &&
      file.size > this.editor.options.imageUploadMaxSize!
    ) {
      mdui.alert(
        `图片体积不能超过 ${memoryFormat(
          this.editor.options.imageUploadMaxSize!,
        )}`,
      );

      return;
    }

    const formData = new FormData();
    formData.append(this.editor.options.imageUploadName!, file);

    let loadingDialog: Dialog;
    let uploadTime: number;
    let uploadTimeInterval: any;

    ajax({
      url: this.editor.options.imageUploadUrl!,
      method: 'POST',
      data: formData,
      processData: false,
      dataType: 'json',
      contentType: false,
      global: false,
      beforeSend: (xhr) => {
        uploadTime = 0;
        uploadTimeInterval = setInterval(() => (uploadTime += 100), 100);

        loadingDialog = mdui.dialog({
          title: '上传中…',
          content: '<p class="mdui_editor-upload-progress">0%</p>',
          history: false,
          modal: true,
          cssClass: 'mdui_editor-upload-progress-dialog',
        });

        const $progress = loadingDialog.$element.find(
          '.mdui_editor-upload-progress',
        );

        xhr.upload.onprogress = (event): void => {
          // @ts-ignore
          $progress.html(`${((event.loaded / event.total) * 100).toFixed(0)}%`);
        };
      },
      complete: () => {
        clearInterval(uploadTimeInterval);

        if (uploadTime < 500) {
          setTimeout(() => {
            loadingDialog.close();
          }, 500 - uploadTime);
        } else {
          loadingDialog.close();
        }
      },
    })
      .then((response) => {
        if (this.editor.options.imageUploadResponseTransform) {
          response = this.editor.options.imageUploadResponseTransform(response);
        }

        if (response.code) {
          mdui.alert(response.message);
          return;
        }

        const $rootElem = this.selection.getRootElem();
        const rootHTML = $rootElem.html().toLowerCase().trim();
        const imgHTML = `<figure><img src="${response.data.url}"/><figcaption placeholder="图片描述（选填）"></figcaption></figure>`;

        if (
          $rootElem[0].nodeName === 'P' &&
          (rootHTML === '<br>' || rootHTML === '<br/>')
        ) {
          // 当前为空的 p 元素，替换该元素
          this.command.do('replaceRoot', imgHTML);
        } else {
          // 当前不是空的 p 元素，在当前元素后面插入图片
          this.command.do('insertAfterRoot', imgHTML);
        }

        // 在图片下面重新插入一行，并聚焦
        this.command.do('insertAfterRoot', '<p><br></p>');
      })
      .catch(() => mdui.alert('图片上传失败'));
  }

  public onclick(): void {
    $(`#${this.inputID}`).trigger('click');
  }
}

export default Image;
