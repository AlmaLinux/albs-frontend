/**
 * Pure helpers of the build nodes pages: node statuses, highlight
 * thresholds and value formatting.
 *
 * The module must stay free of Quasar, Vue and webpack aliases so that it
 * can be imported by the unit tests running under plain Node.js. Relative
 * imports must carry the file extension for the same reason.
 */
import {BuildStatus} from './constants.js'

const KiB = 1024
const MiB = KiB * 1024
const GiB = MiB * 1024
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/* How often the pages poll the API. */
export const BUILD_NODES_REFRESH_INTERVAL_MS = 15 * SECOND_MS

/* Disk: less free space than any of these is critical (red)... */
export const DISK_FREE_CRITICAL_PERCENT = 10
export const DISK_FREE_CRITICAL_BYTES = 20 * GiB
/* ...and less than this is a warning (yellow). */
export const DISK_FREE_WARNING_PERCENT = 20

/* RAM: less available memory than this is critical (red). */
export const MEM_AVAILABLE_CRITICAL_PERCENT = 10

/* Load: a 1 minute load average above cpu_count * this is a warning. */
export const LOAD_WARNING_PER_CPU = 1

/* Host metrics older than this are marked as stale. */
export const RESOURCES_STALE_AFTER_MS = 5 * MINUTE_MS

/* A task claimed longer ago than this is highlighted as long running. */
export const LONG_RUNNING_TASK_MS = 6 * HOUR_MS

export const Level = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown',
}

export const NodeStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DRAIN: 'drain',
  MAINTENANCE: 'maintenance',
  DISABLED: 'disabled',
}

const NODE_STATUS_INFO = {
  [NodeStatus.ONLINE]: {
    label: 'online',
    color: 'positive',
    textColor: 'black',
    description: 'The node is alive and takes new tasks',
  },
  [NodeStatus.OFFLINE]: {
    label: 'offline',
    color: 'negative',
    textColor: 'white',
    description: 'The node does not ping the build system',
  },
  [NodeStatus.DRAIN]: {
    label: 'drain',
    color: 'warning',
    textColor: 'black',
    description: 'The node finishes its current tasks and takes no new ones',
  },
  [NodeStatus.MAINTENANCE]: {
    label: 'maintenance',
    color: 'accent',
    textColor: 'white',
    description: 'The node is under maintenance',
  },
  [NodeStatus.DISABLED]: {
    label: 'disabled',
    color: 'grey-7',
    textColor: 'white',
    description: 'The node is disabled and takes no tasks',
  },
}

/*
 * Order used to pick the main status of a node when several flags are set
 * at once, and to sort the nodes by status: the first matching one wins.
 */
const NODE_STATUS_PRIORITY = [
  NodeStatus.DISABLED,
  NodeStatus.MAINTENANCE,
  NodeStatus.OFFLINE,
  NodeStatus.DRAIN,
  NodeStatus.ONLINE,
]

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Parses a datetime returned by the API.
 *
 * The web server stores naive UTC datetimes and serializes them without a
 * timezone designator, which Date would read as local time, so such
 * strings are read as UTC.
 *
 * @param {String|Number|Date|null} value - ISO 8601 datetime.
 * @returns {Date|null}
 */
export function parseApiDate(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  if (isNumber(value)) {
    return new Date(value)
  }
  let text = String(value).trim()
  let hasTime = /\d{2}:\d{2}/.test(text)
  let hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text)
  if (hasTime && !hasZone) {
    text = `${text.replace(' ', 'T')}Z`
  }
  let date = new Date(text)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Milliseconds passed since the datetime, or null if it is unknown.
 * A datetime in the future (clock skew) counts as zero.
 *
 * @param {String|Date|null} value - Datetime returned by the API.
 * @param {Number} now - Current timestamp, ms.
 * @returns {Number|null}
 */
export function msSince(value, now = Date.now()) {
  let date = parseApiDate(value)
  if (!date) {
    return null
  }
  return Math.max(0, now - date.getTime())
}

