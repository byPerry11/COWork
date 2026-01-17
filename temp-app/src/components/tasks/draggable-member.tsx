"use client"

import { useDraggable } from "@dnd-kit/core"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface DraggableMemberProps {
    member: {
        user_id: string
        profile: {
            username: string
            display_name?: string
            avatar_url?: string
        }
    }
}

export function DraggableMember({ member }: DraggableMemberProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `member-${member.user_id}`,
        data: {
            type: 'Member',
            member: member,
        },
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm cursor-grab active:cursor-grabbing touch-none select-none",
                isDragging ? "opacity-50 ring-2 ring-primary z-50" : "hover:bg-accent/50"
            )}
        >
            <Avatar className="h-10 w-10 md:h-12 md:w-12 pointer-events-none">
                <AvatarImage src={member.profile?.avatar_url} />
                <AvatarFallback>{member.profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm md:text-base">
                    {member.profile?.display_name?.split(' ')[0] || member.profile?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate hidden md:block">
                    {member.profile?.username}
                </p>
            </div>
        </div>
    )
}
