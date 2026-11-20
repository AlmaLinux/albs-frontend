// Unit tests of the build nodes helpers, run with the Node.js built-in
// test runner: npm test
import {describe, test} from 'node:test'
import assert from 'node:assert/strict'

import {
  DISK_FREE_CRITICAL_BYTES,
  LONG_RUNNING_TASK_MS,
  Level,
  NODE_VERSION_HINT,
  NODE_VERSION_MISSING_HINT,
  NodeStatus,
  RESOURCES_STALE_AFTER_MS,
  capacityLimitHint,
  capacityLimitInfo,
  describeApiError,
  describeNodeVersion,
  describeQueueRow,
  describeResources,
  diskFreePercent,
  diskLevel,
  effectiveCapacity,
  formatBytes,
  formatDuration,
  formatErrorDetail,
  formatLoadAvg,
  formatPercent,
  formatTimeAgo,
  isAuthError,
  isLongRunningTask,
  isResourcesStale,
  levelClass,
  loadLevel,
  loadPerCpu,
  memLevel,
  memUsedPercent,
  msSince,
  nodeAcceptsTasks,
  nodeStatus,
  nodeStatusBadges,
  nodeStatusKeys,
  nodeStatusRank,
  packageNameFromRef,
  parseApiDate,
  queueLevel,
  resourcesLevel,
  slotTotals,
  slotUsage,
  taskDurationMs,
  taskStatusInfo,
  validateCapacityOverride,
  worstLevel,
} from '../src/buildNodeUtils.js'

const GiB = 1024 ** 3
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const NOW = Date.parse('2026-11-18T12:00:00Z')

// The web server serializes naive UTC datetimes with microseconds and no
// timezone designator, e.g. "2026-11-18T11:59:50.000000"
function iso(msAgo) {
  return new Date(NOW - msAgo).toISOString().replace(/Z$/, '000')
}

function node(overrides = {}) {
  return {
    id: 1,
    name: 'node-1',
    enabled: true,
    drain: false,
    maintenance: false,
    online: true,
    last_seen: iso(10 * 1000),
    capacity: 4,
    capacity_override: null,
    effective_capacity: 4,
    active_tasks_count: 2,
    resources: null,
    resources_updated_at: null,
    ...overrides,
  }
}

function resources(overrides = {}) {
  return {
    cpu_count: 8,
    load_avg: [2, 1.5, 1],
    mem_total_bytes: 32 * GiB,
    mem_available_bytes: 16 * GiB,
    disk_path: '/srv',
    disk_total_bytes: 1000 * GiB,
    disk_free_bytes: 500 * GiB,
    ...overrides,
  }
}

describe('parseApiDate', () => {
  test('reads naive datetimes as UTC', () => {
    assert.equal(
      parseApiDate('2026-11-18T11:55:00.123456').toISOString(),
      '2026-11-18T11:55:00.123Z'
    )
    assert.equal(
      parseApiDate('2026-11-18 11:55:00').toISOString(),
      '2026-11-18T11:55:00.000Z'
    )
  })

  test('respects explicit timezones', () => {
    assert.equal(
      parseApiDate('2026-11-18T14:55:00+03:00').toISOString(),
      '2026-11-18T11:55:00.000Z'
    )
    assert.equal(
      parseApiDate('2026-11-18T11:55:00Z').toISOString(),
      '2026-11-18T11:55:00.000Z'
    )
  })

  test('returns null for missing or invalid values', () => {
    assert.equal(parseApiDate(null), null)
    assert.equal(parseApiDate(undefined), null)
    assert.equal(parseApiDate(''), null)
    assert.equal(parseApiDate('not a date'), null)
  })

  test('fixtures look like the server datetimes', () => {
    assert.equal(iso(10 * 1000), '2026-11-18T11:59:50.000000')
    assert.equal(parseApiDate(iso(10 * 1000)).getTime(), NOW - 10 * 1000)
  })

  test('msSince clamps future datetimes to zero', () => {
    assert.equal(msSince(iso(-5 * MINUTE), NOW), 0)
    assert.equal(msSince(iso(5 * MINUTE), NOW), 5 * MINUTE)
    assert.equal(msSince(null, NOW), null)
  })
})