/**
 * Formats a duration: "45 s", "12 min", "3 h 05 min", "6 h", "2 d 4 h".
 *
 * @param {Number|null} ms - Duration, ms.
 * @returns {String}
 */
export function formatDuration(ms) {
  if (!isNumber(ms) || ms < 0) {
    return '—'
  }
  if (ms < MINUTE_MS) {
    return `${Math.floor(ms / SECOND_MS)} s`
  }
  if (ms < HOUR_MS) {
    return `${Math.floor(ms / MINUTE_MS)} min`
  }
  if (ms < DAY_MS) {
    let hours = Math.floor(ms / HOUR_MS)
    let minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS)
    return minutes
      ? `${hours} h ${String(minutes).padStart(2, '0')} min`
      : `${hours} h`
  }
  let days = Math.floor(ms / DAY_MS)
  let hours = Math.floor((ms % DAY_MS) / HOUR_MS)
  return hours ? `${days} d ${hours} h` : `${days} d`
}

/**
 * Formats how long ago the datetime was: "just now", "5 min ago",
 * "3 h ago", "2 d ago".
 *
 * @param {String|Date|null} value - Datetime returned by the API.
 * @param {Number} now - Current timestamp, ms.
 * @param {String} never - Text to return when the datetime is unknown.
 * @returns {String}
 */
export function formatTimeAgo(value, now = Date.now(), never = 'never') {
  let ms = msSince(value, now)
  if (ms === null) {
    return never
  }
  if (ms < MINUTE_MS) {
    return 'just now'
  }
  if (ms < HOUR_MS) {
    return `${Math.floor(ms / MINUTE_MS)} min ago`
  }
  if (ms < DAY_MS) {
    return `${Math.floor(ms / HOUR_MS)} h ago`
  }
  return `${Math.floor(ms / DAY_MS)} d ago`
}

/**
 * Formats a datetime in the user's locale, e.g. for tooltips.
 *
 * @param {String|Date|null} value - Datetime returned by the API.
 * @returns {String}
 */
export function formatDateTime(value) {
  let date = parseApiDate(value)
  return date ? date.toLocaleString() : '—'
}

/**
 * Formats a size in binary units: "512 B", "1.5 GiB", "120 GiB".
 *
 * @param {Number|null} bytes - Size, bytes.
 * @returns {String}
 */
export function formatBytes(bytes) {
  if (!isNumber(bytes) || bytes < 0) {
    return '—'
  }
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  if (unit === 0) {
    return `${value} B`
  }
  let digits = value < 10 ? 1 : 0
  return `${value.toFixed(digits)} ${units[unit]}`
}

/**
 * Formats a percentage: "42%", "9.5%" with one digit below 10%.
 *
 * @param {Number|null} value - Percentage, 0-100.
 * @returns {String}
 */
export function formatPercent(value) {
  if (!isNumber(value)) {
    return '—'
  }
  let digits = value > 0 && value < 10 ? 1 : 0
  return `${value.toFixed(digits)}%`
}

// The version of a build node is the commit of the albs-node checkout
// it runs, cut to 12 characters (get_node_version of albs-node): the
// nodes are deployed as git clones and have no release versions.
export const NODE_VERSION_HINT =
  'albs-node commit the node runs (first 12 characters of the git hash)'

export const NODE_VERSION_MISSING_HINT =
  'The node did not report its albs-node commit: it runs an older ' +
  'albs-node or is not deployed from a git clone'

/**
 * Describes the version of a build node for the UI.
 *
 * @param {String|null} version - BuildNode.version.
 * @returns {Object} text - what to show, commit - the hash or null,
 *   hint - tooltip text.
 */
export function describeNodeVersion(version) {
  let commit = typeof version === 'string' ? version.trim() : ''
  if (!commit) {
    return {text: '—', commit: null, hint: NODE_VERSION_MISSING_HINT}
  }
  return {
    text: commit,
    commit,
    hint: `albs-node commit ${commit} (first 12 characters of the git hash)`,
  }
}

/**
 * Returns the list of statuses that apply to the node.
 *
 * @param {Object} node - BuildNode.
 * @returns {Array<String>} NodeStatus values in priority order.
 */
