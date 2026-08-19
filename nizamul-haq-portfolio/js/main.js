import { loadSiteContent } from './render.js'

loadSiteContent()

const year = document.getElementById('year')
if (year) year.textContent = new Date().getFullYear()

const toggle = document.querySelector('.nav-toggle')
const nav = document.querySelector('.main-nav')
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  toggle.setAttribute('aria-expanded', String(open))
  toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>'
})

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open')
    toggle?.setAttribute('aria-expanded', 'false')
    if (toggle) toggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
  })
})

const searchBtn = document.querySelector('.search-btn')
const searchPanel = document.querySelector('.search-panel')
searchBtn?.addEventListener('click', () => {
  const hidden = searchPanel.hasAttribute('hidden')
  if (hidden) searchPanel.removeAttribute('hidden')
  else searchPanel.setAttribute('hidden', '')
  if (hidden) searchPanel.querySelector('input')?.focus()
})

searchPanel?.addEventListener('submit', (e) => {
  e.preventDefault()
  const q = searchPanel.querySelector('input')?.value.trim()
  if (!q) return
  const hit = [...document.querySelectorAll('h2, h3')].find((el) => el.textContent.includes(q))
  ;(hit || document.querySelector('#news'))?.scrollIntoView({ behavior: 'smooth' })
})

document.querySelector('.contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = e.target
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
  }
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('fail')
    alert('আপনার বার্তা সসম্মানে গৃহীত হয়েছে। ধন্যবাদ।')
    form.reset()
  } catch {
    alert('এই মুহূর্তে বার্তা প্রেরণ সম্ভব হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।')
  }
})
