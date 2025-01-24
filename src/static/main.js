import { createEditor } from './editor.js'

document.fonts.ready.then(() => {
  document.body.dataset.show = ''
})

const el_result = document.querySelector('#result')
const el_copy = document.querySelector('#copy')
const el_clash = document.querySelector('#clash')
const el_editor = document.querySelector('#editor')

const url = new URL(
  location.hash.slice(1).replace(
    /^(https?:\/*)?(.*)/i,
    (_, $1, $2) => ($1 || 'https://') + ($2 || 'arx.cc'),
  ),
)

el_result.value = url.href

let timeout_id_update

const editor = createEditor({
  hint: 'http/s 订阅链接、除 http/s 代理的 uri 或用 base64/base64url 编码的订阅内容，一行一个。' +
    '获取零节点订阅用 empty，可用于去广告',
  parent: el_editor,
  onUpdate({ docChanged, state }) {
    if (!docChanged) return
    clearTimeout(timeout_id_update)
    timeout_id_update = setTimeout(() => {
      let from = state.doc.toString().trim()
      if (from === 'empty') {
        url.pathname = '/empty'
        url.search = ''
        el_result.value = url.href
        return
      }
      from = from.replaceAll('|', '%7C')
        .split(/\s*\n\s*/g)
        .filter((x) =>
          /^https?:|^[a-z][a-z0-9.+-]*:\/\/./i.test(x) ||
          (x.length % 4 !== 1 && /^[-_+/A-Za-z0-9]*={0,2}$/.test(x))
        )
      if (from.length === 1 && /^https?:/i.test(from[0])) {
        try {
          from = new URL(from[0])
          url.pathname = '/' + from.origin + from.pathname
          url.search = from.search
        } catch {
          // pass
        }
      } else {
        url.pathname = '/' + from.join('|')
          .replaceAll('%', '%25')
          .replaceAll('\\', '%5C')
          .replace(/^(https?):/i, '$1%3A')
        url.search = ''
      }
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
