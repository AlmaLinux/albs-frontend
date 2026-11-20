// Load the .js files of src/ as ES modules in the unit tests.
//
// package.json has no "type": "module", so Node reads src/*.js as
// CommonJS, and only Node.js 20.19+ and 22.7+ detect the import
// syntax on their own. This hook keeps `npm test` working on the
// Node.js 16 of the Docker image used by CI and by docker-compose.
import {readFile} from 'node:fs/promises'

const SRC = new URL('../src/', import.meta.url).href

export async function load(url, context, nextLoad) {
  if (url.startsWith(SRC) && url.endsWith('.js')) {
    return {
      format: 'module',
      source: await readFile(new URL(url), 'utf8'),
      shortCircuit: true,
    }
  }
  return nextLoad(url, context)
}
