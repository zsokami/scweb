import { toUnicode } from 'https://esm.sh/punycode@2.3.1'

import { createEditor } from './editor.js'

document.fonts.ready.then(() => {
  document.body.dataset.show = ''
})

const el_result = document.querySelector('#result')
const el_copy = document.querySelector('#copy')
const el_clash = document.querySelector('#clash')
const el_editor = document.querySelector('#editor')

const url = new URL(`https://${location.hash.slice(1) || 'scs.f5.si'}/`)

el_result.value = url.href

let timeout_id_update

const editor = createEditor({
  parent: el_editor,
  onUpdate({ docChanged, state }) {
    if (!docChanged) return
    clearTimeout(timeout_id_update)
    timeout_id_update = setTimeout(() => {
      url.pathname = state.doc.toString()
        .trim()
        .replaceAll('|', '%7C')
        .split(/\s*\n\s*/g)
        .filter((x) => /^[\w-]+:\/\//.test(x))
        .join('|')
        .replaceAll('%', '%25')
        .replaceAll('\\', '%5C')
      el_result.value = url.href
    }, 100)
  },
})

editor.focus()

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
    clearTimeout(timeout_id_remove_success_and_error)
    timeout_id_remove_success_and_error = setTimeout(removeSuccessAndError, 1000)
  }
})

function getName() {
  const input = editor.state.doc.toString()
  let m
  if ((m = input.match(/^\s*https?:\/\/raw\.githubusercontent\.com\/+([^/\n]+)(?:\/+[^/\n]+){2,}\/+([^/\n]+)\s*$/))) {
    return m[1] === m[2] ? m[1] : m[1] + ' - ' + decodeURIComponent(m[2])
  } else if (
    (m = input.match(
      /^\s*(https?:\/\/raw\.githubusercontent\.com\/+([^/\n]+))(?:\/+[^/\n]+){3,}(?:\s*\n\s*\1(?:\/+[^/\n]+){3,})*\s*$/,
    ))
  ) {
    return m[2]
  } else if (
    (m = input.match(/^\s*(https?:\/\/gist\.githubusercontent\.com\/+([^/\n]+))\/[^\n]+(?:\s*\n\s*\1\/[^\n]+)*\s*$/))
  ) {
    return m[2] + ' - gist'
  } else if ((m = input.match(/^\s*(https?:\/\/([^:/?#\n]+))(?:[:/?#][^\n]*)?(?:\s*\n\s*\1(?:[:/?#][^\n]*)?)*\s*$/))) {
    return toUnicode(m[2])
  }
  return ''
}

el_clash.addEventListener('click', () => {
  const url = new URL('clash://install-config')
  url.searchParams.set('url', el_result.value)
  const name = getName()
  if (name) url.searchParams.set('name', name)
  open(url, '_self')
})

el_editor.addEventListener('scroll', () => {
  if (el_editor.scrollTop === 0) {
    document.body.classList.remove('scrolled')
  } else {
    document.body.classList.add('scrolled')
  }
})
