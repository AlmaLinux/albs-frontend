import {BuildStatus, BuildTaskRefType, SignStatus} from './constants'
import {Notify} from 'quasar'

/**
 * Extracts an RPM name, version, release and architecture from the specified URL.
 *
 * @param {String} url - (src-)RPM package URL.
 * @returns {{name, version, release, arch}}
 */
export function splitRpmFileName(url) {
  const re =
    /(?:\/|^)([\w\-.|+]+)-([\w\^\-.+~]+)-([\w\-.+~_]+)\.([\w\.\-\+]+)\.rpm$/i
  const rslt = url.match(re)
  if (rslt) {
    return {
      name: rslt[1],
      version: rslt[2],
      release: rslt[3],
      arch: rslt[4],
    }
  }
}

/**
 * Create build item ref string from ref object
 *
 * @param {Object} buildRef - Build reference.
 * @returns String
 */
export function buildRefText(buildRef) {
  let refUrl = decodeURIComponent(buildRef.url)
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
export function nsvca(build_module, arch = null) {
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
  navigator.clipboard.writeText(value).then((res) =>
    Notify.create({
      message: `${value} copied to clipboard`,
      type: 'positive',
      actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
    })
  )
}

/**
 * Return parsed JWT
 *
 * @param {String} jwt_token - JWT.
 * @returns {Object}
 */
export function parseJwt(jwt_token) {
  let base64Url = jwt_token.split('.')[1]
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  let jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )
  return JSON.parse(jsonPayload)
}

/**
 * Difference between two JSON Objects
 *
 * A function that returns the differences between two JSON objects
 * Taken from: https://stackoverflow.com/a/8432188
 * Can be improved and doesn't handle corner cases but it does the job
 * for our purposes.
 *
 * @param {Object} Object A
 * @param {Object} Object B
 * @returns {Object}
 */
export function diff(obj1, obj2) {
  const result = {}
  if (Object.is(obj1, obj2)) {
    return undefined
  }
  if (!obj2 || typeof obj2 !== 'object') {
    return obj2
  }
  Object.keys(obj1 || {})
    .concat(Object.keys(obj2 || {}))
    .forEach((key) => {
      if (obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key])) {
        result[key] = obj2[key]
      }
      if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
        const value = diff(obj1[key], obj2[key])
        if (value !== undefined) {
          result[key] = value
        }
      }
    })
  return result
}

export function isEmptyObject(obj) {
  return (
    obj &&
    Object.keys(obj).length === 0 &&
    Object.getPrototypeOf(obj) === Object.prototype
  )
}

/**
 * Yet another function to obtain the difference between two JSON Objects
 *
 * A function that returns the differences between two JSON objects
 * Taken from: https://stackoverflow.com/a/25175871
 * This version removes empty nested nodes, which breaks the code that
 * uses the diff function in some of the users admin page functionalities.
 * TODO: Ideally, this should supersed the diff function, but we need
 * to ensure that we don't break the funcionality that it is
 * used for. Mostly, in the users admin pages.
 *
 * @param {Object} Object A
 * @param {Object} Object B
 * @returns {Object}
 */
export function deepDiff(obj1, obj2) {
  var result = {}
  var change
  for (var key in obj1) {
    if (typeof obj2[key] == 'object' && typeof obj1[key] == 'object') {
      change = deepDiff(obj1[key], obj2[key])
      if (isEmptyObject(change) === false) {
        result[key] = change
        // Workaround to be able to show notifications
        // when the list of products change
      } else if (key == 'products') {
        result[key] = change
      }
    } else if (obj2[key] != obj1[key]) {
      result[key] = obj2[key]
    }
  }
  return result
}