describe('formatting', () => {
  test('formatTimeAgo', () => {
    assert.equal(formatTimeAgo(iso(30 * 1000), NOW), 'just now')
    assert.equal(formatTimeAgo(iso(12 * MINUTE), NOW), '12 min ago')
    assert.equal(formatTimeAgo(iso(3 * HOUR + 5 * MINUTE), NOW), '3 h ago')
    assert.equal(formatTimeAgo(iso(50 * HOUR), NOW), '2 d ago')
    assert.equal(formatTimeAgo(null, NOW), 'never')
    assert.equal(formatTimeAgo(null, NOW, '—'), '—')
  })

  test('formatDuration', () => {
    assert.equal(formatDuration(45 * 1000), '45 s')
    assert.equal(formatDuration(12 * MINUTE + 59 * 1000), '12 min')
    assert.equal(formatDuration(3 * HOUR + 5 * MINUTE), '3 h 05 min')
    assert.equal(formatDuration(6 * HOUR), '6 h')
    assert.equal(formatDuration(52 * HOUR), '2 d 4 h')
    assert.equal(formatDuration(48 * HOUR), '2 d')
    assert.equal(formatDuration(null), '—')
    assert.equal(formatDuration(-1), '—')
  })

  test('formatBytes', () => {
    assert.equal(formatBytes(512), '512 B')
    assert.equal(formatBytes(1536), '1.5 KiB')
    assert.equal(formatBytes(1.5 * GiB), '1.5 GiB')
    assert.equal(formatBytes(120 * GiB), '120 GiB')
    assert.equal(formatBytes(2048 * GiB), '2.0 TiB')
    assert.equal(formatBytes(null), '—')
  })

  test('formatPercent', () => {
    assert.equal(formatPercent(42.4), '42%')
    assert.equal(formatPercent(9.46), '9.5%')
    assert.equal(formatPercent(0), '0%')
    assert.equal(formatPercent(null), '—')
  })

  test('formatLoadAvg', () => {
    assert.equal(formatLoadAvg(resources()), '2.00 / 1.50 / 1.00')
    assert.equal(formatLoadAvg(null), '—')
  })

  test('packageNameFromRef', () => {
    assert.equal(
      packageNameFromRef('https://git.almalinux.org/rpms/bash.git'),
      'bash'
    )
    assert.equal(packageNameFromRef('https://github.com/AlmaLinux/foo/'), 'foo')
    assert.equal(
      packageNameFromRef(
        'https://example.org/pkgs/python3-libs-3.9.18-1.el9.src.rpm'
      ),
      'python3-libs'
    )
    assert.equal(packageNameFromRef(null), '')
  })
})

describe('node status', () => {
  test('a healthy node is online', () => {
    assert.equal(nodeStatus(node()), NodeStatus.ONLINE)
    assert.deepEqual(nodeStatusKeys(node()), [NodeStatus.ONLINE])
  })

  test('offline when the server says so, whatever last_seen is', () => {
    let offline = node({online: false, last_seen: iso(10 * 1000)})
    assert.equal(nodeStatus(offline), NodeStatus.OFFLINE)
  })

  test('drain of an online node keeps the online badge', () => {
    let draining = node({drain: true})
    assert.equal(nodeStatus(draining), NodeStatus.DRAIN)
    assert.deepEqual(nodeStatusKeys(draining), [
      NodeStatus.DRAIN,
      NodeStatus.ONLINE,
    ])
  })

  test('priority: disabled > maintenance > offline > drain', () => {
    let all = node({
      enabled: false,
      maintenance: true,
      online: false,
      drain: true,
    })
    assert.deepEqual(nodeStatusKeys(all), [
      NodeStatus.DISABLED,
      NodeStatus.MAINTENANCE,
      NodeStatus.OFFLINE,
      NodeStatus.DRAIN,
    ])
    assert.equal(
      nodeStatus(node({maintenance: true, online: false})),
      'maintenance'
    )
    assert.equal(nodeStatus(node({drain: true, online: false})), 'offline')
    assert.ok(nodeStatusRank(all) < nodeStatusRank(node()))
  })

  test('offline badge tells when the node was last seen', () => {
    let [badge] = nodeStatusBadges(
      node({online: false, last_seen: iso(7 * MINUTE)}),
      NOW
    )
    assert.equal(badge.key, NodeStatus.OFFLINE)
    assert.equal(badge.description, 'Last seen 7 min ago')
    let [never] = nodeStatusBadges(node({online: false, last_seen: null}), NOW)
    assert.equal(never.description, 'The node has never been seen')
  })
})