export function nodeStatusKeys(node) {
  if (!node) {
    return []
  }
  let flags = {
    [NodeStatus.DISABLED]: node.enabled === false,
    [NodeStatus.MAINTENANCE]: !!node.maintenance,
    [NodeStatus.OFFLINE]: !node.online,
    [NodeStatus.DRAIN]: !!node.drain,
    [NodeStatus.ONLINE]: !!node.online,
  }
  return NODE_STATUS_PRIORITY.filter((status) => flags[status])
}

/**
 * Returns the main status of the node: disabled > maintenance > offline >
 * drain > online.
 *
 * @param {Object} node - BuildNode.
 * @returns {String} NodeStatus value.
 */
export function nodeStatus(node) {
  return nodeStatusKeys(node)[0] || NodeStatus.OFFLINE
}

/**
 * Position of the main status of the node in the priority list, used to
 * sort the nodes by status.
 *
 * @param {Object} node - BuildNode.
 * @returns {Number}
 */
export function nodeStatusRank(node) {
  return NODE_STATUS_PRIORITY.indexOf(nodeStatus(node))
}

/**
 * Returns the badges to show for the node, the main status first. An
 * offline badge tells when the node was last seen.
 *
 * @param {Object} node - BuildNode.
 * @param {Number} now - Current timestamp, ms.
 * @returns {Array<{key, label, color, textColor, description}>}
 */
export function nodeStatusBadges(node, now = Date.now()) {
  return nodeStatusKeys(node).map((key) => {
    let badge = {key, ...NODE_STATUS_INFO[key]}
    if (key === NodeStatus.OFFLINE) {
      badge.description = node.last_seen
        ? `Last seen ${formatTimeAgo(node.last_seen, now)}`
        : 'The node has never been seen'
    }
    return badge
  })
}

/**
 * Describes how busy the node slots are.
 *
 * @param {Object} node - BuildNode.
 * @returns {{active, capacity, ratio, percent, overridden, overloaded}}
 *   ratio is clamped to 0..1 for progress bars, percent is not clamped.
 */
export function slotUsage(node) {
  let active = isNumber(node && node.active_tasks_count)
    ? node.active_tasks_count
    : 0
  let capacity = isNumber(node && node.effective_capacity)
    ? node.effective_capacity
    : 0
  let percent
  if (capacity > 0) {
    percent = (active / capacity) * 100
  } else {
    percent = active > 0 ? 100 : 0
  }
  return {
    active,
    capacity,
    ratio: Math.min(1, percent / 100),
    percent,
    overridden: hasCapacityOverride(node),
    limited: isCapacityLimited(node),
    overloaded: active > capacity,
  }
}

/**
 * Tells whether the node has a manual slot limit.
 *
 * @param {Object} node - BuildNode.
 * @returns {Boolean}
 */
export function hasCapacityOverride(node) {
  return !!node && isNumber(node.capacity_override)
}

/**
 * Slots of a node as the web server counts them: a manual limit can only
 * lower the slots the node reports, and a node that has not reported its
 * slots (0) gets one slot unless a manual limit sets another number.
 *
 * @param {Number} capacity - Slots reported by the node.
 * @param {Number|null} override - Manual slot limit.
 * @returns {Number}
 */
export function effectiveCapacity(capacity, override) {
  let reported = isNumber(capacity) ? capacity : 0
  let limit = isNumber(override) ? override : null
  if (reported <= 0) {
    return limit === null ? 1 : Math.max(limit, 0)
  }
  if (limit === null) {
    return reported
  }
  return Math.max(Math.min(reported, limit), 0)
}

/**
 * Tells whether the manual slot limit of the node changes its slots: it is
 * below the reported slots, or the node has not reported its slots.
 *
 * @param {Object} node - BuildNode.
 * @returns {Boolean}
 */
export function isCapacityLimited(node) {
  if (!hasCapacityOverride(node)) {
    return false
  }
  return !(node.capacity > 0) || node.capacity_override < node.capacity
}

