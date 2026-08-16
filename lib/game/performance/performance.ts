"use client"

export interface PerformanceSnapshot {
  fps: number
  frameTime: number
  maxFrameTime: number

  drawCalls: number
  triangles: number
  points: number
  lines: number

  geometries: number
  textures: number
  programs: number

  jsHeapUsed: number | null
  jsHeapTotal: number | null
  jsHeapLimit: number | null

  resources: {
    total: number
    scripts: number
    images: number
    fetches: number

    scriptTime: number
    imageTime: number
    fetchTime: number
  }

  longTasks: number
  lastLongTask: number

  navigationTime: number

  timestamp: number
}

type Listener = () => void

const EMPTY_SNAPSHOT: PerformanceSnapshot = {
  fps: 0,
  frameTime: 0,
  maxFrameTime: 0,

  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,

  geometries: 0,
  textures: 0,
  programs: 0,

  jsHeapUsed: null,
  jsHeapTotal: null,
  jsHeapLimit: null,

  resources: {
    total: 0,
    scripts: 0,
    images: 0,
    fetches: 0,

    scriptTime: 0,
    imageTime: 0,
    fetchTime: 0,
  },

  longTasks: 0,
  lastLongTask: 0,

  navigationTime: 0,

  timestamp: 0,
}

let snapshot: PerformanceSnapshot = EMPTY_SNAPSHOT

const listeners = new Set<Listener>()

let started = false

let frameCount = 0
let frameElapsed = 0
let frameMax = 0
let sampleStartedAt = 0

let longTaskCount = 0
let lastLongTask = 0

let resourceBaseline = 0

let publishTimer: number | null = null

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function getMemoryStats() {
  if (typeof performance === "undefined") {
    return {
      jsHeapUsed: null,
      jsHeapTotal: null,
      jsHeapLimit: null,
    }
  }

  const memory = (
    performance as Performance & {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }
  ).memory

  if (!memory) {
    return {
      jsHeapUsed: null,
      jsHeapTotal: null,
      jsHeapLimit: null,
    }
  }

  return {
    jsHeapUsed: memory.usedJSHeapSize,
    jsHeapTotal: memory.totalJSHeapSize,
    jsHeapLimit: memory.jsHeapSizeLimit,
  }
}

function getResourceStats() {
  if (typeof performance === "undefined") {
    return {
      total: 0,
      scripts: 0,
      images: 0,
      fetches: 0,

      scriptTime: 0,
      imageTime: 0,
      fetchTime: 0,
    }
  }

  const entries =
    performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[]

  let total = 0

  let scripts = 0
  let images = 0
  let fetches = 0

  let scriptTime = 0
  let imageTime = 0
  let fetchTime = 0

  for (const entry of entries) {
    if (
      entry.startTime <
      resourceBaseline
    ) {
      continue
    }

    total++

    const type =
      entry.initiatorType.toLowerCase()

    if (type === "script") {
      scripts++
      scriptTime += entry.duration
      continue
    }

    if (
      type === "img" ||
      type === "image"
    ) {
      images++
      imageTime += entry.duration
      continue
    }

    if (
      type === "fetch" ||
      type === "xmlhttprequest"
    ) {
      fetches++
      fetchTime += entry.duration
    }
  }

  return {
    total,
    scripts,
    images,
    fetches,

    scriptTime,
    imageTime,
    fetchTime,
  }
}

function getNavigationTime() {
  if (
    typeof performance ===
    "undefined"
  ) {
    return 0
  }

  const navigation =
    performance.getEntriesByType(
      "navigation",
    )[0] as
      | PerformanceNavigationTiming
      | undefined

  if (!navigation) {
    return 0
  }

  return navigation.duration
}

