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
            
            <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden border-primary/20 bg-primary/5 w-fit">
                <CardHeader className="p-2 flex flex-row items-center justify-center bg-primary/10">
                    <Wrench className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="p-2 flex flex-col gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 flex items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all"
                        onClick={() => handleOpenTool("pomodoro")}
                        title="Timer"
                    >
                        <Timer className="h-5 w-5 text-orange-500" />
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 flex items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all"
                        onClick={handleCreateWhiteboard}
                        title="Canvas"
                    >
                        <PenTool className="h-5 w-5 text-blue-500" />
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 flex items-center justify-center bg-background hover:bg-primary/10 border border-border transition-all"
                        onClick={() => handleOpenTool("checkpoints")}
                        title="Metas de Proyectos"
                    >
                        <Target className="h-5 w-5 text-green-500" />
                    </Button>
                </CardContent>
            </Card>
        </>
    )
}