describe('slotUsage', () => {
  test('ratio and override marker', () => {
    let usage = slotUsage(
      node({active_tasks_count: 3, effective_capacity: 4, capacity_override: 4})
    )
    assert.equal(usage.active, 3)
    assert.equal(usage.capacity, 4)
    assert.equal(usage.ratio, 0.75)
    assert.equal(usage.overridden, true)
    assert.equal(usage.overloaded, false)
    assert.equal(slotUsage(node()).overridden, false)
  })

  test('a zero override is still an override', () => {
    let usage = slotUsage(
      node({capacity_override: 0, effective_capacity: 0, active_tasks_count: 0})
    )
    assert.equal(usage.overridden, true)
    assert.equal(usage.ratio, 0)
  })

  test('more tasks than slots is overloaded, ratio is clamped', () => {
    let usage = slotUsage(node({active_tasks_count: 3, effective_capacity: 2}))
    assert.equal(usage.overloaded, true)
    assert.equal(usage.ratio, 1)
    assert.equal(usage.percent, 150)
    let zero = slotUsage(node({active_tasks_count: 1, effective_capacity: 0}))
    assert.equal(zero.overloaded, true)
    assert.equal(zero.ratio, 1)
  })
})

describe('disk thresholds', () => {
  test('plenty of space is ok', () => {
    assert.equal(diskLevel(resources()), Level.OK)
    assert.equal(diskFreePercent(resources()), 50)
  })

  test('below 20% is a warning', () => {
    let r = resources({disk_free_bytes: 190 * GiB})
    assert.equal(diskLevel(r), Level.WARNING)
  })

  test('exactly 20% is not a warning yet', () => {
    let r = resources({disk_free_bytes: 200 * GiB})
    assert.equal(diskLevel(r), Level.OK)
  })

  test('below 10% is critical', () => {
    let r = resources({disk_free_bytes: 99 * GiB})
    assert.equal(diskLevel(r), Level.CRITICAL)
  })

  test('below 20 GiB is critical even if the percentage is fine', () => {
    let r = resources({
      disk_total_bytes: 50 * GiB,
      disk_free_bytes: DISK_FREE_CRITICAL_BYTES - 1,
    })
    assert.ok(diskFreePercent(r) > 20)
    assert.equal(diskLevel(r), Level.CRITICAL)
  })

  test('unknown without data', () => {
    assert.equal(diskLevel(null), Level.UNKNOWN)
    assert.equal(diskLevel(resources({disk_total_bytes: 0})), Level.UNKNOWN)
  })
})

describe('memory thresholds', () => {
  test('used percentage', () => {
    assert.equal(memUsedPercent(resources()), 50)
    assert.equal(memUsedPercent(null), null)
  })

  test('critical below 10% available', () => {
    assert.equal(memLevel(resources()), Level.OK)
    assert.equal(
      memLevel(resources({mem_available_bytes: 3.3 * GiB})),
      Level.OK
    )
    assert.equal(
      memLevel(resources({mem_available_bytes: 3 * GiB})),
      Level.CRITICAL
    )
    assert.equal(memLevel(null), Level.UNKNOWN)
  })
})

