"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export function UserAvatarMenu() {
    const router = useRouter()
    const [profile, setProfile] = useState<{
        avatar_url: string | null
        display_name: string | null
        username: string
    } | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data } = await supabase
                .from("profiles")
                .select("avatar_url, display_name, username")
                .eq("id", session.user.id)
                .single()

            if (data) setProfile(data)
        }
        fetchProfile()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const getInitials = () => {
        if (profile?.display_name) {
            return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return profile?.username?.slice(0, 2).toUpperCase() || "U"
    }

    if (!profile) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {profile.display_name || profile.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            @{profile.username}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
