const crypto=require('node:crypto');

// Bump this when changing encoder settings, so an old cached URL never serves new bytes.
const RECIPE='webp-full-q82-thumb-400-q80-v1';
function imageNames(id,pngBytes){
  const hash=crypto.createHash('sha256').update(RECIPE).update(pngBytes).digest('hex').slice(0,12);
  return {full:`${id}.${hash}.webp`,thumb:`${id}.${hash}.thumb.webp`};
}
module.exports={imageNames};
