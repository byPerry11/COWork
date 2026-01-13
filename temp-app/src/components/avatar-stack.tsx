import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Member {
    avatar_url: string | null
    username?: string
    display_name?: string
}

interface AvatarStackProps {
    members: Member[]
    max?: number
    size?: number // w-6 h-6 default (24px)
    className?: string
    borderColor?: string // default "border-background"
}

export function AvatarStack({
    members,
    max = 3,
    className,
    borderColor = "border-background"
}: AvatarStackProps) {
    const displayMembers = members.slice(0, max)
    const remaining = members.length - max

    return (
        <div className={cn("flex -space-x-2", className)}>
            {displayMembers.map((m, i) => (
                <Avatar
                    key={i}
                    className={cn(
                        "border-2 ring-1 ring-border transition-transform hover:scale-105 hover:z-10",
                        borderColor,
                        "h-6 w-6" // Default size, overrideable via className if needed, but Avatar usually needs explicit class
                    )}
                >
                    <AvatarImage src={m.avatar_url || ""} />
                    <AvatarFallback className="text-[8px] bg-muted text-muted-foreground font-bold">
                        {m.username?.slice(0, 1).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        "h-6 w-6 rounded-full bg-muted border-2 flex items-center justify-center text-[9px] font-medium text-muted-foreground ring-1 ring-border z-10",
                        borderColor
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    )
}
