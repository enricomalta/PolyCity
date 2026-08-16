"use client"

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"

import {
  Activity,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Gauge,
  Image as ImageIcon,
  RotateCcw,
  X,
} from "lucide-react"

import {
  formatBytes,
  formatMs,
  getPerformanceSnapshot,
  getServerPerformanceSnapshot,
  resetPerformanceStats,
  subscribePerformance,
} from "@/lib/game/performance/performance"

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-[11px] text-muted-foreground">
        {label}
      </span>

      <span
        className={
          danger
            ? "font-mono text-[11px] font-semibold text-destructive"
            : "font-mono text-[11px] font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border/60 pt-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-primary">
          {icon}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </span>
      </div>

      {children}
    </section>
  )
}

function PerformanceValue({
  fps,
}: {
  fps: number
}) {
  const rounded =
    Number.isFinite(fps)
      ? Math.round(fps)
      : 0

  const danger = rounded < 30
  const warning =
    rounded >= 30 &&
    rounded < 50

  return (
    <div className="flex items-end gap-1.5">
      <span
        className={
          danger
            ? "font-mono text-2xl font-bold text-destructive"
            : warning
              ? "font-mono text-2xl font-bold text-accent"
              : "font-mono text-2xl font-bold text-primary"
        }
      >
        {rounded}
      </span>

      <span className="mb-0.5 text-[10px] text-muted-foreground">
        FPS
      </span>
    </div>
  )
}

export function DevTools() {
  const snapshot =
    useSyncExternalStore(
      subscribePerformance,
      getPerformanceSnapshot,
      getServerPerformanceSnapshot,
    )

  const [open, setOpen] =
    useState(false)

  const [expanded, setExpanded] =
    useState(true)

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "F3"
      ) {
        event.preventDefault()

        setOpen(
          (current) =>
            !current,
        )
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="pointer-events-auto fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-xl border border-border/70 bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md transition hover:bg-secondary"
        title="Abrir DevTools (F3)"
      >
        <Activity className="size-3.5 text-primary" />

        DevTools

        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          F3
        </span>
      </button>
    )
  }

  const fps =
    Math.round(snapshot.fps)

  const frameDanger =
    snapshot.frameTime > 33.3

  const frameWarning =
    snapshot.frameTime > 16.7

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div className="pointer-events-auto absolute bottom-4 right-4 w-[310px] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
              <Gauge className="size-4 text-primary" />
            </div>

            <div>
              <div className="text-xs font-bold tracking-wide text-foreground">
                POLYCITY DEVTOOLS
              </div>

              <div className="text-[9px] text-muted-foreground">
                Performance Monitor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                resetPerformanceStats()
              }
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title="Resetar métricas"
            >
              <RotateCcw className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (current) =>
                    !current,
                )
              }
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title={
                expanded
                  ? "Recolher"
                  : "Expandir"
              }
            >
              {expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronUp className="size-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title="Fechar DevTools (F3)"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="max-h-[calc(100svh-120px)] space-y-3 overflow-y-auto p-3">
            {/* FPS */}
            <div className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Render
                </div>

                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Atualização em tempo real
                </div>
              </div>

              <PerformanceValue fps={fps} />
            </div>

            <Section
              title="Frame"
              icon={
                <Activity className="size-3" />
              }
            >
              <Metric
                label="Frame time"
                value={formatMs(
                  snapshot.frameTime,
                )}
                danger={
                  frameDanger
                }
              />

              <Metric
                label="Frame máximo"
                value={formatMs(
                  snapshot.maxFrameTime,
                )}
                danger={
                  snapshot.maxFrameTime >
                  50
                }
              />
            </Section>

            {/* Three.js */}
            <Section
              title="Three.js"
              icon={
                <Gauge className="size-3" />
              }
            >
              <Metric
                label="Draw calls"
                value={String(
                  snapshot.drawCalls,
                )}
                danger={
                  snapshot.drawCalls >
                  500
                }
              />

              <Metric
                label="Triangles"
                value={snapshot.triangles.toLocaleString(
                  "pt-BR",
                )}
              />

              <Metric
                label="Points"
                value={snapshot.points.toLocaleString(
                  "pt-BR",
                )}
              />

              <Metric
                label="Lines"
                value={snapshot.lines.toLocaleString(
                  "pt-BR",
                )}
              />

              <Metric
                label="Geometries"
                value={String(
                  snapshot.geometries,
                )}
              />

              <Metric
                label="Textures"
                value={String(
                  snapshot.textures,
                )}
              />

              <Metric
                label="Programs"
                value={String(
                  snapshot.programs,
                )}
              />
            </Section>

            {/* Memory */}
            <Section
              title="Memória"
              icon={
                <Database className="size-3" />
              }
            >
              <Metric
                label="JS Heap usado"
                value={formatBytes(
                  snapshot.jsHeapUsed,
                )}
              />

              <Metric
                label="JS Heap total"
                value={formatBytes(
                  snapshot.jsHeapTotal,
                )}
              />

              <Metric
                label="JS Heap limite"
                value={formatBytes(
                  snapshot.jsHeapLimit,
                )}
              />
            </Section>

            {/* Loading */}
            <Section
              title="Loading"
              icon={
                <ImageIcon className="size-3" />
              }
            >
              <Metric
                label="Recursos"
                value={String(
                  snapshot.resources
                    .total,
                )}
              />

              <Metric
                label="Scripts"
                value={`${snapshot.resources.scripts} · ${formatMs(
                  snapshot.resources
                    .scriptTime,
                )}`}
              />

              <Metric
                label="Imagens / texturas"
                value={`${snapshot.resources.images} · ${formatMs(
                  snapshot.resources
                    .imageTime,
                )}`}
              />

              <Metric
                label="API / Fetch"
                value={`${snapshot.resources.fetches} · ${formatMs(
                  snapshot.resources
                    .fetchTime,
                )}`}
              />

              <Metric
                label="Página"
                value={formatMs(
                  snapshot.navigationTime,
                )}
              />
            </Section>

            {/* Main Thread */}
            <Section
              title="Main Thread"
              icon={
                <Cpu className="size-3" />
              }
            >
              <Metric
                label="Long Tasks"
                value={String(
                  snapshot.longTasks,
                )}
                danger={
                  snapshot.longTasks >
                  0
                }
              />

              <Metric
                label="Última Long Task"
                value={formatMs(
                  snapshot.lastLongTask,
                )}
                danger={
                  snapshot.lastLongTask >
                  50
                }
              />
            </Section>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-[9px] text-muted-foreground">
                Atualização: 250ms
              </span>

              <span className="font-mono text-[9px] text-primary">
                F3
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}