/**
 * Values of the slot limit dialog of the node.
 *
 * @param {Object} node - BuildNode.
 * @returns {{initial, max, resetTo, reported, hasOverride, description,
 *   tooltip}} initial is the value to start editing from, max the highest
 *   allowed limit (null when any number is allowed), resetTo the slots the
 *   node gets once the limit is reset.
 */
export function capacityLimitInfo(node) {
  let capacity = node && isNumber(node.capacity) ? node.capacity : 0
  let reported = capacity > 0
  let override = hasCapacityOverride(node) ? node.capacity_override : null
  let initial =
    node && isNumber(node.effective_capacity)
      ? node.effective_capacity
      : effectiveCapacity(capacity, override)
  let description = reported
    ? `The node reports ${capacity} slot(s). A manual limit limits the ` +
      'slots to at most the given number until it is reset, it cannot ' +
      `raise them above ${capacity}.`
    : 'The node has not reported its slots, 1 slot is used. A manual ' +
      'limit sets the number of slots until it is reset.'
  let tooltip = ''
  if (override !== null) {
    tooltip = reported
      ? `Manual slot limit ${override}, the node reports ${capacity}`
      : `Manual slot limit ${override}, the node has not reported its slots`
  }
  return {
    initial,
    max: reported ? capacity : null,
    resetTo: reported ? capacity : 1,
    reported: reported ? capacity : null,
    hasOverride: override !== null,
    description,
    tooltip,
  }
}

/**
 * What a manual slot limit typed in the dialog will do.
 *
 * @param {Object} node - BuildNode.
 * @param {String|Number} value - Typed value.
 * @returns {String}
 */
export function capacityLimitHint(node, value) {
  let info = capacityLimitInfo(node)
  if (validateCapacityOverride(value, info.max) !== true) {
    return ''
  }
  let number = Number(value)
  if (number === 0) {
    return 'The node takes no tasks'
  }
  return info.reported === null
    ? `Sets the slots to ${number}`
    : `Limits the slots to at most ${number}`
}

/**
 * Tells whether the host metrics of the node are too old to be trusted.
 * Metrics with no timestamp are stale, missing metrics are not.
 *
 * @param {Object} node - BuildNode.
 * @param {Number} now - Current timestamp, ms.
 * @returns {Boolean}
 */
export function isResourcesStale(node, now = Date.now()) {
  if (!node || !node.resources) {
    return false
  }
  let age = msSince(node.resources_updated_at, now)
  return age === null || age > RESOURCES_STALE_AFTER_MS
}

/**
 * Percentage of the free disk space.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {Number|null}
 */
export function diskFreePercent(resources) {
  if (
    !resources ||
    !isNumber(resources.disk_total_bytes) ||
    !isNumber(resources.disk_free_bytes) ||
    resources.disk_total_bytes <= 0
  ) {
    return null
  }
  return (resources.disk_free_bytes / resources.disk_total_bytes) * 100
}

/**
 * Highlight level of the free disk space: critical below 10% or 20 GiB,
 * warning below 20%.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {String} Level value.
 */
export function diskLevel(resources) {
  let percent = diskFreePercent(resources)
  if (percent === null) {
    return Level.UNKNOWN
  }
  if (
    percent < DISK_FREE_CRITICAL_PERCENT ||
    resources.disk_free_bytes < DISK_FREE_CRITICAL_BYTES
  ) {
    return Level.CRITICAL
  }
  if (percent < DISK_FREE_WARNING_PERCENT) {
    return Level.WARNING
  }
  return Level.OK
}

/**
 * Percentage of the available memory.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {Number|null}
 */
export function memAvailablePercent(resources) {
  if (
    !resources ||
    !isNumber(resources.mem_total_bytes) ||
    !isNumber(resources.mem_available_bytes) ||
    resources.mem_total_bytes <= 0
  ) {
    return null
  }
  return (resources.mem_available_bytes / resources.mem_total_bytes) * 100
}

/**
 * Percentage of the used memory.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {Number|null}
 */
export function memUsedPercent(resources) {
  let available = memAvailablePercent(resources)
  return available === null ? null : 100 - available
}

