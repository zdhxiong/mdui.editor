/**
 * 替换 html 特殊字符
 * @param html
 */
export function replaceHtmlSymbol(html = ''): string {
  return html
    .replace(/</gm, '&lt;')
    .replace(/>/gm, '&gt;')
    .replace(/"/gm, '&quot;');
}
