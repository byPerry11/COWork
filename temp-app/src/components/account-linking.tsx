"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function AccountLinking() {
    const [loading, setLoading] = useState(true)
    const [isLinking, setIsLinking] = useState(false)
    const [identities, setIdentities] = useState<any[]>([])

    useEffect(() => {
        fetchIdentities()
    }, [])

    const fetchIdentities = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.identities) {
            setIdentities(user.identities)
        }
        setLoading(false)
    }

    const isGoogleLinked = identities.some(id => id.provider === 'google')

    const handleLinkGoogle = async () => {
        setIsLinking(true)
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                if (error.message.includes('already linked')) {
                    toast.error("Error de vinculación", {
                        description: "Esta cuenta de Google ya está vinculada a otro usuario."
                    })
                } else {
                    throw error
                }
            }
        } catch (error: any) {
            console.error("Error linking Google account:", error)
            toast.error("Error al vincular cuenta", {
                description: error.message || "Ocurrió un error inesperado al intentar vincular con Google."
            })
        } finally {
            setIsLinking(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    <div>
                        <p className="text-sm font-medium">Google</p>
                        {isGoogleLinked ? (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Cuenta vinculada
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                No vinculada
                            </p>
                        )}
                    </div>
                </div>

                {!isGoogleLinked && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLinkGoogle}
                        disabled={isLinking}
                    >
                        {isLinking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Vincular
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
