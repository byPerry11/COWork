"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Check, MessageCircle, Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { sendFriendRequest, acceptFriendRequest } from "@/app/actions/friends"

interface ProfileHeaderProps {
    profile: any
    currentUserId: string
}

type UserStatus = 'online' | 'away' | 'dnd'

const STATUS_EMOJI: Record<UserStatus, string> = {
    online: '🟢',
    away: '🟡',
    dnd: '🔴'
}

export function ProfileHeader({ profile, currentUserId }: ProfileHeaderProps) {
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self'>('none')
    const [loading, setLoading] = useState(true)
    const [userStatus, setUserStatus] = useState<UserStatus>('online')
    const [requestSending, setRequestSending] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (profile.id === currentUserId) {
            setFriendStatus('self')
            setLoading(false)
            return
        }

        const checkFriendship = async () => {
            const { data: requests } = await supabase
                .from('friend_requests')
                .select('*')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)

            if (requests && requests.length > 0) {
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

        // Set user status from profile (default to online if not set)
        if (profile.user_status) {
            setUserStatus(profile.user_status as UserStatus)
        }
    }, [profile, currentUserId])

    const handleSendRequest = async () => {
        setRequestSending(true)
        try {
            const result = await sendFriendRequest({ receiver_id: profile.id })

            if (!result.success) {
                toast.error('Error al enviar solicitud', {
                    description: result.error,
                })
                return
            }

            toast.success('Solicitud de amistad enviada')
            setFriendStatus('pending_sent')
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado')
        } finally {
            setRequestSending(false)
        }
    }

    const handleAccept = async () => {
        try {
            const { data: req } = await supabase.from('friend_requests')
                .select('id')
                .eq('sender_id', profile.id)
                .eq('receiver_id', currentUserId)
                .eq('status', 'pending')
                .single()

            if (!req) {
                toast.error('Solicitud no encontrada')
                return
            }

            const result = await acceptFriendRequest({ request_id: req.id })

            if (!result.success) {
                toast.error('Error al aceptar solicitud', {
                    description: result.error,
                })
                return
            }

            toast.success('Solicitud de amistad aceptada')
            setFriendStatus('friends')
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado')
        }
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-xl border shadow-sm">
            {/* Avatar with Status */}
            <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-primary/30">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-2xl">{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {/* Discord-style Status indicator */}
                <div className="absolute bottom-0.5 right-0.5">
                    <div className={`w-4 h-4 rounded-full ring-4 ring-card ${userStatus === 'online' ? 'bg-green-500' :
                        userStatus === 'away' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                </div>
            </div>

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
                    <Button onClick={handleSendRequest} disabled={requestSending}>
                        {requestSending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {requestSending ? "Sending..." : "Add Friend"}
                    </Button>
                )}
                {friendStatus === 'pending_sent' && (
                    <Button variant="secondary" disabled className="text-green-600 bg-green-100 dark:bg-green-900/30">
                        <Check className="mr-2 h-4 w-4" />
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