describe('load thresholds', () => {
  test('warning when load_avg[0] exceeds cpu_count', () => {
    assert.equal(loadPerCpu(resources()), 0.25)
    assert.equal(loadLevel(resources({load_avg: [8, 9, 9]})), Level.OK)
    assert.equal(loadLevel(resources({load_avg: [8.01, 1, 1]})), Level.WARNING)
    assert.equal(loadLevel(resources({cpu_count: 0})), Level.UNKNOWN)
    assert.equal(loadLevel(null), Level.UNKNOWN)
  })

  test('overall level is the worst one', () => {
    assert.equal(resourcesLevel(resources()), Level.OK)
    assert.equal(
      resourcesLevel(resources({load_avg: [10, 1, 1]})),
      Level.WARNING
    )
    assert.equal(
      resourcesLevel(
        resources({load_avg: [10, 1, 1], mem_available_bytes: 1 * GiB})
      ),
      Level.CRITICAL
    )
    assert.equal(resourcesLevel(null), Level.UNKNOWN)
    assert.equal(worstLevel(Level.OK, Level.UNKNOWN), Level.OK)
  })

  test('levelClass', () => {
    assert.match(levelClass(Level.CRITICAL), /text-negative/)
    assert.match(levelClass(Level.WARNING), /text-orange/)
    assert.equal(levelClass(Level.OK), '')
    assert.equal(levelClass(Level.UNKNOWN), '')
  })
})

describe('stale metrics', () => {
  test('fresh metrics are not stale', () => {
    let n = node({resources: resources(), resources_updated_at: iso(MINUTE)})
    assert.equal(isResourcesStale(n, NOW), false)
  })

  test('metrics older than the threshold are stale', () => {
    let n = node({
      resources: resources(),
      resources_updated_at: iso(RESOURCES_STALE_AFTER_MS + 1000),
    })
    assert.equal(isResourcesStale(n, NOW), true)
  })

  test('metrics without a timestamp are stale, missing ones are not', () => {
    assert.equal(isResourcesStale(node({resources: resources()}), NOW), true)
    assert.equal(isResourcesStale(node(), NOW), false)
  })
})

describe('describeResources', () => {
  test('no metrics', () => {
    let info = describeResources(node(), NOW)
    assert.equal(info.missing, true)
    assert.equal(info.stale, false)
    assert.equal(info.disk, null)
  })

  test('cells with levels and texts', () => {
    let info = describeResources(
      node({
        resources: resources({
          load_avg: [9.5, 4, 2],
          mem_available_bytes: 2 * GiB,
          disk_free_bytes: 150 * GiB,
        }),
        resources_updated_at: iso(MINUTE),
      }),
      NOW
    )
    assert.equal(info.missing, false)
    assert.equal(info.stale, false)
    assert.equal(info.staleText, null)
    assert.equal(info.load.level, Level.WARNING)
    assert.equal(info.load.text, '9.50')
    assert.equal(info.load.sub, '/ 8 CPU')
    assert.equal(info.mem.level, Level.CRITICAL)
    assert.equal(info.mem.text, '94%')
    assert.equal(info.mem.tooltip, '30 GiB used of 32 GiB, 2.0 GiB available')
    assert.equal(info.disk.level, Level.WARNING)
    assert.equal(info.disk.text, '150 GiB')
    assert.equal(info.disk.sub, '15%')
    assert.equal(info.disk.tooltip, '/srv: 150 GiB free of 1000 GiB')
  })

  test('stale metrics say how old they are', () => {
    let info = describeResources(
      node({resources: resources(), resources_updated_at: iso(12 * MINUTE)}),
      NOW
    )
    assert.equal(info.stale, true)
    assert.equal(info.staleText, 'Metrics are stale: last updated 12 min ago')
  })
})

function queueRow(overrides = {}) {
  return {
    arch: 'x86_64',
    queued_tasks: 5,
    online_nodes: 2,
    total_capacity: 8,
    active_tasks: 4,
    accepting_active_tasks: 4,
    unregistered_active_tasks: 0,
    ...overrides,
  }
}

