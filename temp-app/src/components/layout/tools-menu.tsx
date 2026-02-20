"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wrench, Timer, Target } from "lucide-react"
import { PomodoroTimer } from "@/components/layout/pomodoro-timer"
import { ProjectCheckpointsView } from "@/components/projects/project-checkpoints-view"

interface ToolsMenuProps {
    userId: string
}

export function ToolsMenu({ userId }: ToolsMenuProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Tools</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl overflow-y-auto"
            >
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Herramientas de Productividad
                    </SheetTitle>
                    <SheetDescription>
                        Gestiona tu tiempo y revisa tus proyectos desde aquí
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="pomodoro" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="pomodoro" className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Pomodoro
                        </TabsTrigger>
                        <TabsTrigger value="checkpoints" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Checkpoints
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pomodoro" className="mt-0">
                        <PomodoroTimer userId={userId} />
                    </TabsContent>

                    <TabsContent value="checkpoints" className="mt-0">
                        <ProjectCheckpointsView userId={userId} />
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