/**
 * Highlight level of the memory: critical when less than 10% is available.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {String} Level value.
 */
export function memLevel(resources) {
  let available = memAvailablePercent(resources)
  if (available === null) {
    return Level.UNKNOWN
  }
  return available < MEM_AVAILABLE_CRITICAL_PERCENT ? Level.CRITICAL : Level.OK
}

/**
 * 1 minute load average divided by the number of CPUs.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {Number|null}
 */
export function loadPerCpu(resources) {
  if (
    !resources ||
    !Array.isArray(resources.load_avg) ||
    !isNumber(resources.load_avg[0]) ||
    !isNumber(resources.cpu_count) ||
    resources.cpu_count <= 0
  ) {
    return null
  }
  return resources.load_avg[0] / resources.cpu_count
}

/**
 * Highlight level of the load: warning when the 1 minute load average is
 * above the number of CPUs.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {String} Level value.
 */
export function loadLevel(resources) {
  let perCpu = loadPerCpu(resources)
  if (perCpu === null) {
    return Level.UNKNOWN
  }
  return perCpu > LOAD_WARNING_PER_CPU ? Level.WARNING : Level.OK
}

/**
 * Formats the load averages: "3.20 / 1.50 / 0.80".
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {String}
 */
export function formatLoadAvg(resources) {
  if (!resources || !Array.isArray(resources.load_avg)) {
    return '—'
  }
  return resources.load_avg
    .map((value) => (isNumber(value) ? value.toFixed(2) : '?'))
    .join(' / ')
}

/**
 * The worst of the highlight levels.
 *
 * @param {...String} levels - Level values.
 * @returns {String} Level value.
 */
export function worstLevel(...levels) {
  const order = [Level.CRITICAL, Level.WARNING, Level.OK, Level.UNKNOWN]
  for (let level of order) {
    if (levels.includes(level)) {
      return level
    }
  }
  return Level.UNKNOWN
}

/**
 * Overall health of the node host metrics.
 *
 * @param {Object|null} resources - NodeResources.
 * @returns {String} Level value.
 */
export function resourcesLevel(resources) {
  return worstLevel(
    diskLevel(resources),
    memLevel(resources),
    loadLevel(resources)
  )
}

/**
 * Display-ready description of the node host metrics: texts, tooltips and
 * highlight levels of the load, memory and disk cells.
 *
 * @param {Object} node - BuildNode.
 * @param {Number} now - Current timestamp, ms.
 * @returns {{missing, stale, staleText, updatedText, load, mem, disk}}
 *   load, mem and disk are null when the node sends no metrics.
 */
export function describeResources(node, now = Date.now()) {
  let r = node && node.resources
  let updatedAt = node && node.resources_updated_at
  let updatedText = updatedAt ? formatTimeAgo(updatedAt, now) : 'unknown'
  if (!r) {
    return {
      missing: true,
      stale: false,
      staleText: null,
      updatedText,
      load: null,
      mem: null,
      disk: null,
    }
  }
  let stale = isResourcesStale(node, now)
  let load1 = Array.isArray(r.load_avg) ? r.load_avg[0] : null
  let perCpu = loadPerCpu(r)
  let memUsed = memUsedPercent(r)
  let usedBytes =
    isNumber(r.mem_total_bytes) && isNumber(r.mem_available_bytes)
      ? r.mem_total_bytes - r.mem_available_bytes
      : null
  let diskFree = diskFreePercent(r)
  let staleText = null
  if (stale) {
    staleText = updatedAt
      ? `Metrics are stale: last updated ${updatedText}`
      : 'Metrics are stale: the update time is unknown'
  }
  return {
    missing: false,
    stale,
    staleText,
    updatedText,
    load: {
      level: loadLevel(r),
      text: isNumber(load1) ? load1.toFixed(2) : '—',
      sub: isNumber(r.cpu_count) ? `/ ${r.cpu_count} CPU` : '',
      percent: perCpu === null ? null : perCpu * 100,
      tooltip:
        `Load average (1 / 5 / 15 min): ${formatLoadAvg(r)}` +
        (isNumber(r.cpu_count) ? ` on ${r.cpu_count} CPUs` : ''),
    },
    mem: {
      level: memLevel(r),
      text: formatPercent(memUsed),
      percent: memUsed,
      tooltip:
        `${formatBytes(usedBytes)} used of ${formatBytes(r.mem_total_bytes)}, ` +
        `${formatBytes(r.mem_available_bytes)} available`,
    },
    disk: {
      level: diskLevel(r),
      text: formatBytes(r.disk_free_bytes),
      sub: formatPercent(diskFree),
      percent: diskFree,
      tooltip:
        `${r.disk_path || 'disk'}: ${formatBytes(r.disk_free_bytes)} free ` +
        `of ${formatBytes(r.disk_total_bytes)}`,
    },
  }
}