describe('queue level', () => {
  test('queued tasks with no online node are critical', () => {
    let row = queueRow({
      arch: 'ppc64le',
      queued_tasks: 3,
      online_nodes: 0,
      total_capacity: 0,
      active_tasks: 0,
      accepting_active_tasks: 0,
    })
    assert.equal(queueLevel(row), Level.CRITICAL)
    let info = describeQueueRow(row)
    assert.equal(info.reason, 'no_nodes')
    assert.match(info.hint, /no online node can take them/)
  })

  test('queued tasks with every accepting slot busy are a warning', () => {
    let row = queueRow({active_tasks: 8, accepting_active_tasks: 8})
    assert.equal(queueLevel(row), Level.WARNING)
    assert.equal(describeQueueRow(row).reason, 'busy')
  })

  test('tasks of a drained node do not take the accepting slots', () => {
    // one drained node finishes 4 tasks, the other one has 4 free slots
    let row = queueRow({
      online_nodes: 1,
      total_capacity: 4,
      active_tasks: 4,
      accepting_active_tasks: 0,
    })
    assert.equal(queueLevel(row), Level.OK)
    let info = describeQueueRow(row)
    assert.equal(info.busy, 0)
    assert.equal(info.total, 4)
    assert.equal(info.ratio, 0)
    assert.equal(info.overloaded, false)
  })

  test('a drained node with tasks and no accepting node is critical', () => {
    let row = queueRow({
      online_nodes: 0,
      total_capacity: 0,
      active_tasks: 3,
      accepting_active_tasks: 0,
      unregistered_active_tasks: 0,
    })
    assert.equal(queueLevel(row), Level.CRITICAL)
  })

  test('an empty registry with old nodes building is a warning', () => {
    let row = queueRow({
      online_nodes: 0,
      total_capacity: 0,
      active_tasks: 6,
      accepting_active_tasks: 0,
      unregistered_active_tasks: 6,
    })
    let info = describeQueueRow(row)
    assert.equal(info.level, Level.WARNING)
    assert.equal(info.reason, 'unregistered')
    assert.match(info.hint, /built by nodes not in the registry/)
    assert.equal(info.unregistered, 6)
    assert.equal(info.ratio, 0)
  })

  test('unregistered tasks next to accepting nodes do not busy the slots', () => {
    let row = queueRow({
      active_tasks: 7,
      accepting_active_tasks: 4,
      unregistered_active_tasks: 3,
    })
    let info = describeQueueRow(row)
    assert.equal(info.level, Level.OK)
    assert.equal(info.busy, 4)
    assert.equal(info.unregistered, 3)
  })

  test('an old server without the new fields uses active_tasks', () => {
    let old = (overrides) => {
      let row = queueRow(overrides)
      delete row.accepting_active_tasks
      delete row.unregistered_active_tasks
      return row
    }
    let busy = old({active_tasks: 8})
    assert.equal(queueLevel(busy), Level.WARNING)
    assert.equal(describeQueueRow(busy).busy, 8)
    assert.equal(describeQueueRow(busy).unregistered, 0)
    assert.equal(queueLevel(old({active_tasks: 3})), Level.OK)
    let empty = {online_nodes: 0, total_capacity: 0}
    assert.equal(queueLevel(old({...empty, active_tasks: 2})), Level.WARNING)
    assert.equal(queueLevel(old({...empty, active_tasks: 0})), Level.CRITICAL)
  })

  test('more busy than total slots is overloaded, ratio is clamped', () => {
    let info = describeQueueRow(
      queueRow({total_capacity: 4, accepting_active_tasks: 6})
    )
    assert.equal(info.overloaded, true)
    assert.equal(info.ratio, 1)
  })

  test('an empty queue is fine even without nodes', () => {
    let row = queueRow({
      arch: 's390x',
      queued_tasks: 0,
      online_nodes: 0,
      total_capacity: 0,
      active_tasks: 0,
      accepting_active_tasks: 0,
    })
    assert.equal(queueLevel(row), Level.OK)
    assert.equal(describeQueueRow(row).hint, '')
    assert.equal(queueLevel(null), Level.OK)
  })
})

