/**
 * 格式化内存大小
 * @param memory
 */
export function memoryFormat(memory: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let pos = 0;

  while (memory >= 1024) {
    memory /= 1024;
    pos++;
  }

  return memory.toFixed(2) + units[pos];
}
