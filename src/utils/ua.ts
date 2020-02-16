/**
 * 是否是 webkit 浏览器
 */
export function isWebkit(): boolean {
  return /webkit/i.test(navigator.userAgent);
}