describe('slot totals', () => {
  test('a node takes tasks when online, enabled and not drained', () => {
    assert.equal(nodeAcceptsTasks(node()), true)
    assert.equal(nodeAcceptsTasks(node({drain: true})), false)
    assert.equal(nodeAcceptsTasks(node({maintenance: true})), false)
    assert.equal(nodeAcceptsTasks(node({enabled: false})), false)
    assert.equal(nodeAcceptsTasks(node({online: false})), false)
    assert.equal(nodeAcceptsTasks(null), false)
  })

  test('busy and total slots count the accepting nodes only', () => {
    let totals = slotTotals([
      node({active_tasks_count: 2, effective_capacity: 4}),
      node({drain: true, active_tasks_count: 4, effective_capacity: 4}),
      node({enabled: false, active_tasks_count: 1, effective_capacity: 2}),
      node({online: false, active_tasks_count: 0, effective_capacity: 8}),
    ])
    assert.deepEqual(totals, {busy: 2, slots: 4, otherBusy: 5})
    assert.deepEqual(slotTotals(null), {busy: 0, slots: 0, otherBusy: 0})
  })
})

describe('tasks', () => {
  test('duration of active and finished tasks', () => {
    assert.equal(taskDurationMs({claimed_at: iso(2 * HOUR)}, NOW), 2 * HOUR)
    assert.equal(
      taskDurationMs({claimed_at: iso(3 * HOUR), finished_at: iso(HOUR)}, NOW),
      2 * HOUR
    )
    assert.equal(taskDurationMs({claimed_at: null}, NOW), null)
  })

  test('long running tasks', () => {
    let long = {claimed_at: iso(LONG_RUNNING_TASK_MS + MINUTE)}
    let short = {claimed_at: iso(LONG_RUNNING_TASK_MS - MINUTE)}
    let finished = {...long, finished_at: iso(0)}
    assert.equal(isLongRunningTask(long, NOW), true)
    assert.equal(isLongRunningTask(short, NOW), false)
    assert.equal(isLongRunningTask(finished, NOW), false)
  })

  test('task status from a number or a name', () => {
    assert.deepEqual(taskStatusInfo(2), {text: 'done', color: 'primary'})
    assert.deepEqual(taskStatusInfo(3), {text: 'failed', color: 'negative'})
    assert.equal(taskStatusInfo(0).color, 'grey-6')
    assert.equal(taskStatusInfo('failed').text, 'failed')
    assert.equal(taskStatusInfo('BuildTaskStatus.COMPLETED').text, 'done')
    assert.equal(taskStatusInfo('weird').text, 'weird')
    assert.equal(taskStatusInfo(null).text, 'unknown')
  })
})

describe('validateCapacityOverride', () => {
  test('accepts non-negative integers', () => {
    assert.equal(validateCapacityOverride('4'), true)
    assert.equal(validateCapacityOverride(0), true)
  })

  test('rejects anything else', () => {
    assert.equal(typeof validateCapacityOverride(''), 'string')
    assert.equal(typeof validateCapacityOverride('-1'), 'string')
    assert.equal(typeof validateCapacityOverride('1.5'), 'string')
    assert.equal(typeof validateCapacityOverride('abc'), 'string')
  })

  test('rejects a limit above the reported slots', () => {
    assert.equal(validateCapacityOverride('4', 4), true)
    assert.equal(
      validateCapacityOverride('5', 4),
      'Must be at most 4, the slots the node reports'
    )
    assert.equal(validateCapacityOverride('50', null), true)
  })
})

