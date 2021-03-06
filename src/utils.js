import { BuildTaskRefType } from './constants';
import { Notify } from 'quasar';

/**
 * Extracts an RPM name, version, release and architecture from the specified URL.
 *
 * @param {String} url - (src-)RPM package URL.
 * @returns {{name, version, release, arch}}
 */
export function splitRpmFileName (url) {
  const re = /(?:\/|^)([\w-|.]+?)-([\w.]+?)-([\w.+]+?)\.(src|noarch|x86_64|i[3456]86)\.rpm$/i
  const rslt = url.match(re)
  if (rslt) {
    return {
      name: rslt[1],
      version: rslt[2],
      release: rslt[3],
      arch: rslt[4]
    }
  }
}

/**
 * Create build item ref string from ref object
 *
 * @param {Object} buildRef - Build reference.
 * @returns String
 */
export function buildRefText (buildRef) {
  let refUrl = buildRef.url
  switch (buildRef.ref_type) {
    case BuildTaskRefType.SRPM_URL:
      const pkgInfo = splitRpmFileName(refUrl)
      return pkgInfo ? `${pkgInfo.version}-${pkgInfo.release}` : 'unknown'
    default:
      if (refUrl.includes('.src.rpm')) {
        return refUrl
      }
      return buildRef.git_ref
  }
}

/**
 * Return nvsca for module
 *
 * @param {Object} build_module - Module.
 * @param {String} arch - Arch.
 * @returns {String}
 */
export function nsvca (build_module, arch = null) {
  if (arch) {
    return `${build_module.name}:${build_module.stream}:${build_module.version}:${build_module.context}:${arch}`
  } else {
    return `${build_module.name}:${build_module.stream}:${build_module.version}:${build_module.context}`
  }
}

/**
 * Copies value to clipboard
 * @param {String} value
 */
export function copyToClipboard(value) {
  navigator.clipboard.writeText(value).then(
    res => Notify.create({
      message: `${value} copied to clipboard`,
      type: 'positive',
      actions: [
          { label: 'Dismiss', color: 'white', handler: () => {} }
      ]
    })
  )
}

/**
 * Return parsed JWT
 *
 * @param {String} jwt_token - JWT.
 * @returns {Object}
 */
export function parseJwt (jwt_token) {
  let base64Url = jwt_token.split('.')[1]
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
  return JSON.parse(jsonPayload)
}
