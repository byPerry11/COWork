"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const WhiteboardCanvas = dynamic(() => import("@/components/whiteboard-canvas").then(mod => mod.WhiteboardCanvas), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full w-full bg-[#1a1a1a] animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
        </div>
    )
})

export default function WhiteboardPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [initialStrokes, setInitialStrokes] = useState<any[]>([])
    const [boardTitle, setBoardTitle] = useState("Whiteboard")

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        toast.success("¡Enlace copiado!", {
            description: "Comparte este enlace para que otros se unan a la pizarra."
        })
    }

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
            } else {
                setBoardTitle(board.title || "Untitled Board")
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
            <div className="flex h-screen w-full items-center justify-center bg-[#1a1a1a]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!userId) return null

    return (
        <div className="flex flex-col h-screen bg-[#1a1a1a]">
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
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleShare}
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all gap-2"
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Compartir</span>
                    </Button>
                    <Badge variant="outline" className="text-slate-300 border-slate-700 hidden md:flex">
                        {userId.slice(0, 5)}...
                    </Badge>
                </div>
            </header>
            <div className="flex-1 overflow-hidden relative">
                <WhiteboardCanvas
                    whiteboardId={id}
                    userId={userId}
                    initialStrokes={initialStrokes}
                />
            </div>
        </div>
    )
}
