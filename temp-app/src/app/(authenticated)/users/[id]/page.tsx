"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileAchievements } from "@/components/profile-achievements"
import { ProfileProjects } from "@/components/profile-projects"

export default function UserProfilePage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profile, setProfile] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCtx = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            setCurrentUser(session.user.id)

            // Fetch target profile
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

            if (error || !data) {
                console.error("Profile not found", error)
            } else {
                setProfile(data)
            }
            setLoading(false)
        }
        fetchCtx()
    }, [userId, router])


    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!profile) {
        return <div className="h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-xl font-bold">User not found</h1>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>
    }

    return (
        <div className="container mx-auto p-4 md:p-6 pb-24 space-y-6">
            <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <ProfileHeader profile={profile} currentUserId={currentUser!} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <ProfileAchievements userId={userId} />
                </div>
                <div className="md:col-span-1">
                    <ProfileProjects userId={userId} />
                </div>
            </div>
        </div>
    )
}
