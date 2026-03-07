"use client"

import { Mail, User, Loader2 } from "lucide-react"

interface UserInfoProps {
    email?: string
    username?: string | null
    displayName?: string | null
    loading?: boolean
}

export function UserInfo({ 
    email, 
    username, 
    displayName, 
    loading = false 
}: UserInfoProps) {
    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Correo Electrónico</span>
                        <span className="text-sm font-medium">{email}</span>
                    </div>
                </div>
            )}

            {username && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Nombre de Usuario</span>
                        <span className="text-sm font-medium">{username}</span>
                    </div>
                </div>
            )}

            {displayName && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Nombre para Mostrar</span>
                        <span className="text-sm font-medium">{displayName}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
