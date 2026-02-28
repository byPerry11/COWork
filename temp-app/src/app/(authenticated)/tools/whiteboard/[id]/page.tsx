"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { WhiteboardCanvas } from "@/components/whiteboard-canvas"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function WhiteboardPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [initialStrokes, setInitialStrokes] = useState<any[]>([])
    const [boardTitle, setBoardTitle] = useState("Whiteboard")

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            setUserId(session.user.id)

            // Fetch board info
            const { data: board, error: boardError } = await supabase
                .from('whiteboards')
                .select('*')
                .eq('id', id)
                .single()

            if (boardError || !board) {
                console.error("Board not found", boardError)
                // Optionally create if not found? No, better error.
                // For demo simplicity, if not found let's not crash, just empty
            } else {
                setBoardTitle(board.title)
            }

            // Fetch strokes history
            const { data: strokes } = await supabase
                .from('whiteboard_strokes')
                .select('*')
                .eq('whiteboard_id', id)
                .order('created_at', { ascending: true })

            if (strokes) {
                setInitialStrokes(strokes)
            }
            setLoading(false)
        }

        if (id) {
            init()
        }
    }, [id, router])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!userId) return null

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-background/95">
            <header className="bg-slate-900 text-white border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-md z-20">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push("/dashboard")}
                        className="text-white hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg leading-none">{boardTitle}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Colaborativo • En vivo
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-300 border-slate-700">
                        {userId.slice(0, 5)}...
                    </Badge>
                </div>
            </header>
            <div className="flex-1 p-2 md:p-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" />
                <div className="relative h-full w-full rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white">
                    <WhiteboardCanvas
                        whiteboardId={id}
                        userId={userId}
                        initialStrokes={initialStrokes}
                    />
                </div>
            </div>
        </div>
    )
}
