import { useEffect, useRef } from 'react'

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

  onChangeRef.current = onChange
  valueRef.current = value

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

  return <div ref={hostRef} className="anp-ckeditor-host" />
}
