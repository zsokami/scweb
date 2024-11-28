import { createEditor } from './editor.js'

if (document.fonts.status === 'loaded') {
  document.body.dataset.show = ''
} else {
  document.fonts.addEventListener('loadingdone', () => {
    document.body.dataset.show = ''
  }, { once: true })
}

const el_result = document.querySelector('#result')
const el_copy = document.querySelector('#copy')

const url = new URL(`https://${location.hash.slice(1) || 'scs.f5.si'}/`)

el_result.value = url.href

let timeout_id_update

createEditor({
  parent: document.body,
  onUpdate({ docChanged, state }) {
    if (!docChanged) return
    clearTimeout(timeout_id_update)
    timeout_id_update = setTimeout(() => {
      url.pathname = state.doc.toString()
        .trim()
        .replaceAll('|', '%7C')
        .replace(/\s*\n\s*/g, '|')
        .replaceAll('%', '%25')
        .replaceAll('\\', '%5C')
      el_result.value = url.href
    }, 100)
  },
}).focus()

let timeout_id_remove_success_and_error

function removeSuccessAndError() {
  el_copy.classList.remove('success')
  el_copy.classList.remove('error')
}

el_copy.addEventListener('click', async () => {
  el_copy.classList.add('pending')
  removeSuccessAndError()
  clearTimeout(timeout_id_remove_success_and_error)
  try {
    await navigator.clipboard.writeText(el_result.value)
    el_copy.classList.add('success')
  } catch (e) {
    console.error(e.message)
    el_copy.classList.add('error')
  } finally {
    el_copy.classList.remove('pending')
    timeout_id_remove_success_and_error = setTimeout(removeSuccessAndError, 1000)
  }
})

addEventListener('scroll', () => {
  if (scrollY === 0) {
    document.body.classList.remove('scrolled')
  } else {
    document.body.classList.add('scrolled')
  }
})