function publish(
  rendererInfo?: {
    render?: {
      calls: number
      triangles: number
      points: number
      lines: number
    }

    memory?: {
      geometries: number
      textures: number
    }

    programs?: unknown[]
  },
) {
  const now = performance.now()

  const elapsed =
    now - sampleStartedAt

  const fps =
    elapsed > 0
      ? (frameCount / elapsed) *
        1000
      : 0

  const frameTime =
    frameCount > 0
      ? elapsed / frameCount
      : 0

  const memory =
    getMemoryStats()

  const resources =
    getResourceStats()

  snapshot = {
    fps,
    frameTime,
    maxFrameTime: frameMax,

    drawCalls:
      rendererInfo?.render
        ?.calls ?? 0,

    triangles:
      rendererInfo?.render
        ?.triangles ?? 0,

    points:
      rendererInfo?.render
        ?.points ?? 0,

    lines:
      rendererInfo?.render
        ?.lines ?? 0,

    geometries:
      rendererInfo?.memory
        ?.geometries ?? 0,

    textures:
      rendererInfo?.memory
        ?.textures ?? 0,

    programs:
      rendererInfo?.programs
        ?.length ?? 0,

    ...memory,

    resources,

    longTasks:
      longTaskCount,

    lastLongTask,

    navigationTime:
      getNavigationTime(),

    timestamp: now,
  }

  frameCount = 0
  frameElapsed = 0
  frameMax = 0
  sampleStartedAt = now

  notify()
}

function startLongTaskObserver() {
  if (
    typeof PerformanceObserver ===
    "undefined"
  ) {
    return
  }

  try {
    const supported =
      PerformanceObserver.supportedEntryTypes

    if (
      !supported.includes(
        "longtask",
      )
    ) {
      return
    }

    const observer =
      new PerformanceObserver(
        (list) => {
          for (const entry of list.getEntries()) {
            longTaskCount++

            lastLongTask =
              entry.duration
          }
        },
      )

    observer.observe({
      entryTypes: ["longtask"],
    })
  } catch {
    // Long Task API is not available
    // in every browser.
  }
}

export function startPerformanceMonitor() {
  if (started) {
    return
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return
  }

  started = true

  resourceBaseline =
    performance.now()

  sampleStartedAt =
    performance.now()

  startLongTaskObserver()

  publishTimer = window.setInterval(
    () => {
      publish()
    },
    250,
  )
}

export function stopPerformanceMonitor() {
  if (
    publishTimer !== null
  ) {
    window.clearInterval(
      publishTimer,
    )

    publishTimer = null
  }

  started = false
}

export function recordFrame(
  deltaSeconds: number,
  rendererInfo: {
    render: {
      calls: number
      triangles: number
      points: number
      lines: number
    }

    memory: {
      geometries: number
      textures: number
    }

    programs?: unknown[]
  },
) {
  if (!started) {
    startPerformanceMonitor()
  }

  const deltaMs =
    deltaSeconds * 1000

  frameCount++

  frameElapsed += deltaMs

  if (deltaMs > frameMax) {
    frameMax = deltaMs
  }

  const now =
    performance.now()

  if (
    now - sampleStartedAt >=
    250
  ) {
    publish(rendererInfo)
  }
}

export function subscribePerformance(
  listener: Listener,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getPerformanceSnapshot() {
  return snapshot
}

export function getServerPerformanceSnapshot() {
  return EMPTY_SNAPSHOT
}

export function resetPerformanceStats() {
  if (
    typeof performance ===
    "undefined"
  ) {
    return
  }

  frameCount = 0
  frameElapsed = 0
  frameMax = 0

  longTaskCount = 0
  lastLongTask = 0

  resourceBaseline =
    performance.now()

  sampleStartedAt =
    performance.now()

  snapshot = {
    ...EMPTY_SNAPSHOT,
    timestamp:
      performance.now(),
  }

  notify()
}

export function formatBytes(
  bytes: number | null,
) {
  if (
    bytes === null ||
    !Number.isFinite(bytes)
  ) {
    return "—"
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`
}

export function formatMs(
  value: number,
) {
  if (!Number.isFinite(value)) {
    return "0.0 ms"
  }

  return `${value.toFixed(1)} ms`
}