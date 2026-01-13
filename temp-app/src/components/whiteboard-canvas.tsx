"use client"

import React, { useRef, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Eraser, Pen, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Point {
    x: number
    y: number
}

interface Stroke {
    points: Point[]
    color: string
    userId: string
}

interface WhiteboardCanvasProps {
    whiteboardId: string
    userId: string
    initialStrokes?: Stroke[]
}

export function WhiteboardCanvas({ whiteboardId, userId, initialStrokes = [] }: WhiteboardCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [color, setColor] = useState('#000000')
    const currentStroke = useRef<Point[]>([])

    // Remote strokes from other users (to redraw)
    const [strokes, setStrokes] = useState<Stroke[]>([])

    // Generate unique color for user on mount
    useEffect(() => {
        const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
        const c = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`
        setColor(c)
        // Load initial
        if (initialStrokes.length > 0) setStrokes(initialStrokes)
    }, [userId, initialStrokes])

    // Draw function
    const draw = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return

        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 3
        ctx.strokeStyle = stroke.color

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
    }

    // Redraw all strokes
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        strokes.forEach(s => draw(ctx, s))

        // Draw current stroke if drawing
        if (isDrawing && currentStroke.current.length > 0) {
            draw(ctx, { points: currentStroke.current, color, userId })
        }
    }, [strokes, isDrawing, color, userId])

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current
            if (canvas) {
                const parent = canvas.parentElement
                if (parent) {
                    canvas.width = parent.clientWidth
                    canvas.height = parent.clientHeight
                    // Trigger redraw
                    setStrokes(prev => [...prev])
                }
            }
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Supabase Realtime
    useEffect(() => {
        const channel = supabase.channel(`whiteboard:${whiteboardId}`)

        channel
            .on('broadcast', { event: 'stroke' }, ({ payload }) => {
                // Receive external stroke
                setStrokes(prev => [...prev, payload])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [whiteboardId])

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { offsetX, offsetY } = getCoordinates(e)
        setIsDrawing(true)
        currentStroke.current = [{ x: offsetX, y: offsetY }]
    }

    const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const { offsetX, offsetY } = getCoordinates(e)
        currentStroke.current.push({ x: offsetX, y: offsetY })
        // Force re-render to see line
        // Optimization: Use requestingAnimationFrame or separate persistent/temp canvas
        // For now, React state trigger is simple
        setStrokes(prev => [...prev]) // Hack to trigger effect redraw, ideally optimize
    }

    const endDrawing = async () => {
        if (!isDrawing) return
        setIsDrawing(false)

        if (currentStroke.current.length > 0) {
            const newStroke: Stroke = {
                points: currentStroke.current,
                color,
                userId
            }

            // 1. Add locally
            setStrokes(prev => [...prev, newStroke])

            // 2. Broadcast
            const channel = supabase.channel(`whiteboard:${whiteboardId}`)
            channel.send({
                type: 'broadcast',
                event: 'stroke',
                payload: newStroke
            })

            // 3. Persist to DB
            try {
                await supabase.from('whiteboard_strokes').insert({
                    whiteboard_id: whiteboardId,
                    user_id: userId,
                    points: newStroke.points,
                    color: newStroke.color
                })
            } catch (err) {
                console.error("Failed to save stroke", err)
            }
        }
        currentStroke.current = []
    }

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { offsetX: 0, offsetY: 0 }

        if ('touches' in e) {
            const touch = e.touches[0]
            const rect = canvas.getBoundingClientRect()
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            }
        } else {
            return {
                offsetX: e.nativeEvent.offsetX,
                offsetY: e.nativeEvent.offsetY
            }
        }
    }

    const clearBoard = () => {
        // Logic to clean for everyone? Or just local?
        // Typically clean board is an admin action that deletes from DB
        toast.info("Clearing board is not yet implemented for all users.")
        setStrokes([])
    }

    return (
        <div className="flex flex-col h-full w-full relative bg-white rounded-md shadow-sm border overflow-hidden">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
                <div className="flex items-center gap-2 bg-white/90 p-2 rounded-md shadow-sm border">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium text-muted-foreground">Your Color</span>
                </div>
                <Button variant="outline" size="icon" onClick={clearBoard}>
                    <Eraser className="h-4 w-4" />
                </Button>
            </div>

            <canvas
                ref={canvasRef}
                className="touch-none cursor-crosshair w-full h-full block"
                onMouseDown={startDrawing}
                onMouseMove={drawMove}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawMove}
                onTouchEnd={endDrawing}
            />
        </div>
    )
}
