import { useEffect, useRef } from 'react'

// Deterministic pseudo-random (no hydration mismatch)
function sr(seed) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const FLOATERS = [
  '🌿','🧄','🌶️','🫒','🍋','🧅','🍅','🥕',
  '🫚','🧂','🌿','🥦','🫑','🍄','🌾','🧄',
  '🌶️','🍋','🌿','🥕','🫒','🧅','🍅','🌿',
]

const PARALLAX_ICONS = [
  { e: '🍳', top: '7%',  left: '2%',  sz: 4.4, rot: -14, op: 0.055 },
  { e: '🥘', top: '76%', left: '0%',  sz: 4.8, rot:  10, op: 0.045 },
  { e: '🍲', top: '10%', left: '91%', sz: 4.2, rot:  14, op: 0.045 },
  { e: '🫕', top: '70%', left: '89%', sz: 4.5, rot:  -9, op: 0.055 },
  { e: '🥗', top: '44%', left: '93%', sz: 3.8, rot:  22, op: 0.045 },
  { e: '🌿', top: '50%', left: '1%',  sz: 4.0, rot: -24, op: 0.060 },
  { e: '🧑‍🍳',top: '30%', left: '95%', sz: 3.6, rot:   8, op: 0.038 },
  { e: '🫙', top: '89%', left: '87%', sz: 3.4, rot: -18, op: 0.040 },
]

export default function AnimatedBackground() {
  const parallaxRef = useRef(null)

  useEffect(() => {
    let rafId
    let tx = 0, ty = 0, cx = 0, cy = 0

    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 24
      ty = (e.clientY / window.innerHeight - 0.5) * 16
    }

    const tick = () => {
      cx += (tx - cx) * 0.055
      cy += (ty - cy) * 0.055
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}
    >
      {/* Animated warm gradient */}
      <div className="bg-warm-pulse" />

      {/* Floating food particles */}
      {FLOATERS.map((emoji, i) => (
        <span
          key={i}
          className="food-float"
          style={{
            left:              `${(sr(i * 7.3) * 90 + 4).toFixed(1)}%`,
            fontSize:          `${(1.2 + sr(i * 2.9) * 1.1).toFixed(2)}rem`,
            animationDelay:    `${-(sr(i * 3.1) * 24).toFixed(1)}s`,
            animationDuration: `${(18 + sr(i * 5.7) * 20).toFixed(1)}s`,
          }}
        >
          {emoji}
        </span>
      ))}

      {/* Large blurred icons — mouse-parallax layer */}
      <div ref={parallaxRef} style={{ position: 'absolute', inset: '-6%', willChange: 'transform' }}>
        {PARALLAX_ICONS.map(({ e, top, left, sz, rot, op }, i) => (
          <span key={i} style={{
            position:  'absolute',
            top, left,
            fontSize:  `${sz}rem`,
            opacity:    op,
            transform: `rotate(${rot}deg)`,
            filter:    'blur(2.5px)',
          }}>
            {e}
          </span>
        ))}
      </div>
    </div>
  )
}
