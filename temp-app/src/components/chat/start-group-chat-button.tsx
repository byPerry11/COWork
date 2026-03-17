"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

interface StartGroupChatButtonProps {
    /** Lista de IDs de usuario a incluir en el chat (incluyendo al usuario actual) */
    memberUserIds: string[]
    /** Nombre que se le pondrá al chat grupal */
    chatName: string
    /** Tipo de origen: 'project' | 'work_group' */
    sourceType: "project" | "work_group"
    /** Descripción contextual para el modal de confirmación */
    sourceLabel?: string
    /** ID del usuario actual */
    currentUserId: string
    /** Tamaño del botón */
    size?: "sm" | "icon" | "default"
    /** Clases adicionales */
    className?: string
}

export function StartGroupChatButton({
    memberUserIds,
    chatName,
    sourceType,
    sourceLabel,
    currentUserId,
    size = "sm",
    className,
}: StartGroupChatButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        setLoading(true)
        try {
            // Asegurarnos de que todos los IDs sean únicos y el current user esté incluido
            const allMembers = Array.from(new Set([currentUserId, ...memberUserIds]))

            // 1. Crear el chat grupal
            const { data: newChat, error: chatError } = await supabase
                .from("chats")
                .insert({
                    type: sourceType,
                    name: chatName,
                })
                .select()
                .single()

            if (chatError || !newChat) {
                throw chatError ?? new Error("No se pudo crear el chat")
            }

            // 2. Agregar todos los participantes
            const participants = allMembers.map((userId) => ({
                chat_id: newChat.id,
                user_id: userId,
            }))

            const { error: partError } = await supabase
                .from("chat_participants")
                .insert(participants)

            if (partError) throw partError

            toast.success(`Chat "${chatName}" creado con ${allMembers.length} miembros`)
            setShowConfirm(false)
            router.push(`/chats/${newChat.id}`)
        } catch (err) {
            console.error(err)
            toast.error("No se pudo crear el chat grupal")
        } finally {
            setLoading(false)
        }
    }

    const memberCount = Array.from(new Set([currentUserId, ...memberUserIds])).length

    return (
        <>
            <Button
                variant="outline"
                size={size}
                className={className}
                onClick={() => setShowConfirm(true)}
                title="Iniciar chat grupal"
            >
                <MessageCircle className="h-4 w-4" />
                {size !== "icon" && <span className="ml-1.5">Chat</span>}
            </Button>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            Iniciar chat grupal
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    ¿Deseas crear un chat grupal para{" "}
                                    <span className="font-semibold text-foreground">
                                        {sourceLabel ?? chatName}
                                    </span>
                                    ?
                                </p>
                                <p>
                                    Se creará un chat llamado{" "}
                                    <span className="font-medium text-foreground">«{chatName}»</span>{" "}
                                    y se añadirán automáticamente los{" "}
                                    <span className="font-medium text-foreground">{memberCount} miembros</span>{" "}
                                    activos del {sourceType === "project" ? "proyecto" : "grupo de trabajo"}.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreate} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear chat
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
