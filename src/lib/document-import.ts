import { LIMITS } from './workspace'

export type ImportTarget = 'agreement' | 'request'
export type ImportResult = { text: string; fileName: string; warnings: string[] }
const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_PDF_PAGES = 250
export const ACCEPTED_DOCUMENTS = '.pdf,.docx,.txt'

/** All parsing is client-side. Neither file bytes nor extracted text are uploaded. */
export async function importScopeDocument(file: File, target: ImportTarget): Promise<ImportResult> {
  const maxChars = LIMITS[target]
  if (!file || file.size === 0) throw new Error('That file is empty.')
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 12 MB. Please export a smaller document.')
  const suffix = file.name.toLowerCase().split('.').pop()
  if (!['txt', 'docx', 'pdf'].includes(suffix ?? '')) throw new Error('Choose a PDF, DOCX or plain-text (.txt) file.')
  let text = ''
  const warnings: string[] = []
  try {
    if (suffix === 'txt') {
      const bytes = await file.arrayBuffer()
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')
    } else if (suffix === 'docx') {
      const { default: mammoth } = await import('mammoth')
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      text = result.value
      if (result.messages.length) warnings.push('Word parser reported warnings. Review the extracted text carefully.')
      warnings.push('Word formatting, tracked changes, headers and embedded images may not appear in extracted text. Review it before analyzing.')
    } else {
      const pdfjs = await import('pdfjs-dist')
      const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
      const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise
      try {
        if (document.numPages > MAX_PDF_PAGES) throw new Error('PDF has more than 250 pages. Split the document and check all sections before analyzing.')
        const pagesWithoutText: number[] = []
        const pages: string[] = []
        let chars = 0
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
          const page = await document.getPage(pageNumber)
          const content = await page.getTextContent()
          let pageText = ''
          for (const item of content.items) {
            if ('str' in item) pageText += item.str + (item.hasEOL ? '\n' : ' ')
          }
          if (!pageText.trim()) pagesWithoutText.push(pageNumber)
          const cleanPage = pageText.trim()
          pages.push(cleanPage)
          chars += cleanPage.length + (pageNumber === 1 ? 0 : 2)
          if (chars > maxChars) throw new Error(`PDF extracted text exceeds ${maxChars.toLocaleString()} characters. No text was imported or truncated.`)
          page.cleanup()
        }
        text = pages.join('\n\n')
        if (pagesWithoutText.length) warnings.push(`${pagesWithoutText.length} PDF page(s) had no selectable text (e.g., ${pagesWithoutText.slice(0, 8).join(', ')}). Scanned pages need OCR; their contents were not analyzed.`)
        warnings.push('PDF tables/columns may read out of order. Review the extracted text against the original contract.')
      } finally {
        await document.destroy()
      }
    }
  } catch (error) {
    if (error instanceof Error && /characters|pages/.test(error.message)) throw error
    throw new Error(`Could not read ${suffix?.toUpperCase()} text. The file may be protected, malformed, or image-only. ${error instanceof Error ? error.message : ''}`.trim())
  }
  if (!text.trim()) throw new Error('No selectable text was found. An image-only or scanned document needs OCR before importing.')
  if (text.length > maxChars) throw new Error(`Extracted text is ${text.length.toLocaleString()} characters, above the ${maxChars.toLocaleString()} limit. No text was imported or truncated.`)
  return { text, fileName: file.name, warnings }
}