/**
 * CSS classes highlighting a value of the given level.
 *
 * @param {String} level - Level value.
 * @returns {String}
 */
export function levelClass(level) {
  switch (level) {
    case Level.CRITICAL:
      return 'text-negative text-weight-bold'
    case Level.WARNING:
      return 'text-orange-9 text-weight-bold'
    default:
      return ''
  }
}

/**
 * Tells whether the node takes new tasks: it is online, enabled, not
 * drained and not under maintenance. The web server counts the slots of
 * the queue summary over such nodes only.
 *
 * @param {Object} node - BuildNode.
 * @returns {Boolean}
 */
export function nodeAcceptsTasks(node) {
  return (
    !!node &&
    !!node.online &&
    node.enabled !== false &&
    !node.drain &&
    !node.maintenance
  )
}

/**
 * Busy and total slots of the nodes taking new tasks, comparable with each
 * other, and the tasks running on the other nodes (drained, disabled,
 * offline or under maintenance).
 *
 * @param {Array<Object>} nodes - BuildNode list.
 * @returns {{busy, slots, otherBusy}}
 */
export function slotTotals(nodes) {
  let totals = {busy: 0, slots: 0, otherBusy: 0}
  for (let node of nodes || []) {
    let usage = slotUsage(node)
    if (nodeAcceptsTasks(node)) {
      totals.busy += usage.active
      totals.slots += usage.capacity
    } else {
      totals.otherBusy += usage.active
    }
  }
  return totals
}

const QUEUE_HINTS = {
  no_nodes: 'Tasks are queued but no online node can take them',
  unregistered:
    'Tasks are queued and no registered node takes them: tasks are built ' +
    'by nodes not in the registry',
  busy: 'Tasks are queued and every slot is busy',
}

/**
 * Describes a row of the queue summary.
 *
 * total_capacity counts the slots of the online nodes taking new tasks
 * only, while active_tasks counts every running task, including the ones
 * on drained or disabled nodes and on the old nodes that are not in the
 * registry. The slots are compared with accepting_active_tasks, the tasks
 * running on the nodes taking new tasks; a server without this field
 * falls back to active_tasks.
 *
 * Levels: critical when tasks are queued and no online node takes them,
 * warning when they are queued while every slot is busy, or while no
 * registered node takes them but nodes outside the registry build tasks
 * (a rollout with old build nodes).
 *
 * @param {Object} row - Item of the /build_nodes/queue response.
 * @returns {{level, reason, hint, busy, total, unregistered, ratio,
 *   overloaded}} reason is null, 'no_nodes', 'unregistered' or 'busy'.
 */
