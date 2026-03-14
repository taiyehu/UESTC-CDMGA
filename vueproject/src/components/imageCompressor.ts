import Compressor from 'compressorjs'

/**
 * 压缩图片到目标大小（优先2M，压不下则5M），质量尽量高
 * @param {File} file 原始图片文件
 * @param {number} targetSize 目标大小（字节），默认2M
 * @returns {Promise<File>} 压缩后的图片文件
 */
export function compressImage(file: Blob | File, targetSize = 2 * 1024 * 1024): Promise<File> {
  const inputFile: File = file instanceof File ? file : new File([file], 'image.jpg', { type: (file as Blob).type })
  const originalName = inputFile.name
  const originalSize = inputFile.size
  return new Promise<File>((resolve, reject) => {
    let quality = 0.9
    let tryCount = 0

    function doCompress(currentFile: File) {
      new Compressor(currentFile, {
        quality,
        convertSize: targetSize,
        success(result: any) {
          const outFile = result as File
          if (outFile.size <= targetSize) {
            console.log(
              `[compressImage] 压缩成功: ${originalName}, 原始大小: ${originalSize}, 压缩后: ${outFile.size}`
            )
            resolve(outFile)
          } else if (tryCount >= 2) {
            console.warn(
              `[compressImage] 压缩3次未达目标: ${originalName}, 原始大小: ${originalSize}, 最终: ${outFile.size}`
            )
            resolve(outFile)
          } else {
            quality -= 0.15
            tryCount++
            doCompress(result)
          }
        },
        error(err) {
          reject(err)
        },
      })
    }

    doCompress(inputFile)
  }).then((result: File) => {
    if ((result as File).size > 2 * 1024 * 1024 && targetSize === 2 * 1024 * 1024) {
      // 压到2M失败，尝试压到5M
      return compressImage(result, 5 * 1024 * 1024)
    }
    return result
  })
}
