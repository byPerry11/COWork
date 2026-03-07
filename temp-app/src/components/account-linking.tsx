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
    const isGithubLinked = identities.some(id => id.provider === 'github')

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

    const handleLinkGithub = async () => {
        setIsLinking(true)
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                if (error.message.includes('already linked')) {
                    toast.error("Error de vinculación", {
                        description: "Esta cuenta de GitHub ya está vinculada a otro usuario."
                    })
                } else {
                    throw error
                }
            }
        } catch (error: any) {
            console.error("Error linking GitHub account:", error)
            toast.error("Error al vincular cuenta", {
                description: error.message || "Ocurrió un error inesperado al intentar vincular con GitHub."
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
            {/* Google */}
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

            {/* GitHub */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                        <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z"></path>
                    </svg>
                    <div>
                        <p className="text-sm font-medium">GitHub</p>
                        {isGithubLinked ? (
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

                {!isGithubLinked && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLinkGithub}
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
