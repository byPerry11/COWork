"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, User, UserMinus } from "lucide-react"
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
import { useState } from "react"
import { ProjectMemberWithProfile } from "@/types"

interface MembersTabProps {
    members: ProjectMemberWithProfile[]
    onKickMember: (userId: string) => Promise<boolean>
}



export function MembersTab({ members, onKickMember }: MembersTabProps) {
    const [kickMemberId, setKickMemberId] = useState<string | null>(null)

    const handleKick = async () => {
        if (kickMemberId) {
            await onKickMember(kickMemberId)
            setKickMemberId(null)
        }
    }

    return (
        <div className="flex-1 overflow-hidden py-4">
            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                    {members.filter(m => m.status === 'active').map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={member.profile?.avatar_url || ""} />
                                        <AvatarFallback>
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.role === 'admin' && (
                                        <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 bg-background rounded-full" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {member.profile?.display_name || member.profile?.username || "Unknown"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] h-4 capitalize">
                                            {member.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            {member.role !== 'admin' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                    onClick={() => setKickMemberId(member.user_id)}
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <AlertDialog open={!!kickMemberId} onOpenChange={() => setKickMemberId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this member from the project? They will lose access to all project data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleKick}
                        >
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