export async function getFromApi(api, endpoint) {
  return new Promise((resolve) => {
    api
      .get(endpoint)
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        if (+String(error.response.status)[0] === 4) {
          Notify.create({
            message: error.response.data.detail,
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        } else {
          Notify.create({
            message: `${error.response.status}: ${error.response.statusText}`,
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        }
      })
  })
}

export function getTaskCSS(task) {
  let css = []
  switch (task.status) {
    case BuildStatus.FAILED:
      css.push('text-negative', 'bg-red-1')
      break
    case BuildStatus.IDLE:
      css.push('text-grey-6')
      break
    case BuildStatus.STARTED:
      css.push('text-black-6')
      break
    case BuildStatus.EXCLUDED:
      css.push('text-black-6')
      break
    case BuildStatus.COMPLETED:
      css.push('text-green-7')
      break
    case BuildStatus.CANCELLED:
      css.push('text-black-6')
      break
    case BuildStatus.TEST_CREATED:
      css.push('text-negative')
      break
    case BuildStatus.TEST_FAILED:
      css.push('text-negative')
      break
    case BuildStatus.ALL_TESTS_FAILED:
      css.push('text-negative')
      break
    case BuildStatus.TEST_COMPLETED:
      css.push('text-green-7')
      break
    case BuildStatus.TEST_CANCELLED:
      css.push('text-negative')
      break
  }
  return css
}

/**
 * Returns true if every build task has finished, i.e. the build itself
 * is not being built anymore.
 *
 * @param {Object} build - Build.
 * @returns {Boolean}
 */
export function isBuildFinished(build) {
  if (!build || !build.tasks) {
    return false
  }
  return build.tasks.every((task) => task.status >= BuildStatus.COMPLETED)
}

/**
 * Returns true if the testing stage is over for every non-src build task.
 *
 * @param {Object} build - Build.
 * @returns {Boolean}
 */
export function isBuildTestingCompleted(build) {
  if (!build || !build.tasks) {
    return false
  }
  return build.tasks.every((task) => {
    if (task.arch === 'src') {
      return true
    }
    return (
      task.status > BuildStatus.COMPLETED &&
      task.status !== BuildStatus.TEST_CREATED &&
      task.status !== BuildStatus.TEST_STARTED
    )
  })
}

/**
 * Returns the status of the latest sign task of the build, or null when the
 * build has never been sent for signing.
 *
 * @param {Object} build - Build.
 * @returns {Number|null}
 */
export function lastSignStatus(build) {
  if (!build || !build.sign_tasks || !build.sign_tasks.length) {
    return null
  }
  let signTasks = build.sign_tasks
  return signTasks[signTasks.length - 1].status
}

/**
 * Returns true if the latest sign task of the build has succeeded.
 *
 * @param {Object} build - Build.
 * @returns {Boolean}
 */
export function isBuildSigned(build) {
  return lastSignStatus(build) === SignStatus.DONE
}

/**
 * Returns true if the build is waiting to be signed: it is built, not
 * released, and either was never sent for signing or the last attempt
 * failed. A build that is signed, queued or being signed right now needs
 * no signing action.
 *
 * @param {Object} build - Build.
 * @returns {Boolean}
 */
export function isBuildSignable(build) {
  if (!isBuildFinished(build) || build.released) {
    return false
  }
  let status = lastSignStatus(build)
  return status === null || status === SignStatus.FAILED
}

/**
 * Returns the PGP key that should be pre-selected when signing the build.
 *
 * Sign keys are bound to products and platforms in the build system
 * configuration, so that a build made for AlmaLinux 8 gets the AlmaLinux 8
 * key pre-selected. Product keys take precedence, because community builds
 * are always signed with the key of their own product.
 *
 * More than one key can be bound to the same platform (for instance both
 * AlmaLinux-10 and AlmaLinux-10-EPEL-AltArch cover the AlmaLinux 10
 * platforms) and the build system has no notion of a default one. In that
 * case the oldest key wins, which is the main key of the distribution,
 * so that the pre-selection does not depend on the order the API happens
 * to return the keys in.
 *
 * @param {Object} build - Build.
 * @param {Array} keys - Sign keys, as returned by the /sign-keys/ endpoint.
 * @returns {Object|null}
 */
export function defaultSignKey(build, keys) {
  if (!build || !keys || !keys.length) {
    return null
  }
  let oldestFirst = keys
    .filter((key) => key.active !== false)
    .slice()
    .sort((a, b) => a.id - b.id)
  let productIds = new Set((build.products || []).map((product) => product.id))
  if (productIds.size) {
    let productKey = oldestFirst.find(
      (key) => key.product_id && productIds.has(key.product_id)
    )
    if (productKey) {
      return productKey
    }
  }
  let platformIds = new Set(
    (build.tasks || [])
      .filter((task) => task.platform)
      .map((task) => task.platform.id)
  )
  if (!platformIds.size) {
    return null
  }
  return (
    oldestFirst.find((key) =>
      (key.platform_ids || []).some((id) => platformIds.has(id))
    ) || null
  )
}

export function pathJoin(parts) {
  let replace = new RegExp('/' + '{1,}', 'g')
  return parts.join('/').replace(replace, '/')
}

export function sortByArches(a, b) {
  const customOrder = ['src']
  const indexA = customOrder.indexOf(a)
  const indexB = customOrder.indexOf(b)
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB
  }
  if (indexA !== -1) {
    return -1
  }
  if (indexB !== -1) {
    return 1
  }
  return a.localeCompare(b)
}
