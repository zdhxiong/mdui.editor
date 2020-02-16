import { replaceHtmlSymbol } from './str';

type ClipboardResult = {
  /**
   * 纯文本内容
   */
  pasteText: string;

  /**
   * 含 HTML 的内容
   */
  pasteHtml: string;
};

/**
 * 获取剪贴板数据
 * @param event
 */
function getPasteData(event: ClipboardEvent): ClipboardResult {
  const clipboardData =
    event.clipboardData ||
    // @ts-ignore
    (event.originalEvent && event.originalEvent.clipboardData);

  let pasteText = '';
  let pasteHtml = '';

  if (clipboardData === null) {
    // @ts-ignore
    pasteText = window.clipboardData && window.clipboardData.getData('text');
  } else {
    pasteText = clipboardData.getData('text/plain');
    pasteHtml = clipboardData.getData('text/html');
  }

  return { pasteText, pasteHtml };
}

/**
 * 获取粘贴的 HTML
 * @param event
 */
export function getPasteHTML(event: ClipboardEvent): string {
  let { pasteText, pasteHtml } = getPasteData(event);

  if (!pasteHtml && pasteText) {
    pasteText = replaceHtmlSymbol(pasteText);
    pasteHtml = pasteText ? `<p>${pasteText}</p>` : '<p><br></p>';
  }

  return pasteHtml;
}

/**
 * 获取粘贴的纯文本
 * @param event
 */
export function getPasteText(event: ClipboardEvent): string {
  const { pasteText } = getPasteData(event);

  return replaceHtmlSymbol(pasteText);
}
