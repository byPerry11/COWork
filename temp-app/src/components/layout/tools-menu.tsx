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

export function ToolsMenu({ userId, defaultTab = "pomodoro", open, onOpenChange }: ToolsMenuProps & { defaultTab?: string, open?: boolean, onOpenChange?: (open: boolean) => void }) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined && onOpenChange !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {!isControlled && (
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all h-8"
                    >
                        <Wrench className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Tools</span>
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col h-full border-l shadow-2xl"
            >
                <div className="p-6 pb-2">
                    <SheetHeader className="mb-4">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                                <Wrench className="h-5 w-5 text-primary" />
                                Herramientas
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-xs">
                            Productividad en tiempo real
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 h-9">
                            <TabsTrigger value="pomodoro" className="flex items-center gap-2 text-xs py-1.5">
                                <Timer className="h-3.5 w-3.5" />
                                Pomodoro
                            </TabsTrigger>
                            <TabsTrigger value="checkpoints" className="flex items-center gap-2 text-xs py-1.5">
                                <Target className="h-3.5 w-3.5" />
                                Metas
                            </TabsTrigger>
                        </TabsList>

                        <div className="overflow-y-auto max-h-[calc(100vh-180px)] px-1">
                            <TabsContent value="pomodoro" className="mt-0 focus-visible:outline-none">
                                <div className="bg-card rounded-xl border border-border/50 p-1 shadow-sm">
                                    <PomodoroTimer userId={userId} />
                                </div>
                            </TabsContent>

                            <TabsContent value="checkpoints" className="mt-0 focus-visible:outline-none">
                                <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                                    <ProjectCheckpointsView userId={userId} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
                
                <div className="mt-auto p-4 bg-muted/30 border-t flex justify-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        COWork Productivity Suite
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