export function describeQueueRow(row) {
  let total = row && isNumber(row.total_capacity) ? row.total_capacity : 0
  let active = row && isNumber(row.active_tasks) ? row.active_tasks : 0
  let busy =
    row && isNumber(row.accepting_active_tasks)
      ? row.accepting_active_tasks
      : active
  let hasUnregistered = row && isNumber(row.unregistered_active_tasks)
  let unregistered = hasUnregistered ? row.unregistered_active_tasks : 0
  let reason = null
  if (row && row.queued_tasks > 0) {
    if (!(row.online_nodes > 0) || !(total > 0)) {
      // an old server does not tell which nodes build the running tasks
      let buildsElsewhere = hasUnregistered ? unregistered > 0 : active > 0
      reason =
        !(row.online_nodes > 0) && buildsElsewhere ? 'unregistered' : 'no_nodes'
    } else if (busy >= total) {
      reason = 'busy'
    }
  }
  let level = Level.OK
  if (reason === 'no_nodes') {
    level = Level.CRITICAL
  } else if (reason) {
    level = Level.WARNING
  }
  let ratio
  if (total > 0) {
    ratio = Math.min(1, busy / total)
  } else {
    ratio = busy > 0 ? 1 : 0
  }
  return {
    level,
    reason,
    hint: reason ? QUEUE_HINTS[reason] : '',
    busy,
    total,
    unregistered,
    ratio,
    overloaded: busy > total,
  }
}

/**
 * Highlight level of a queue summary row, see describeQueueRow().
 *
 * @param {Object} row - Item of the /build_nodes/queue response.
 * @returns {String} Level value.
 */
export function queueLevel(row) {
  return describeQueueRow(row).level
}

/**
 * How long the task has been running (active tasks) or has run (finished
 * tasks).
 *
 * @param {Object} task - Active or recent task of a node.
 * @param {Number} now - Current timestamp, ms.
 * @returns {Number|null} Duration, ms.
 */
export function taskDurationMs(task, now = Date.now()) {
  if (!task) {
    return null
  }
  let claimed = parseApiDate(task.claimed_at)
  if (!claimed) {
    return null
  }
  let finished = parseApiDate(task.finished_at)
  let end = finished ? finished.getTime() : now
  return Math.max(0, end - claimed.getTime())
}

/**
 * Tells whether an active task has been running for too long.
 *
 * @param {Object} task - Active task of a node.
 * @param {Number} now - Current timestamp, ms.
 * @returns {Boolean}
 */
export function isLongRunningTask(task, now = Date.now()) {
  if (!task || parseApiDate(task.finished_at)) {
    return false
  }
  let duration = taskDurationMs(task, now)
  return duration !== null && duration > LONG_RUNNING_TASK_MS
}

const TASK_STATUS_BY_NAME = {
  idle: BuildStatus.IDLE,
  started: BuildStatus.STARTED,
  completed: BuildStatus.COMPLETED,
  done: BuildStatus.COMPLETED,
  failed: BuildStatus.FAILED,
  excluded: BuildStatus.EXCLUDED,
  cancelled: BuildStatus.CANCELLED,
}

/**
 * Text and color of a build task status. The status may come either as a
 * BuildTaskStatus number or as its name.
 *
 * @param {Number|String} status - Task status.
 * @returns {{text, color}}
 */
export function taskStatusInfo(status) {
  let code = status
  if (typeof status === 'string') {
    let name = status.toLowerCase().replace(/^.*\./, '')
    code = name in TASK_STATUS_BY_NAME ? TASK_STATUS_BY_NAME[name] : status
  }
  if (isNumber(code) && code in BuildStatus.text) {
    let color = BuildStatus.color[code]
    return {
      text: BuildStatus.text[code],
      color: color === 'faded' ? 'grey-6' : color,
    }
  }
  if (status === null || status === undefined || status === '') {
    return {text: 'unknown', color: 'grey-6'}
  }
  return {text: String(status), color: 'grey-6'}
}

/**
 * Package name of a task, guessed from its ref URL: the repository name of
 * a git URL or the name of a src-RPM.
 *
 * @param {String|null} refUrl - Task ref URL.
 * @returns {String}
 */
export function packageNameFromRef(refUrl) {
  if (!refUrl) {
    return ''
  }
  let url = String(refUrl)
  try {
    url = decodeURIComponent(url)
  } catch (e) {
    // keep the URL as is
  }
  let last = url
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .split('/')
    .pop()
  let srpm = last.match(/^(.+)-[^-]+-[^-]+\.src\.rpm$/i)
  if (srpm) {
    return srpm[1]
  }
  return last.replace(/\.git$/i, '')
}

