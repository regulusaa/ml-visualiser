import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// Each data point has a position on the canvas and a class label (0 = blue, 1 = red)
export interface DataPoint {
  x: number
  y: number
  label: 0 | 1
}

const POINT_RADIUS = 6
const BLUE = '#4A90D9'
const RED = '#E05C5C'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [points, setPoints] = useState<DataPoint[]>([])
  const [activeTool, setActiveTool] = useState<'blue' | 'red' | 'eraser'>('blue')

  // Redraw the canvas every time points change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    points.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = p.label === 0 ? BLUE : RED
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [points])

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e)

    if (activeTool === 'eraser') {
      // Remove the first point within POINT_RADIUS distance of the click
      setPoints(prev => {
        const idx = prev.findIndex(
          p => Math.hypot(p.x - x, p.y - y) < POINT_RADIUS * 2
        )
        if (idx === -1) return prev
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
      })
      return
    }

    setPoints(prev => [...prev, { x, y, label: activeTool === 'blue' ? 0 : 1 }])
  }, [activeTool])

  const loadPreset = (preset: 'xor' | 'spiral' | 'clusters') => {
    const newPoints: DataPoint[] = []

    if (preset === 'xor') {
      // Four gaussian clusters arranged in XOR pattern
      const centers = [
        { x: 180, y: 180, label: 0 }, { x: 420, y: 420, label: 0 },
        { x: 420, y: 180, label: 1 }, { x: 180, y: 420, label: 1 },
      ] as const
      centers.forEach(c => {
        for (let i = 0; i < 20; i++) {
          newPoints.push({
            x: c.x + (Math.random() - 0.5) * 80,
            y: c.y + (Math.random() - 0.5) * 80,
            label: c.label,
          })
        }
      })
    }

    if (preset === 'spiral') {
      // Two interleaved spirals
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 3
        const r = 20 + i * 2.8
        const noise = () => (Math.random() - 0.5) * 18
        newPoints.push({ x: 300 + Math.cos(angle) * r + noise(), y: 300 + Math.sin(angle) * r + noise(), label: 0 })
        newPoints.push({ x: 300 + Math.cos(angle + Math.PI) * r + noise(), y: 300 + Math.sin(angle + Math.PI) * r + noise(), label: 1 })
      }
    }

    if (preset === 'clusters') {
      // Three blue clusters vs three red clusters
      const centers = [
        { x: 150, y: 200, label: 0 }, { x: 300, y: 430, label: 0 }, { x: 460, y: 180, label: 0 },
        { x: 200, y: 380, label: 1 }, { x: 380, y: 280, label: 1 }, { x: 490, y: 400, label: 1 },
      ] as const
      centers.forEach(c => {
        for (let i = 0; i < 18; i++) {
          newPoints.push({
            x: c.x + (Math.random() - 0.5) * 90,
            y: c.y + (Math.random() - 0.5) * 90,
            label: c.label,
          })
        }
      })
    }

    setPoints(newPoints)
  }

  const blueCount = points.filter(p => p.label === 0).length
  const redCount = points.filter(p => p.label === 1).length

  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="canvas"
        onClick={handleCanvasClick}
      />
      <div className="toolbar">
        <div className="tool-group">
          <button className={`tool-btn blue ${activeTool === 'blue' ? 'active' : ''}`} onClick={() => setActiveTool('blue')}>Blue</button>
          <button className={`tool-btn red ${activeTool === 'red' ? 'active' : ''}`} onClick={() => setActiveTool('red')}>Red</button>
          <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')}>Eraser</button>
        </div>
        <div className="tool-group">
          <button className="tool-btn" onClick={() => loadPreset('xor')}>XOR</button>
          <button className="tool-btn" onClick={() => loadPreset('spiral')}>Spiral</button>
          <button className="tool-btn" onClick={() => loadPreset('clusters')}>Clusters</button>
        </div>
        <div className="tool-group">
          <button className="tool-btn danger" onClick={() => setPoints([])}>Clear</button>
        </div>
        <div className="point-count">
          {points.length} points — <span className="blue-count">{blueCount} blue</span>, <span className="red-count">{redCount} red</span>
        </div>
      </div>
    </div>
  )
}

export default App