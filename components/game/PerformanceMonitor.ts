"use client"

import { useEffect } from "react"

import {
  useFrame,
  useThree,
} from "@react-three/fiber"

import {
  recordFrame,
  startPerformanceMonitor,
} from "@/lib/game/performance/performance"

export function PerformanceMonitor() {
  const { gl } = useThree()

  useEffect(() => {
    startPerformanceMonitor()
  }, [])

  useFrame((_, delta) => {
    recordFrame(
      delta,
      gl.info,
    )
  })

  return null
}