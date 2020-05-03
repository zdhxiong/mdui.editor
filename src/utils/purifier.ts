/**
 * 净化器
 */
export function purifier(html: string): string {
  let result = '';

  // todo 目前直接返回用每一行都用 p 标签包裹的 html，后续开发根据白名单进行过滤
  html.split('\n').forEach((line) => {
    // 移除行内的换行符
    line = line.replace(/[\r\n]/gm, '');

    result += line ? `<p>${line}</p>` : '<p><br></p>';
  });

  return result;
}
