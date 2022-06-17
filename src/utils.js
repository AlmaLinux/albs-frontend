import { BuildTaskRefType } from './constants';

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
