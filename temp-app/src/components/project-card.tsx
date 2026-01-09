"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { FolderKanban, Users } from "lucide-react"

interface ProjectCardProps {
    id: string
    title: string
    progress: number
    role: "admin" | "manager" | "member"
    status: "active" | "completed" | "archived"
    memberCount?: number
}

export function ProjectCard({ id, title, progress, role, status, memberCount = 1 }: ProjectCardProps) {
    const roleColors = {
        admin: "bg-purple-500",
        manager: "bg-blue-500",
        member: "bg-gray-500"
    }

    const statusColors = {
        active: "border-green-500",
        completed: "border-gray-400",
        archived: "border-orange-500"
    }

    return (
        <Link href={`/projects/${id}`}>
            <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${statusColors[status]} h-full`}>
                <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-semibold truncate">{title}</h3>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`${roleColors[role]} text-white text-xs flex-shrink-0`}
                        >
                            {role}
                        </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                            {status}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
