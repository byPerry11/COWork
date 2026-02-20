import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, User, Users, Clock } from "lucide-react"
import { toast } from "sonner"
import { UserSearch } from "@/components/user-search"
import { motion, AnimatePresence } from "framer-motion"
import { acceptFriendRequest, rejectFriendRequest } from "@/app/actions/friends"

interface Profile {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
}

interface FriendRequest {
    id: string
    sender_id: string
    receiver_id: string
    status: 'pending' | 'accepted' | 'rejected'
    sender: Profile
    receiver: Profile
}

interface SentRequest {
    id: string
    sender_id: string
    receiver_id: string
    status: 'pending' | 'accepted' | 'rejected'
    receiver: Profile
}

type TabType = 'friends' | 'requests'

export function FriendManager({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState<TabType>('friends')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [friends, setFriends] = useState<Profile[]>([])
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch Requests (received) - only IDs first
            const { data: reqData, error: reqError } = await supabase
                .from('friend_requests')
                .select('id, sender_id, receiver_id, status, created_at')
                .eq('receiver_id', userId)
                .eq('status', 'pending')

            if (reqError) throw reqError

            // 2. Fetch sender profiles separately
            if (reqData && reqData.length > 0) {
                const senderIds = reqData.map(r => r.sender_id)
                const { data: senderProfiles } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', senderIds)

                // Merge profiles with requests
                const requestsWithProfiles = reqData.map(req => ({
                    ...req,
                    sender: senderProfiles?.find(p => p.id === req.sender_id) || {
                        id: req.sender_id,
                        username: 'Unknown',
                        display_name: null,
                        avatar_url: null
                    },
                    receiver: { id: userId, username: null, display_name: null, avatar_url: null }
                }))
                setRequests(requestsWithProfiles as any)
            } else {
                setRequests([])
            }

            // 2b. Fetch Sent Requests (where user is sender)
            const { data: sentData, error: sentError } = await supabase
                .from('friend_requests')
                .select('id, sender_id, receiver_id, status, created_at')
                .eq('sender_id', userId)
                .eq('status', 'pending')

            if (sentError) throw sentError

            // Fetch receiver profiles separately
            if (sentData && sentData.length > 0) {
                const receiverIds = sentData.map(r => r.receiver_id)
                const { data: receiverProfiles } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', receiverIds)

                // Merge profiles with sent requests
                const sentWithProfiles = sentData.map(req => ({
                    ...req,
                    receiver: receiverProfiles?.find(p => p.id === req.receiver_id) || {
                        id: req.receiver_id,
                        username: 'Unknown',
                        display_name: null,
                        avatar_url: null
                    }
                }))
                setSentRequests(sentWithProfiles as SentRequest[])
            } else {
                setSentRequests([])
            }

            // 3. Fetch Friends (accepted requests) - only IDs first
            const { data: friendData, error: friendError } = await supabase
                .from('friend_requests')
                .select('id, sender_id, receiver_id, status')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .eq('status', 'accepted')

            if (friendError) throw friendError

            // 4. Get unique friend IDs (exclude current user)
            const friendIds = new Set<string>()
            friendData?.forEach((f: any) => {
                if (f.sender_id === userId) {
                    friendIds.add(f.receiver_id)
                } else {
                    friendIds.add(f.sender_id)
                }
            })

            // 5. Fetch friend profiles
            if (friendIds.size > 0) {
                const { data: friendProfiles } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', Array.from(friendIds))

                setFriends(friendProfiles || [])
            } else {
                setFriends([])
            }

        } catch (error: any) {
            console.error("Error fetching friends", error)
            toast.error("Failed to load friends")
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            if (status === 'accepted') {
                const result = await acceptFriendRequest({ request_id: requestId })
                if (!result.success) {
                    toast.error('Error al aceptar solicitud', {
                        description: result.error,
                    })
                    return
                }
                toast.success('Solicitud aceptada')
            } else {
                const result = await rejectFriendRequest({ request_id: requestId })
                if (!result.success) {
                    toast.error('Error al rechazar solicitud', {
                        description: result.error,
                    })
                    return
                }
                toast.success('Solicitud rechazada')
            }
            fetchData() // Reload lists
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado')
        }
    }

    const cancelRequest = async (requestId: string) => {
        try {
            const result = await rejectFriendRequest({ request_id: requestId })
            if (!result.success) {
                toast.error('Error al cancelar solicitud', {
                    description: result.error,
                })
                return
            }
            toast.success('Solicitud cancelada')
            fetchData() // Reload lists
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado')
        }
    }

    const totalRequests = requests.length + sentRequests.length

    const tabVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    }

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Find Friends</CardTitle>
                    <CardDescription>Search for users by username or display name to connect.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserSearch onRequestSent={fetchData} />
                </CardContent>
            </Card>

            {/* Unified Friends/Requests Card */}
            <Card>
                <CardHeader className="pb-3">
                    {/* Custom Tab Selector */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'friends'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Friends
                            {friends.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                    {friends.length}
                                </Badge>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'requests'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Clock className="h-4 w-4" />
                            Requests
                            {totalRequests > 0 && (
                                <Badge variant={requests.length > 0 ? "destructive" : "secondary"} className="ml-1 h-5 px-1.5">
                                    {totalRequests}
                                </Badge>
                            )}
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="min-h-[200px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'friends' && (
                            <motion.div
                                key="friends"
                                variants={tabVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                {loading && friends.length === 0 ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : friends.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">No friends added yet.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Use the search above to find people!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {friends.map((friend, index) => (
                                            <motion.div
                                                key={friend.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                                                onClick={() => router.push(`/users/${friend.id}`)}
                                            >
                                                <Avatar>
                                                    <AvatarImage src={friend.avatar_url || ""} />
                                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{friend.display_name || friend.username}</span>
                                                    <span className="text-xs text-muted-foreground">@{friend.username}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'requests' && (
                            <motion.div
                                key="requests"
                                variants={tabVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="space-y-4"
                            >
                                {loading && totalRequests === 0 ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : totalRequests === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">No pending requests.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Received Requests */}
                                        {requests.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                                    Received ({requests.length})
                                                </h4>
                                                {requests.map((req, index) => (
                                                    <motion.div
                                                        key={req.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20"
                                                    >
                                                        <div
                                                            className="flex items-center gap-3 cursor-pointer"
                                                            onClick={() => router.push(`/users/${req.sender_id}`)}
                                                        >
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={req.sender.avatar_url || ""} />
                                                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{req.sender.display_name || req.sender.username}</span>
                                                                <span className="text-xs text-muted-foreground">@{req.sender.username}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={() => handleResponse(req.id, 'accepted')}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => handleResponse(req.id, 'rejected')}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sent Requests */}
                                        {sentRequests.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                                    Sent ({sentRequests.length})
                                                </h4>
                                                {sentRequests.map((req, index) => (
                                                    <motion.div
                                                        key={req.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: (requests.length + index) * 0.05 }}
                                                        className="flex items-center justify-between p-3 border rounded-lg"
                                                    >
                                                        <div
                                                            className="flex items-center gap-3 cursor-pointer"
                                                            onClick={() => router.push(`/users/${req.receiver_id}`)}
                                                        >
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={req.receiver.avatar_url || ""} />
                                                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{req.receiver.display_name || req.receiver.username}</span>
                                                                <span className="text-xs text-muted-foreground">@{req.receiver.username}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                            onClick={() => cancelRequest(req.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    )
}