describe('slot limit', () => {
  test('effective capacity is computed like the server does', () => {
    assert.equal(effectiveCapacity(4, null), 4)
    assert.equal(effectiveCapacity(4, 2), 2)
    // a limit can only lower the reported slots
    assert.equal(effectiveCapacity(4, 8), 4)
    assert.equal(effectiveCapacity(4, 0), 0)
    // a node that has not reported its slots gets one
    assert.equal(effectiveCapacity(0, null), 1)
    assert.equal(effectiveCapacity(0, 3), 3)
    assert.equal(effectiveCapacity(0, 0), 0)
    assert.equal(effectiveCapacity(null, undefined), 1)
  })

  test('dialog values of a node reporting its slots', () => {
    let info = capacityLimitInfo(
      node({capacity: 4, capacity_override: 2, effective_capacity: 2})
    )
    assert.equal(info.initial, 2)
    assert.equal(info.max, 4)
    assert.equal(info.resetTo, 4)
    assert.equal(info.reported, 4)
    assert.equal(info.hasOverride, true)
    assert.match(info.description, /^The node reports 4 slot\(s\)\./)
    assert.match(info.description, /limits the slots to at most/)
    assert.equal(info.tooltip, 'Manual slot limit 2, the node reports 4')
    assert.equal(capacityLimitInfo(node()).initial, 4)
    assert.equal(capacityLimitInfo(node()).hasOverride, false)
  })

  test('dialog values of a node that has not reported its slots', () => {
    let info = capacityLimitInfo(
      node({capacity: 0, capacity_override: null, effective_capacity: 1})
    )
    // starts from the slot actually used, not from the reported 0
    assert.equal(info.initial, 1)
    assert.equal(info.max, null)
    assert.equal(info.resetTo, 1)
    assert.equal(info.reported, null)
    assert.match(
      info.description,
      /^The node has not reported its slots, 1 slot is used\./
    )
    let limited = capacityLimitInfo(
      node({capacity: 0, capacity_override: 3, effective_capacity: 3})
    )
    assert.equal(limited.initial, 3)
    assert.equal(
      limited.tooltip,
      'Manual slot limit 3, the node has not reported its slots'
    )
  })

  test('initial value falls back to the computed capacity', () => {
    let n = node({capacity: 0, capacity_override: null})
    delete n.effective_capacity
    assert.equal(capacityLimitInfo(n).initial, 1)
  })

  test('hint tells what the typed limit does', () => {
    let reported = node({capacity: 4})
    assert.equal(
      capacityLimitHint(reported, '3'),
      'Limits the slots to at most 3'
    )
    assert.equal(capacityLimitHint(reported, '0'), 'The node takes no tasks')
    assert.equal(capacityLimitHint(reported, '5'), '')
    assert.equal(capacityLimitHint(reported, ''), '')
    let unreported = node({capacity: 0, effective_capacity: 1})
    assert.equal(capacityLimitHint(unreported, '6'), 'Sets the slots to 6')
  })

  test('the tune mark shows only a limit that changes the slots', () => {
    let limited = (overrides) => slotUsage(node(overrides)).limited
    assert.equal(limited({capacity: 4, capacity_override: 2}), true)
    assert.equal(limited({capacity: 4, capacity_override: 0}), true)
    assert.equal(limited({capacity: 4, capacity_override: 4}), false)
    assert.equal(limited({capacity: 4, capacity_override: 8}), false)
    assert.equal(limited({capacity: 0, capacity_override: 6}), true)
    assert.equal(limited({capacity: 0, capacity_override: null}), false)
    assert.equal(limited({capacity: 4, capacity_override: null}), false)
  })
})

