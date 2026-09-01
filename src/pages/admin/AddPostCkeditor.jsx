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

    let targetImg = imgEl
    const sel = editor.getSelection()
    if (sel) {
      try {
        activeBookmarksRef.current = sel.createBookmarks()
      } catch {
        activeBookmarksRef.current = null
      }
      if (!targetImg) {
        const selEl = sel.getSelectedElement()
        if (selEl && selEl.is('img')) targetImg = selEl
      }
    }
    activeElementRef.current = targetImg

    setImageDialog({
      open: true,
      initialUrl: targetImg ? targetImg.getAttribute('src') || '' : '',
      initialAlt: targetImg ? targetImg.getAttribute('alt') || '' : '',
      isEdit: Boolean(targetImg),
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

  function handleInsertImage({ url, alt }) {
    const editor = instanceRef.current
    if (!editor) return
    editor.focus()

    const targetImg = activeElementRef.current
    if (targetImg && typeof targetImg.setAttribute === 'function') {
      targetImg.setAttribute('src', url)
      if (alt) targetImg.setAttribute('alt', alt)
      else targetImg.removeAttribute('alt')
      targetImg.addClass('img-fluid')
      targetImg.setStyle('max-width', '100%')
      targetImg.setStyle('height', 'auto')
      targetImg.setStyle('display', 'block')
      targetImg.setStyle('margin', '12px auto')
    } else {
      if (activeBookmarksRef.current && editor.getSelection()) {
        try {
          editor.getSelection().selectBookmarks(activeBookmarksRef.current)
        } catch {}
      }
      const altAttr = alt ? ` alt="${alt.replace(/"/g, '&quot;')}"` : ''
      const html = `<p><img src="${url}"${altAttr} class="img-fluid" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:12px auto;" /></p>`
      editor.insertHtml(html)
    }
    skipRef.current = true
    onChangeRef.current(editor.getData())
  }

  function handleRemoveImage() {
    const editor = instanceRef.current
    const targetImg = activeElementRef.current
    if (editor && targetImg && typeof targetImg.remove === 'function') {
      editor.focus()
      targetImg.remove()
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
          resize_enabled: false,
          removePlugins: 'exportpdf',
          versionCheck: false,
          allowedContent: true,
        })
        instanceRef.current = editor

        editor.on('instanceReady', () => {
          editor.setData(valueRef.current || '')

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

          // Intercept double-click on images and links
          editor.on(
            'doubleclick',
            (evt) => {
              const el = evt.data?.element
              if (!el) return
              if (el.is('img')) {
                evt.data.dialog = ''
                openImageDialog(el)
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