/**
 * Validates a manual slot limit typed by the user.
 *
 * @param {String|Number} value - Typed value.
 * @param {Number|null} max - Highest allowed limit: the slots the node
 *   reports, since a limit cannot raise them.
 * @returns {Boolean|String} true or an error message.
 */
export function validateCapacityOverride(value, max = null) {
  if (value === null || value === undefined || value === '') {
    return 'Enter the number of slots'
  }
  let number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    return 'Must be a non-negative integer'
  }
  if (isNumber(max) && number > max) {
    return `Must be at most ${max}, the slots the node reports`
  }
  return true
}

const REQUEST_PARTS = ['body', 'query', 'path', 'header', 'cookie']

/**
 * Formats one FastAPI validation error: "capacity_override: Input should be
 * greater than or equal to 0". The request part ("body", "query"...) is
 * dropped from the location.
 *
 * @param {Object|String} item - Item of a 422 detail list.
 * @returns {String}
 */
function formatValidationError(item) {
  if (!item || typeof item !== 'object') {
    return item === null || item === undefined ? '' : String(item)
  }
  if (typeof item.msg !== 'string') {
    return JSON.stringify(item)
  }
  let loc = Array.isArray(item.loc) ? item.loc.slice() : []
  if (loc.length > 1 && REQUEST_PARTS.includes(loc[0])) {
    loc.shift()
  }
  let where = loc.join('.')
  return where ? `${where}: ${item.msg}` : item.msg
}

/**
 * Turns the detail of an API error response into text. FastAPI sends a
 * string for HTTPException and a list of {loc, msg, type} objects for
 * request validation errors (HTTP 422); the first one is shown.
 *
 * @param {*} detail - "detail" of the response body.
 * @returns {String}
 */
export function formatErrorDetail(detail) {
  if (detail === null || detail === undefined || detail === '') {
    return ''
  }
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    if (!detail.length) {
      return ''
    }
    let text = formatValidationError(detail[0])
    let more = detail.length - 1
    return more ? `${text} (and ${more} more)` : text
  }
  if (typeof detail === 'object' && typeof detail.msg === 'string') {
    return formatValidationError(detail)
  }
  return JSON.stringify(detail)
}

/**
 * Turns an API error into a message for the user. 404 and network errors
 * usually mean the build nodes API is not deployed on the server yet.
 *
 * @param {Error} error - Axios error, or any error thrown while requesting.
 * @returns {{kind, status, message}}
 *   kind is one of 'not_found', 'network', 'forbidden', 'unauthorized',
 *   'server'.
 */
export function describeApiError(error) {
  let response = error && error.response
  if (!response) {
    return {
      kind: 'network',
      status: null,
      message:
        'Cannot reach the build system API. Check the network connection ' +
        'or try again later.',
    }
  }
  let status = response.status
  let detail = formatErrorDetail(response.data && response.data.detail)
  if (status === 404) {
    return {
      kind: 'not_found',
      status,
      message:
        'The build nodes API is not available on this server yet ' +
        '(HTTP 404).',
    }
  }
  if (status === 401) {
    return {kind: 'unauthorized', status, message: 'Please log in again.'}
  }
  if (status === 403) {
    // the server says just "Forbidden" or "Not authenticated"
    let reason = detail && detail !== 'Forbidden' ? `: ${detail}` : ''
    return {
      kind: 'forbidden',
      status,
      message: `Access denied (HTTP 403)${reason}.`,
    }
  }
  let statusText = response.statusText ? ` ${response.statusText}` : ''
  return {
    kind: 'server',
    status,
    message: detail
      ? `HTTP ${status}: ${detail}`
      : `The server responded with HTTP ${status}${statusText}.`,
  }
}

/**
 * Tells whether the error described by describeApiError() is a 401 or a
 * 403: the API interceptor already reports them, and polling again would
 * only repeat the same message.
 *
 * @param {Object|null} info - Result of describeApiError().
 * @returns {Boolean}
 */
export function isAuthError(info) {
  return !!info && (info.kind === 'forbidden' || info.kind === 'unauthorized')
}
