"use client"

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch"
import { Button } from '@/components/ui/button'
import { 
    Eraser, 
    Type, 
    MousePointer2, 
    Circle, 
    Square, 
    Minus, 
    Plus, 
    Undo, 
    Download,
    Share2,
    Palette
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

interface Point {
    x: number
    y: number
}

interface Stroke {
    id: string
    points: Point[]
    color: string
    thickness: number
    userId: string
}

interface WhiteboardCanvasProps {
    whiteboardId: string
    userId: string
    initialStrokes?: any[]
}

const BRUSH_COLORS = [
    '#ffffff', // White
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
]

const BRUSH_THICKNESSES = [2, 4, 8, 12, 16]

export function WhiteboardCanvas({ whiteboardId, userId, initialStrokes = [] }: WhiteboardCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const [currentStroke, setCurrentStroke] = useState<Point[]>([])
    const [isDrawing, setIsDrawing] = useState(false)
    
    // Brush Settings
    const [brushColor, setBrushColor] = useState('#ffffff')
    const [brushThickness, setBrushThickness] = useState(4)
    const [mode, setMode] = useState<'draw' | 'pan'>('draw')

    // Initialize strokes
    useEffect(() => {
        if (initialStrokes.length > 0) {
            const formattedStrokes = initialStrokes.map(s => ({
                id: s.id || Math.random().toString(36).substr(2, 9),
                points: s.points,
                color: s.color,
                thickness: s.thickness || 4,
                userId: s.user_id || userId
            }))
            setStrokes(formattedStrokes)
        }
    }, [initialStrokes, userId])

    // Supabase Realtime
    useEffect(() => {
        const channel = supabase.channel(`whiteboard:${whiteboardId}`)

        channel
            .on('broadcast', { event: 'stroke' }, ({ payload }) => {
                setStrokes(prev => [...prev, payload])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [whiteboardId])

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, transform: any) => {
        if (mode !== 'draw') return

        const point = getSVGPoint(e, transform)
        setIsDrawing(true)
        setCurrentStroke([point])
    }

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent, transform: any) => {
        if (!isDrawing || mode !== 'draw') return

        const point = getSVGPoint(e, transform)
        setCurrentStroke(prev => [...prev, point])
    }

    const handleMouseUp = async () => {
        if (!isDrawing || mode !== 'draw') return
        setIsDrawing(false)

        if (currentStroke.length > 1) {
            const newStroke: Stroke = {
                id: Math.random().toString(36).substr(2, 9),
                points: currentStroke,
                color: brushColor,
                thickness: brushThickness,
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
                    color: newStroke.color,
                    thickness: newStroke.thickness
                })
            } catch (err) {
                console.error("Failed to save stroke", err)
            }
        }
        setCurrentStroke([])
    }

    const getSVGPoint = (e: React.MouseEvent | React.TouchEvent, transform: any): Point => {
        const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
        let clientX, clientY

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        // Calculate relative coordinates to the container
        const x = (clientX - rect.left - transform.positionX) / transform.scale
        const y = (clientY - rect.top - transform.positionY) / transform.scale

        return { x, y }
    }

    const renderStroke = (stroke: Stroke | { points: Point[], color: string, thickness: number }) => {
        if (stroke.points.length < 2) return null

        const d = stroke.points.reduce((acc, point, i) => {
            return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
        }, "")

        return (
            <path
                key={'id' in stroke ? stroke.id : 'current'}
                d={d}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        )
    }

    return (
        <div 
            ref={containerRef}
            className="flex h-full w-full relative bg-[#262626] overflow-hidden select-none"
        >
            {/* Dot Pattern Background Overlay (Visual only) */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Floating Tools Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-[#1a1a1a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                    <Button 
                        variant={mode === 'pan' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-white/70 hover:text-white"
                        onClick={() => setMode('pan')}
                    >
                        <MousePointer2 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant={mode === 'draw' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-white/70 hover:text-white"
                        onClick={() => setMode('draw')}
                    >
                        <Palette className="h-4 w-4" />
                    </Button>
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-1.5 px-2">
                    {BRUSH_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => {
                                setBrushColor(c)
                                setMode('draw')
                            }}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95",
                                brushColor === c ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                {/* Thickness Selector */}
                <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                    {BRUSH_THICKNESSES.map((t) => (
                        <button
                            key={t}
                            onClick={() => setBrushThickness(t)}
                            className={cn(
                                "flex items-center justify-center transition-all rounded-lg",
                                brushThickness === t ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60"
                            )}
                            style={{ width: 28, height: 28 }}
                        >
                            <div 
                                className="rounded-full bg-current" 
                                style={{ width: t/1.5, height: t/1.5 }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={10}
                disabled={mode === 'draw'}
                limitToBounds={false}
                centerOnInit={true}
            >
                {({ zoomIn, zoomOut, resetTransform, ...transform }) => (
                    <>
                        {/* Zoom Controls Overlay */}
                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                            <div className="flex flex-col bg-[#1a1a1a]/95 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-none border-b border-white/10" onClick={() => zoomIn()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-none border-b border-white/10" onClick={() => zoomOut()}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-none" onClick={() => resetTransform()}>
                                    <Undo className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%", cursor: mode === 'pan' ? 'grab' : 'crosshair' }}
                            contentStyle={{ width: "100%", height: "100%" }}
                        >
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 5000 5000"
                                onMouseDown={(e) => handleMouseDown(e, transform.instance.transformState)}
                                onMouseMove={(e) => handleMouseMove(e, transform.instance.transformState)}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={(e) => handleMouseDown(e, transform.instance.transformState)}
                                onTouchMove={(e) => handleMouseMove(e, transform.instance.transformState)}
                                onTouchEnd={handleMouseUp}
                                style={{
                                    width: '5000px',
                                    height: '5000px',
                                    backgroundColor: '#262626'
                                }}
                            >
                                {/* Static Dot Pattern for the SVG Viewport */}
                                <defs>
                                    <pattern id="dotPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="1" fill="#444" />
                                    </pattern>
                                </defs>
                                <rect width="5000" height="5000" fill="url(#dotPattern)" />

                                {strokes.map(renderStroke)}
                                {isDrawing && renderStroke({ points: currentStroke, color: brushColor, thickness: brushThickness })}
                            </svg>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    )
}
