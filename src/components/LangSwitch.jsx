import { useLang } from '../context/LanguageContext'

export default function LangSwitch({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label="Language">
      <button
        type="button"
        className={lang === 'bn' ? 'active' : ''}
        onClick={() => setLang('bn')}
      >
        বাংলা
      </button>
      <span className="lang-switch-sep">|</span>
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
      >
        English
      </button>
    </div>
  )
}
