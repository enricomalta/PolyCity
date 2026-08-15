"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

const PAN_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
])

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node) return false
  return (
    node.tagName === "INPUT" ||
    node.tagName === "TEXTAREA" ||
    node.isContentEditable === true
  )
}

/**
 * Keyboard-driven camera panning (WASD / arrow keys). This is intentionally
 * separate from mouse drag: the mouse rotates/orbits the camera, the keyboard
 * slides it across the city. Movement happens on the horizontal (XZ) plane
 * relative to where the camera is looking, and both the camera and the
 * OrbitControls target move together so the orbit pivot follows along.
 */
export function CameraController({ speed = 14 }: { speed?: number }) {
  const camera = useThree((s) => s.camera)
  // OrbitControls registers itself here via `makeDefault`.
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update: () => void }
    | null

  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return
      const k = e.key.toLowerCase()
      if (PAN_KEYS.has(k)) {
        keys.current.add(k)
        // stop the page from scrolling on arrow keys
        if (k.startsWith("arrow")) e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }
    const blur = () => keys.current.clear()

    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", blur)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
    }
  }, [])

  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3(0, 1, 0))

  useFrame((_, delta) => {
    const pressed = keys.current
    if (pressed.size === 0) return

    // Horizontal forward direction (where the camera looks, flattened to XZ).
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    if (forward.current.lengthSq() === 0) return
    forward.current.normalize()

    // Right vector, perpendicular to forward on the ground plane.
    right.current.crossVectors(forward.current, up.current).normalize()

    move.current.set(0, 0, 0)
    if (pressed.has("w") || pressed.has("arrowup")) move.current.add(forward.current)
    if (pressed.has("s") || pressed.has("arrowdown")) move.current.sub(forward.current)
    if (pressed.has("d") || pressed.has("arrowright")) move.current.add(right.current)
    if (pressed.has("a") || pressed.has("arrowleft")) move.current.sub(right.current)

    if (move.current.lengthSq() === 0) return
    move.current.normalize().multiplyScalar(speed * Math.min(delta, 0.05))

    camera.position.add(move.current)
    if (controls?.target) {
      controls.target.add(move.current)
      controls.update()
    }
  })

  return null
}
