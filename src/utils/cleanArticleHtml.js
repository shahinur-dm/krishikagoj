/** Normalize editor HTML for Bangla wrapping. Does not change visible words. */
export function cleanArticleHtml(html = '') {
  return String(html)
    .replace(/\u00AD/g, '')
    .replace(/\u200B/g, '')
    .replace(/\u2060/g, '')
    .replace(/&shy;/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\u2007/g, ' ')
    .replace(/white-space\s*:\s*nowrap/gi, 'white-space:normal')
    .replace(/word-break\s*:\s*break-all/gi, 'word-break:normal')
    .replace(/overflow-wrap\s*:\s*anywhere/gi, 'overflow-wrap:break-word')
    .replace(/\smin-width\s*:\s*\d+px/gi, '')
    .replace(/<(img|video|iframe|embed|object)([^>]*?)>/gi, (match, tag, attrs) => {
      const cleaned = attrs
        .replace(/\swidth\s*=\s*["']?\d+["']?/gi, '')
        .replace(/\sheight\s*=\s*["']?\d+["']?/gi, '')
      return `<${tag}${cleaned}>`
    })
}
