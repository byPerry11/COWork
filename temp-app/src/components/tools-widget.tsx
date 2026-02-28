"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, PenTool, Target, Wrench } from "lucide-react"
import { ToolsMenu } from "@/components/layout/tools-menu"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

interface ToolsWidgetProps {
    userId: string
}

export function ToolsWidget({ userId }: ToolsWidgetProps) {
    const router = useRouter()

    const handleCreateWhiteboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error("You must be logged in to create a whiteboard")
                return
            }

            const { data, error } = await supabase
                .from('whiteboards')
                .insert({ owner_id: session.user.id })
                .select()
                .single()

            if (error) throw error

            if (data) {
                router.push(`/tools/whiteboard/${data.id}`)
            }
        } catch (e) {
            console.error("Error creating whiteboard:", e)
            toast.error("Error creating whiteboard")
        }
    }

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Quick Tools
                </CardTitle>
                <ToolsMenu userId={userId} />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => {
                        // Forzar click en el botón del ToolsMenu que está arriba si queremos abrir el sheet
                        // O simplemente redirigir a /tools si esa página está bien
                        router.push("/tools")
                    }}
                >
                    <Timer className="h-6 w-6 text-orange-500" />
                    <span className="text-xs font-medium">Pomodoro</span>
                </Button>
                
                <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={handleCreateWhiteboard}
                >
                    <PenTool className="h-6 w-6 text-blue-500" />
                    <span className="text-xs font-medium">Whiteboard</span>
                </Button>
            </CardContent>
        </Card>
    )
}
