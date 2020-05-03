import $ from 'mdui.jq/es/$';
import { JQ } from 'mdui.jq/es/JQ';
import 'mdui.jq/es/methods/add';
import 'mdui.jq/es/methods/children';
import 'mdui.jq/es/methods/each';
import 'mdui.jq/es/methods/is';
import 'mdui.jq/es/methods/last';
import 'mdui.jq/es/methods/on';
import 'mdui.jq/es/methods/remove';
import 'mdui.jq/es/methods/text';
import MenuAbstract from '../abstracts/menuAbstract';
import Editor from '../index';
import { replaceHtmlSymbol } from '../utils/str';

/**
 * 代码块
 */
class Code extends MenuAbstract {
  static icon = 'code';
  static title = '代码块';
  static disable = ['bold', 'italic', 'head', 'ol', 'ul', 'link', 'image'];
  private active = false;

  public constructor(editor: Editor, $button: JQ) {
    super(editor, $button);
    this.init();
  }

  private init(): void {
    this.$container.on('keydown', (event) => {
      if ((event as KeyboardEvent).keyCode === 13) {
        // 按回车时，添加 \n
        if (this.active) {
          event.preventDefault();

          const startOffset = this.selection.getRange()!.startOffset;

          this.command.do('insertHTML', '\n');
          this.selection.saveRange();

          if (this.selection.getRange()!.startOffset === startOffset) {
            // 没起作用，再来一次
            this.command.do('insertHTML', '\n');
          }

          // 换行后滚动条回到最左侧
          this.selection.getContainerElem()[0].scrollLeft = 0;
        }
      }

      if ((event as KeyboardEvent).keyCode === 9) {
        // 按 tab 时，添加四个空格
        if (this.active) {
          event.preventDefault();
          this.command.do('insertHTML', '    ');
        }
      }
    });
  }

  public onclick(): void {
    const $rootElem = this.selection.getRootElem();

    if (this.active) {
      // 若当前是代码块，则每一行都转换为 p 标签
      const textArray = $rootElem.text().split('\n');
      let html = '';

      textArray.forEach((line) => {
        line = replaceHtmlSymbol(line);
        html = line ? `<p>${line}</p>${html}` : `<p><br></p>${html}`;
      });

      this.command.do('replaceRoot', html);

      return;
    }

    if (!$rootElem.length) {
      const range = this.selection.getRange()!;

      if (range.collapsed) {
        // 没有选中任何选区，在最后添加一行
        this.command.do('appendHTML', '<pre><code><br></code></pre>');
      } else {
        // 选中了多行，把多行包裹在同一个 pre 中
        let text = '';
        let isInRange = false;
        let $linesRemove = $();

        this.$container.children().each((_, line) => {
          const $line = $(line);

          if (!isInRange) {
            if (
              $line.is(range.startContainer as HTMLElement) ||
              $line[0].contains(range.startContainer) ||
              this.$container.is(range.startContainer as HTMLElement)
            ) {
              isInRange = true;
            }
          }

          if (isInRange) {
            text += `${replaceHtmlSymbol($line.text())}\n`;
            $linesRemove = $linesRemove.add($line);

            if (
              $line.is(range.endContainer as HTMLElement) ||
              $line[0].contains(range.endContainer)
            ) {
              return false;
            }
          }

          return true;
        });

        $linesRemove.each((i, line) => {
          const $line = $(line);
          if (i < $linesRemove.length - 1) {
            $line.remove();
          }
        });

        this.selection.createRangeByElem($linesRemove.last(), false, true);
        this.command.do('replaceRoot', `<pre><code>${text}</code></pre>`);
      }

      return;
    }

    // 选中单行，需要移除选区内容所有子元素的标签，然后转换为 pre
    const text = replaceHtmlSymbol($rootElem.text());
    this.command.do(
      'replaceRoot',
      text ? `<pre><code>${text}</code></pre>` : '<pre><code><br></code></pre>',
    );
  }

  public isActive(): boolean {
    this.active = this.selection.getRootElem().is('pre');

    return this.active;
  }
}

export default Code;
