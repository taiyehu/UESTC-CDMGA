import Compressor from 'compressorjs'

/**
 * 压缩图片到目标大小（优先1M，压不下则3M），质量尽量高
 * @param {File} file 原始图片文件
 * @param {number} [targetSize=1024*1024] 目标大小（字节），默认1M
 * @returns {Promise<File>} 压缩后的图片文件
 */
export function compressImage(file, targetSize = 1024 * 1024) {
  const originalName = file.name
  const originalSize = file.size
  return new Promise((resolve, reject) => {
    let quality = 0.9
    let tryCount = 0

    function doCompress(currentFile) {
      new Compressor(currentFile, {
        quality,
        convertSize: targetSize,
        success(result) {
          if (result.size <= targetSize) {
            console.log(`[compressImage] 压缩成功: ${originalName}, 原始大小: ${originalSize}, 压缩后: ${result.size}`)
            resolve(result)
          } else if (tryCount >= 2) {
            console.warn(`[compressImage] 压缩3次未达目标: ${originalName}, 原始大小: ${originalSize}, 最终: ${result.size}`)
            resolve(result)
          } else {
            quality -= 0.15
            tryCount++
            doCompress(result)
          }
        },
        error(err) {
          reject(err)
        }
      })
    }

    doCompress(file)
  }).then(result => {
    if (result.size > 1024 * 1024 && targetSize === 1024 * 1024) {
      // 压到1M失败，尝试压到3M
      return compressImage(result, 3 * 1024 * 1024)
    }
    return result
  })
}