describe('describeApiError', () => {
  test('404 means the API is not deployed yet', () => {
    let info = describeApiError({response: {status: 404, data: {}}})
    assert.equal(info.kind, 'not_found')
    assert.match(info.message, /not available/)
  })

  test('no response is a network error', () => {
    assert.equal(describeApiError(new Error('Network Error')).kind, 'network')
    // the response interceptor throws a TypeError on network errors
    assert.equal(describeApiError(new TypeError('x')).kind, 'network')
    assert.equal(describeApiError(undefined).kind, 'network')
  })

  test('server errors carry the detail', () => {
    let info = describeApiError({
      response: {status: 409, data: {detail: 'The node is busy'}},
    })
    assert.equal(info.kind, 'server')
    assert.equal(info.message, 'HTTP 409: The node is busy')
    let bare = describeApiError({
      response: {status: 502, statusText: 'Bad Gateway', data: '<html>'},
    })
    assert.equal(
      bare.message,
      'The server responded with HTTP 502 Bad Gateway.'
    )
  })

  test('422 shows the first FastAPI validation error', () => {
    // the body FastAPI 0.115 returns for {"capacity_override": -1}
    let info = describeApiError({
      response: {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          detail: [
            {
              type: 'greater_than_equal',
              loc: ['body', 'capacity_override'],
              msg: 'Input should be greater than or equal to 0',
              input: -1,
              ctx: {ge: 0},
            },
          ],
        },
      },
    })
    assert.equal(info.kind, 'server')
    assert.equal(
      info.message,
      'HTTP 422: capacity_override: Input should be greater than or equal to 0'
    )
  })

  test('422 with several errors or an unusual location', () => {
    assert.equal(
      formatErrorDetail([
        {loc: ['path', 'node_id'], msg: 'Input should be a valid integer'},
        {loc: ['body', 'drain'], msg: 'Input should be a valid boolean'},
      ]),
      'node_id: Input should be a valid integer (and 1 more)'
    )
    assert.equal(
      formatErrorDetail([{loc: ['body'], msg: 'Field required'}]),
      'body: Field required'
    )
    assert.equal(formatErrorDetail([{msg: 'Bad value'}]), 'Bad value')
    assert.equal(formatErrorDetail([]), '')
    assert.equal(formatErrorDetail({code: 1}), '{"code":1}')
    assert.equal(formatErrorDetail(null), '')
  })

  test('403 is forbidden', () => {
    let info = describeApiError({response: {status: 403, data: {}}})
    assert.equal(info.kind, 'forbidden')
    assert.equal(info.message, 'Access denied (HTTP 403).')
    let generic = describeApiError({
      response: {status: 403, data: {detail: 'Forbidden'}},
    })
    assert.equal(generic.message, 'Access denied (HTTP 403).')
    let anonymous = describeApiError({
      response: {status: 403, data: {detail: 'Not authenticated'}},
    })
    assert.equal(
      anonymous.message,
      'Access denied (HTTP 403): Not authenticated.'
    )
  })

  test('401 and 403 stop the polling, other errors do not', () => {
    let error = (status) => describeApiError({response: {status, data: {}}})
    assert.equal(isAuthError(error(401)), true)
    assert.equal(isAuthError(error(403)), true)
    assert.equal(isAuthError(error(404)), false)
    assert.equal(isAuthError(error(500)), false)
    assert.equal(isAuthError(describeApiError(new Error('x'))), false)
    assert.equal(isAuthError(null), false)
  })
})

describe('describeNodeVersion', () => {
  test('shows the albs-node commit hash as it is', () => {
    const info = describeNodeVersion('e453d3f8dbfd')
    assert.equal(info.text, 'e453d3f8dbfd')
    assert.equal(info.commit, 'e453d3f8dbfd')
    assert.match(info.hint, /^albs-node commit e453d3f8dbfd /)
    assert.match(info.hint, /first 12 characters of the git hash/)
  })

  test('says why the version is missing', () => {
    for (const version of [null, undefined, '', '   ']) {
      const info = describeNodeVersion(version)
      assert.equal(info.text, '—', String(version))
      assert.equal(info.commit, null)
      assert.equal(info.hint, NODE_VERSION_MISSING_HINT)
    }
    assert.match(NODE_VERSION_MISSING_HINT, /older albs-node/)
    assert.match(NODE_VERSION_MISSING_HINT, /not deployed from a git clone/)
  })

  test('explains the column', () => {
    assert.match(NODE_VERSION_HINT, /albs-node commit/)
  })
})
