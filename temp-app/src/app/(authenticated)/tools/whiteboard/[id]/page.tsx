"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { WhiteboardCanvas } from "@/components/whiteboard-canvas"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/tools")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="font-bold text-lg">{boardTitle}</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-4 overflow-hidden">
                <WhiteboardCanvas
                    whiteboardId={id}
                    userId={userId}
                    initialStrokes={initialStrokes}
                />
            </div>
        </div>
    )
}
