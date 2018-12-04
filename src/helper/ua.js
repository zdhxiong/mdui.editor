/**
 * UserAgent 判断
 */
class UA {
  /**
   * 是否是 Webkit
   * @returns {boolean}
   */
  static isWebkit() {
    const reg = /webkit/i;

    return reg.test(navigator.userAgent);
  }

  /**
   * 是否是 IE
   * @returns {boolean}
   */
  static isIE() {
    return 'ActiveXObject' in window;
  }
}

export default UA;
