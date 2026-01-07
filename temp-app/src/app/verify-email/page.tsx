"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck, RefreshCcw, Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"

export default function VerifyEmailPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [checking, setChecking] = useState(false)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            if (session.user.email_confirmed_at) {
                router.push("/dashboard")
                return
            }
            setEmail(session.user.email || null)
            setLoading(false)
        }
        checkSession()
    }, [router])

    const handleCheckVerification = async () => {
        setChecking(true)
        // Refresh session to get updated user object
        const { data: { session }, error } = await supabase.auth.refreshSession()
        
        if (error) {
            toast.error("Error refreshing session")
            setChecking(false)
            return
        }

        if (session?.user.email_confirmed_at) {
            toast.success("Email verified!")
            router.push("/dashboard")
        } else {
            toast.warning("Email not verified yet. Please check your inbox.")
        }
        setChecking(false)
    }

    const handleResendEmail = async () => {
        if(!email) return
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        })
        if (error) {
            toast.error("Failed to resend email", { description: error.message })
        } else {
            toast.success("Verification email sent!")
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MailCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Verify your email</CardTitle>
                    <CardDescription>
                        We sent a verification link to <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                    <p>
                        Click the link in the email to verify your account. Once verified, click the button below to continue.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button 
                        className="w-full" 
                        onClick={handleCheckVerification} 
                        disabled={checking}
                    >
                        {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        I have verified my email
                    </Button>
                    
                    <div className="flex items-center justify-between w-full pt-2">
                        <Button variant="ghost" size="sm" onClick={handleResendEmail}>
                            Resend email
                        </Button>
                         <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
                             <LogOut className="mr-2 h-3 w-3" />
                            Sign Out
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
