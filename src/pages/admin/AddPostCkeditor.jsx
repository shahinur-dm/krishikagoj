import { useEffect, useRef, useState } from 'react'
import EditorImageDialog from '../../components/admin/EditorImageDialog'
import EditorLinkDialog from '../../components/admin/EditorLinkDialog'

const EDITOR_URL = 'https://cdn.ckeditor.com/4.22.1/full-all/ckeditor.js'

const FULL_TOOLBAR = [
  {
    name: 'document',
    items: ['Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates'],
  },
  {
    name: 'clipboard',
    items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
  },
  { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
  {
    name: 'forms',
    items: ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],
  },
  '/',
  {
    name: 'basicstyles',
    items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'],
  },
  {
    name: 'paragraph',
    items: [
      'NumberedList',
      'BulletedList',
      '-',
      'Outdent',
      'Indent',
      '-',
      'Blockquote',
      'CreateDiv',
      '-',
      'JustifyLeft',
      'JustifyCenter',
      'JustifyRight',
      'JustifyBlock',
      '-',
      'BidiLtr',
      'BidiRtl',
    ],
  },
  { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
  {
    name: 'insert',
    items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'],
  },
  '/',
  { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
  { name: 'colors', items: ['TextColor', 'BGColor'] },
  { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
  { name: 'about', items: ['About'] },
]

let loadPromise

function loadCkeditor() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.CKEDITOR) return Promise.resolve(window.CKEDITOR)
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-anp-ckeditor]')
    if (existing) {
      if (window.CKEDITOR) {
        resolve(window.CKEDITOR)
        return
      }
      existing.addEventListener('load', () => resolve(window.CKEDITOR), { once: true })
      existing.addEventListener('error', () => reject(new Error('CKEditor failed to load')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = EDITOR_URL
    script.async = true
    script.dataset.anpCkeditor = '1'
    script.onload = () => resolve(window.CKEDITOR)
    script.onerror = () => reject(new Error('CKEditor failed to load'))
    document.body.appendChild(script)
  })
  return loadPromise
}

export default function AddPostCkeditor({ value, onChange }) {
  const hostRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const skipRef = useRef(false)
  const instanceRef = useRef(null)
  const valueRef = useRef(value)

  const activeBookmarksRef = useRef(null)
  const activeElementRef = useRef(null)

  const [imageDialog, setImageDialog] = useState({
    open: false,
    initialUrl: '',
    initialAlt: '',
    initialCaption: '',
    isEdit: false,
  })

  const [linkDialog, setLinkDialog] = useState({
    open: false,
    initialUrl: '',
    initialText: '',
    initialNewTab: true,
    isEdit: false,
  })

  onChangeRef.current = onChange
  valueRef.current = value

  function openImageDialog(imgEl = null) {
    const editor = instanceRef.current
    if (!editor) return

    let targetEl = imgEl
    const sel = editor.getSelection()
    if (sel) {
      try {
        activeBookmarksRef.current = sel.createBookmarks()
      } catch {
        activeBookmarksRef.current = null
      }
      if (!targetEl) {
        const selEl = sel.getSelectedElement()
        if (selEl) {
          if (selEl.is('img') || selEl.is('figure')) targetEl = selEl
        }
      }
      if (!targetEl) {
        const startEl = sel.getStartElement()
        if (startEl) {
          if (startEl.is('img')) targetEl = startEl
          else if (startEl.is('figcaption') || startEl.is('figure') || startEl.getAscendant('figure')) {
            targetEl = startEl.is('figure') ? startEl : startEl.getAscendant('figure')
          } else {
            const imgAsc = startEl.getAscendant('img')
            if (imgAsc) targetEl = imgAsc
          }
        }
      }
    }
    activeElementRef.current = targetEl

    let initialUrl = ''
    let initialAlt = ''
    let initialCaption = ''

    if (targetEl) {
      const imgNode = targetEl.is('img') ? targetEl : targetEl.findOne?.('img')
      const figNode = targetEl.is('figure') ? targetEl : targetEl.getAscendant?.('figure')

      if (imgNode) {
        initialUrl = imgNode.getAttribute('src') || ''
        initialAlt = imgNode.getAttribute('alt') || ''
      }
      if (figNode) {
        const figcap = figNode.findOne?.('figcaption')
        if (figcap) initialCaption = figcap.getText() || ''
      }
    }

    setImageDialog({
      open: true,
      initialUrl,
      initialAlt,
      initialCaption,
      isEdit: Boolean(targetEl),
    })
  }

  function openLinkDialog(linkEl = null) {
    const editor = instanceRef.current
    if (!editor) return

    let targetLink = linkEl
    let selText = ''
    const sel = editor.getSelection()
    if (sel) {
      try {
        activeBookmarksRef.current = sel.createBookmarks()
      } catch {
        activeBookmarksRef.current = null
      }
      selText = sel.getSelectedText() || ''
      if (!targetLink) {
        const selEl = sel.getSelectedElement()
        if (selEl && selEl.is('a')) {
          targetLink = selEl
        } else {
          const startEl = sel.getStartElement()
          if (startEl) {
            targetLink = startEl.is('a') ? startEl : startEl.getAscendant('a')
          }
        }
      }
    }
    activeElementRef.current = targetLink

    setLinkDialog({
      open: true,
      initialUrl: targetLink ? targetLink.getAttribute('href') || '' : '',
      initialText: targetLink ? targetLink.getText() || '' : selText,
      initialNewTab: targetLink ? targetLink.getAttribute('target') === '_blank' : true,
      isEdit: Boolean(targetLink),
    })
  }

  function handleInsertImage({ url, alt, caption }) {
    const editor = instanceRef.current
    if (!editor) return
    editor.focus()

    const targetEl = activeElementRef.current
    const altAttr = alt ? ` alt="${alt.replace(/"/g, '&quot;')}"` : ''
    const cleanCaption = (caption || '').trim()
    const escapedCap = cleanCaption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    if (targetEl) {
      const imgNode = targetEl.is('img') ? targetEl : targetEl.findOne?.('img')
      const figNode = targetEl.is('figure') ? targetEl : targetEl.getAscendant?.('figure')

      if (figNode && imgNode) {
        // Updating existing figure
        imgNode.setAttribute('src', url)
        if (alt) imgNode.setAttribute('alt', alt)
        else imgNode.removeAttribute('alt')

        const figcap = figNode.findOne?.('figcaption')
        if (cleanCaption) {
          if (figcap) {
            figcap.setText(cleanCaption)
          } else if (window.CKEDITOR) {
            const capEl = new window.CKEDITOR.dom.element('figcaption')
            capEl.setText(cleanCaption)
            figNode.append(capEl)
          }
        } else if (figcap) {
          figcap.remove()
        }
      } else if (imgNode) {
        // Updating existing standalone image
        if (cleanCaption && window.CKEDITOR) {
          const figHtml = `<figure class="news-inline-image"><img src="${url}"${altAttr} class="img-fluid" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;" /><figcaption>${escapedCap}</figcaption></figure>`
          const newEl = window.CKEDITOR.dom.element.createFromHtml(figHtml, editor.document)
          const parent = imgNode.getParent()
          if (parent && parent.is('p') && parent.getChildren().count() === 1) {
            newEl.insertBefore(parent)
            parent.remove()
          } else {
            newEl.insertBefore(imgNode)
            imgNode.remove()
          }
        } else {
          imgNode.setAttribute('src', url)
          if (alt) imgNode.setAttribute('alt', alt)
          else imgNode.removeAttribute('alt')
          imgNode.addClass('img-fluid')
          imgNode.setStyle('max-width', '100%')
          imgNode.setStyle('height', 'auto')
          imgNode.setStyle('display', 'block')
          imgNode.setStyle('margin', '12px auto')
        }
      }
    } else {
      // Inserting new image
      if (activeBookmarksRef.current && editor.getSelection()) {
        try {
          editor.getSelection().selectBookmarks(activeBookmarksRef.current)
        } catch {}
      }
      if (cleanCaption) {
        const html = `<figure class="news-inline-image"><img src="${url}"${altAttr} class="img-fluid" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;" /><figcaption>${escapedCap}</figcaption></figure><p></p>`
        editor.insertHtml(html)
      } else {
        const html = `<p><img src="${url}"${altAttr} class="img-fluid" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:12px auto;" /></p>`
        editor.insertHtml(html)
      }
    }
    skipRef.current = true
    onChangeRef.current(editor.getData())
  }

  function handleRemoveImage() {
    const editor = instanceRef.current
    const targetEl = activeElementRef.current
    if (editor && targetEl) {
      editor.focus()
      const figNode = targetEl.is('figure') ? targetEl : targetEl.getAscendant?.('figure')
      if (figNode && typeof figNode.remove === 'function') {
        figNode.remove()
      } else if (typeof targetEl.remove === 'function') {
        const parent = targetEl.getParent?.()
        targetEl.remove()
        if (parent && parent.is('p') && parent.getChildren().count() === 0) {
          parent.remove()
        }
      }
      skipRef.current = true
      onChangeRef.current(editor.getData())
    }
  }

  function handleSaveLink({ url, text, openInNewTab }) {
    const editor = instanceRef.current
    if (!editor) return
    editor.focus()

    const targetLink = activeElementRef.current
    if (targetLink && typeof targetLink.setAttribute === 'function') {
      targetLink.setAttribute('href', url)
      if (openInNewTab) {
        targetLink.setAttribute('target', '_blank')
        targetLink.setAttribute('rel', 'noopener noreferrer')
      } else {
        targetLink.removeAttribute('target')
        targetLink.removeAttribute('rel')
      }
      if (text) targetLink.setText(text)
    } else {
      if (activeBookmarksRef.current && editor.getSelection()) {
        try {
          editor.getSelection().selectBookmarks(activeBookmarksRef.current)
        } catch {}
      }
      const targetAttr = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      const displayText = text || url
      const escaped = displayText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const html = `<a href="${url}"${targetAttr}>${escaped}</a>`
      editor.insertHtml(html)
    }
    skipRef.current = true
    onChangeRef.current(editor.getData())
  }

  function handleRemoveLink() {
    const editor = instanceRef.current
    const targetLink = activeElementRef.current
    if (editor) {
      editor.focus()
      if (targetLink && typeof targetLink.remove === 'function') {
        const textContent = targetLink.getText()
        if (window.CKEDITOR && typeof window.CKEDITOR.dom?.text === 'function') {
          const textNode = new window.CKEDITOR.dom.text(textContent)
          targetLink.insertBeforeMe(textNode)
        }
        targetLink.remove()
      } else {
        editor.execCommand('unlink')
      }
      skipRef.current = true
      onChangeRef.current(editor.getData())
    }
  }

  useEffect(() => {
    let cancelled = false
    let editor

    loadCkeditor()
      .then((CKEDITOR) => {
        if (cancelled || !hostRef.current || !CKEDITOR) return
        CKEDITOR.config.versionCheck = false
        editor = CKEDITOR.appendTo(hostRef.current, {
          toolbar: FULL_TOOLBAR,
          height: 280,
          resize_enabled: true,
          resize_dir: 'vertical',
          resize_minHeight: 200,
          removePlugins: 'exportpdf',
          versionCheck: false,
          allowedContent: true,
        })
        instanceRef.current = editor

        editor.on('instanceReady', () => {
          editor.setData(valueRef.current || '')

          // Intercept commands via beforeCommandExec
          editor.on('beforeCommandExec', (evt) => {
            const cmdName = evt.data?.name
            if (cmdName === 'image') {
              evt.cancel()
              openImageDialog()
            } else if (cmdName === 'link') {
              evt.cancel()
              openLinkDialog()
            }
          })

          // Override Image command
          if (editor.commands?.image) {
            editor.commands.image.exec = () => {
              openImageDialog()
              return true
            }
          }

          // Override Link command
          if (editor.commands?.link) {
            editor.commands.link.exec = () => {
              openLinkDialog()
              return true
            }
          }

          // Intercept double-click on images, figures, and links
          editor.on(
            'doubleclick',
            (evt) => {
              const el = evt.data?.element
              if (!el) return
              if (el.is('img') || el.is('figure') || el.is('figcaption') || el.getAscendant('figure')) {
                evt.data.dialog = ''
                const target = el.is('img') ? el : (el.findOne?.('img') || el.getAscendant?.('figure') || el)
                openImageDialog(target)
                return false
              }
              if (el.is('a') || el.hasAscendant('a')) {
                evt.data.dialog = ''
                openLinkDialog(el.is('a') ? el : el.getAscendant('a'))
                return false
              }
            },
            null,
            null,
            1,
          )
        })

        editor.on('change', () => {
          skipRef.current = true
          onChangeRef.current(editor.getData())
        })
      })
      .catch((err) => {
        console.error(err)
      })

    return () => {
      cancelled = true
      instanceRef.current = null
      if (editor) {
        try {
          editor.destroy()
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false
      return
    }
    const editor = instanceRef.current
    if (!editor?.setData) return
    const next = value || ''
    if (editor.getData() !== next) editor.setData(next)
  }, [value])

  return (
    <>
      <div ref={hostRef} className="anp-ckeditor-host" />

      <EditorImageDialog
        open={imageDialog.open}
        initialUrl={imageDialog.initialUrl}
        initialAlt={imageDialog.initialAlt}
        initialCaption={imageDialog.initialCaption}
        isEdit={imageDialog.isEdit}
        onClose={() => setImageDialog((prev) => ({ ...prev, open: false }))}
        onInsert={handleInsertImage}
        onRemove={handleRemoveImage}
      />

      <EditorLinkDialog
        open={linkDialog.open}
        initialUrl={linkDialog.initialUrl}
        initialText={linkDialog.initialText}
        initialNewTab={linkDialog.initialNewTab}
        isEdit={linkDialog.isEdit}
        onClose={() => setLinkDialog((prev) => ({ ...prev, open: false }))}
        onSave={handleSaveLink}
        onRemove={handleRemoveLink}
      />
    </>
  )
}
