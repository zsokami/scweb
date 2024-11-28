import { join } from 'jsr:@std/path/posix/join'
import { normalize } from 'jsr:@std/path/posix/normalize'
import { parse } from 'jsr:@std/path/posix/parse'

const inDir = 'src'
const outDir = 'webroot'

const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const textEncoder = new TextEncoder()

async function hash(data) {
  return new Uint32Array(await crypto.subtle.digest('SHA-1', data)).reduce((s, x) => s + chars[x % chars.length], '')
}

async function replace(text, regex, fn) {
  let result = ''
  let left = 0
  for (const m of text.matchAll(regex)) {
    result += text.slice(left, m.index)
    result += await fn(...m)
    left = m.index + m[0].length
  }
  return result + text.slice(left)
}

function isFile(path) {
  try {
    return Deno.lstatSync(path).isFile
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e
    return false
  }
}

async function dfs(path, parent, vis) {
  const { root, dir, base, name, ext } = parse(path)
  path = normalize(path)
  const fullPath = root ? path.slice(1) : join(parent, path)
  if (fullPath === '..' || fullPath.startsWith('../')) throw new Error(`Path outside of ${inDir}: ${fullPath}`)
  if (!isFile(`${inDir}/${fullPath}`)) throw new Error(`File not found: ${inDir}/${fullPath}`)
  let v = vis[fullPath]
  if (v === '') throw new Error(`Cyclic dependency: ${fullPath}`)
  if (!v) {
    vis[fullPath] = ''
    const fullDir = parse(fullPath).dir
    try {
      Deno.mkdirSync(`${outDir}/${fullDir}`, { recursive: true })
    } catch {
      // pass
    }
    let data = null
    if (ext === '.html' || ext === '.css' || ext === '.js') {
      data = textEncoder.encode(await replace(
        Deno.readTextFileSync(`${inDir}/${fullPath}`),
        /( (?:data-)?(?:href|src)=|\bimport .*| url\()(["'])(?![\w-]*:|\/\/)(.+?)\2| url\((?![\w-]*:|\/\/)(.+?)\)/g,
        async (_, pre, left, path, path2) => {
          if (path2) {
            path2 = await dfs(path2, fullDir, vis)
            return ` url(${path2})`
          }
          path = await dfs(path, fullDir, vis)
          return pre + left + path + left
        },
      ))
    }
    if (fullPath.startsWith('static/')) {
      if (data === null) {
        data = Deno.readFileSync(`${inDir}/${fullPath}`)
      }
      v = vis[fullPath] = `${name}.${await hash(data)}${ext}`
      try {
        Deno.writeFileSync(`${outDir}/${`${fullDir}/${v}`}`, data, { createNew: true })
      } catch (e) {
        if (!(e instanceof Deno.errors.AlreadyExists)) {
          throw e
        }
      }
    } else {
      v = vis[fullPath] = base
      if (data === null) {
        Deno.copyFileSync(`${inDir}/${fullPath}`, `${outDir}/${fullPath}`)
      } else {
        try {
          Deno.writeFileSync(`${outDir}/${`${fullDir}/${v}`}`, data, { createNew: true })
        } catch (e) {
          if (!(e instanceof Deno.errors.AlreadyExists)) {
            throw e
          }
        }
      }
    }
  }
  return dir === '' ? v : dir === '/' ? `/${v}` : `${dir}/${v}`
}

try {
  Deno.removeSync(outDir, { recursive: true })
} catch {
  // pass
}
for (const name of ['index']) {
  await dfs(`${name}.html`, '', Object.create(null))
}
