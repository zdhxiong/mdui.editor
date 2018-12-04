import { JQ as $ } from 'mdui';

/**
 * 替换 html 特殊字符
 * @param html
 * @returns {string}
 */
export function replaceHtmlSymbol(html) {
  if (html === null) {
    return '';
  }

  return html
    .replace(/</gm, '&lt;')
    .replace(/>/gm, '&gt;')
    .replace(/"/gm, '&quot;');
}

/**
 * 为链接补充 http:// 前缀
 * @param url
 * @returns {string}
 */
export function correctUrl(url) {
  url = url.toLowerCase();

  if (
    url.indexOf('http://') < 0
    && url.indexOf('https://') < 0
    && url.indexOf('ftp://') < 0
    && url.indexOf('//') < 0
  ) {
    url = `http://${url}`;
  }

  return url;
}

/**
 * 获取剪贴板数据
 * @param e
 * @returns Object
 */
function getPasteData(e) {
  const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
  let pasteText;
  let pasteHtml;

  if (clipboardData === null) {
    pasteText = window.clipboardData && window.clipboardData.getData('text');
  } else {
    pasteText = clipboardData.getData('text/plain');
    pasteHtml = clipboardData.getData('text/html');
  }

  return { pasteText, pasteHtml };
}

/**
 * 获取粘贴的 HTML
 * @param e
 * @returns {string}
 */
export function getPasteHTML(e) {
  let { pasteText, pasteHtml } = getPasteData(e);

  if (!pasteHtml && pasteText) {
    pasteText = replaceHtmlSymbol(pasteText);
    pasteHtml = pasteText ? `<p>${pasteText}</p>` : '<p><br></p>';
  }

  return pasteHtml;
}

/**
 * 获取粘贴的纯文本
 * @param e
 * @returns {string}
 */
export function getPasteText(e) {
  const { pasteText } = getPasteData(e);

  return replaceHtmlSymbol(pasteText);
}

/**
 * 验证列表是否被包裹在 <p> 之内，因为可能同时操作多个列表，所以检查所有列表
 * @param $list
 * @param editor
 */
export function moveListToRoot($list, editor) {
  $list.each((i, ol) => {
    const $ol = $(ol);
    const $parent = $ol.parent();

    if ($parent.is(editor.$content)) {
      return;
    }

    editor.selection.createRangeByElem($parent, false, true);
    editor.cmd.do('replaceRoot', ol);
  });
}

/**
 * 把纯文本、b、strong、i、em、a 标签包裹的元素移到 p 标签中，移除 br 标签
 * @param editor
 */
export function moveElemToP(editor) {
  const { selection, cmd } = editor;

  $(editor.$content[0].childNodes).each((i, curElem) => {
    const $curElem = $(curElem);
    const {
      nodeType,
      nodeName,
      nodeValue,
      outerHTML,
    } = curElem;

    if (nodeType === 3) {
      // 纯文本，移动到 p 标签中
      selection.createRangeByElem($curElem.prev(), false, true);
      cmd.do('insertAfterRoot', nodeValue ? `<p>${nodeValue}</p>` : '<p><br></p>');
      $curElem.remove();

      return;
    }

    if (nodeType !== 1) {
      // 不是普通 DOM 节点，跳过
      return;
    }

    if (['B', 'STRONG', 'I', 'EM', 'A'].indexOf(nodeName) > -1) {
      // 移动到 p 标签中
      selection.createRangeByElem($curElem, false, true);
      cmd.do('replaceRoot', outerHTML ? `<p>${outerHTML}</p>` : '<p><br></p>');

      return;
    }

    if (nodeName === 'BR') {
      // 移除 br 元素
      $curElem.remove();
    }
  });
}
