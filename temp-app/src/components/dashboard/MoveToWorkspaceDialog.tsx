"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getWorkspaces } from "@/app/actions/workspaces"
import { updateProject } from "@/app/actions/projects"
import { updateGroup } from "@/app/actions/groups"
import { Workspace } from "@/types"

export interface MoveToWorkspaceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
    entityType: "project" | "group"
}

export function MoveToWorkspaceDialog({
    open,
    onOpenChange,
    entityId,
    entityType,
}: MoveToWorkspaceDialogProps) {
    const router = useRouter()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("none")
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        if (open) {
            fetchWorkspaces()
        }
    }, [open])

    const fetchWorkspaces = async () => {
        setIsFetching(true)
        try {
            const result = await getWorkspaces()
            if (result.success) {
                setWorkspaces(result.data)
            } else {
                toast.error("Error al cargar workspaces", { description: result.error })
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsFetching(false)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const targetWorkspaceId = selectedWorkspace === "none" ? null : selectedWorkspace

            if (entityType === "project") {
                const res = await updateProject({
                    project_id: entityId,
                    workspace_id: targetWorkspaceId
                })
                if (!res.success) throw new Error(res.error)
            } else {
                const res = await updateGroup({
                    group_id: entityId,
                    workspace_id: targetWorkspaceId
                })
                if (!res.success) throw new Error(res.error)
            }

            toast.success("Movido correctamente")
            onOpenChange(false)
            
            // Reload page to reflect changes
            router.refresh()
            
        } catch (error: any) {
            toast.error("Error al mover al workspace", {
                description: error.message || "Inténtalo de nuevo más tarde",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const title = entityType === "project" ? "Mover Proyecto" : "Mover Grupo de Trabajo"
    const description = "Selecciona el workspace de destino para este elemento."

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Destino</label>
                        <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace} disabled={isFetching}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-muted-foreground italic">
                                    -- Ninguno (Desvincular) --
                                </SelectItem>
                                {workspaces.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isLoading || isFetching}>
                        {isLoading ? "Guardando..." : "Mover"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
