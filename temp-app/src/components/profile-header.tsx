"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Check, MessageCircle, Settings } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProfileHeaderProps {
    profile: any
    currentUserId: string
}

export function ProfileHeader({ profile, currentUserId }: ProfileHeaderProps) {
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self'>('none')
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (profile.id === currentUserId) {
            setFriendStatus('self')
            setLoading(false)
            return
        }

        const checkFriendship = async () => {
            // Check friends table (if exists) or friend_requests
            // Assuming we check friend_requests for pending/accepted
            // But usually friends are in 'friends' table if accepted?
            // Wait, schema check needed. 
            // In 'database_schema.sql', I didn't see 'friends' table, only 'friend_requests'.
            // But 'supabase_update_friends.sql' (implied) might have it.
            // Let's assume friend_requests with status='accepted' OR a separate friends table.
            // 'prevent_duplicate_friend_request' checks 'friend_requests'.

            // Check for accepted request
            const { data: requests } = await supabase
                .from('friend_requests')
                .select('*')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

            if (requests && requests.length > 0) {
                // Filter specifically for the pair
                const match = requests.find(r =>
                    (r.sender_id === currentUserId && r.receiver_id === profile.id) ||
                    (r.sender_id === profile.id && r.receiver_id === currentUserId)
                )

                if (match) {
                    if (match.status === 'accepted') {
                        setFriendStatus('friends')
                    } else if (match.status === 'pending') {
                        if (match.sender_id === currentUserId) setFriendStatus('pending_sent')
                        else setFriendStatus('pending_received')
                    }
                }
            }
            setLoading(false)
        }
        checkFriendship()
    }, [profile, currentUserId])

    const handleSendRequest = async () => {
        const { error } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: currentUserId,
                receiver_id: profile.id
            })

        if (error) {
            toast.error("Failed to send request")
        } else {
            toast.success("Friend request sent")
            setFriendStatus('pending_sent')
        }
    }

    const handleAccept = async () => {
        // Find the request first? 
        // We know we are receiver.
        const { data: req } = await supabase.from('friend_requests')
            .select('id')
            .eq('sender_id', profile.id)
            .eq('receiver_id', currentUserId)
            .eq('status', 'pending')
            .single()

        if (req) {
            const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'accepted' })
                .eq('id', req.id)

            if (!error) {
                toast.success("Friend request accepted")
                setFriendStatus('friends')
            }
        }
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-xl border shadow-sm">
            <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="flex items-center gap-2">
                {friendStatus === 'self' && (
                    <Button variant="outline" onClick={() => router.push('/profile')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                )}
                {friendStatus === 'none' && !loading && (
                    <Button onClick={handleSendRequest}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Friend
                    </Button>
                )}
                {friendStatus === 'pending_sent' && (
                    <Button variant="secondary" disabled>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Request Sent
                    </Button>
                )}
                {friendStatus === 'pending_received' && (
                    <Button onClick={handleAccept}>
                        <Check className="mr-2 h-4 w-4" />
                        Accept Request
                    </Button>
                )}
                {friendStatus === 'friends' && (
                    <Button variant="outline">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                    </Button>
                )}
            </div>
        </div>
    )
}
