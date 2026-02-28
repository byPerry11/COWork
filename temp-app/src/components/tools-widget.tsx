"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, PenTool, Target, Wrench } from "lucide-react"
import { ToolsMenu } from "@/components/layout/tools-menu"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { useState } from "react"

interface ToolsWidgetProps {
    userId: string
}

export function ToolsWidget({ userId }: ToolsWidgetProps) {
    const router = useRouter()
    const [isToolsOpen, setIsToolsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("pomodoro")

    const handleOpenTool = (tab: string) => {
        setActiveTab(tab)
        setIsToolsOpen(true)
    }

    const handleCreateWhiteboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error("You must be logged in to create a whiteboard")
                return
            }

            const { data, error } = await supabase
                .from('whiteboards')
                .insert({ owner_id: session.user.id, title: "Nuevo Whiteboard" })
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
        <>
            <ToolsMenu 
                userId={userId} 
                open={isToolsOpen} 
                onOpenChange={setIsToolsOpen} 
                defaultTab={activeTab}
            />
            
            <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden border-primary/20 bg-primary/5">
                <CardHeader className="pb-3 flex flex-row items-center justify-between bg-primary/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <Wrench className="h-4 w-4" />
                        Quick Tools
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-2 gap-2">
                    <Button 
                        variant="ghost" 
                        className="h-auto py-3 flex flex-col gap-1 items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all"
                        onClick={() => handleOpenTool("pomodoro")}
                    >
                        <Timer className="h-5 w-5 text-orange-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Timer</span>
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        className="h-auto py-3 flex flex-col gap-1 items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all"
                        onClick={handleCreateWhiteboard}
                    >
                        <PenTool className="h-5 w-5 text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Canvas</span>
                    </Button>

                    <Button 
                        variant="ghost" 
                        className="h-auto py-3 flex flex-col gap-1 items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all col-span-2"
                        onClick={() => handleOpenTool("checkpoints")}
                    >
                        <Target className="h-5 w-5 text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Metas de Proyectos</span>
                    </Button>
                </CardContent>
            </Card>
        </>
    )
}
