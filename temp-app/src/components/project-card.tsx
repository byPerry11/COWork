"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Users } from "lucide-react"
import { ENGINEERING_CATEGORIES } from "@/lib/project-constants"

interface ProjectCardProps {
    id: string
    title: string
    description?: string | null
    category?: string | null
    color?: string | null
    project_icon?: string | null
    progress: number
    role: "admin" | "manager" | "member"
    status: "active" | "completed" | "archived"
    memberCount?: number
}

export function ProjectCard({
    id,
    title,
    description,
    category,
    color = "#6366f1",
    project_icon = "📁",
    progress,
    role,
    status,
    memberCount = 1
}: ProjectCardProps) {
    const roleColors = {
        admin: "bg-purple-500",
        manager: "bg-blue-500",
        member: "bg-gray-500"
    }

    const statusColors = {
        active: "text-green-600",
        completed: "text-gray-600",
        archived: "text-orange-600"
    }

    // Get category info
    const categoryInfo = ENGINEERING_CATEGORIES.find(cat => cat.value === category)

    return (
        <Link href={`/projects/${id}`}>
            <Card
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 h-full"
                style={{ borderLeftColor: color || undefined }}
            >
                <CardContent className="p-4 space-y-3">
                    {/* Header with Icon */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{project_icon}</span>
                            <h3 className="font-semibold truncate">{title}</h3>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`${roleColors[role]} text-white text-xs flex-shrink-0`}
                        >
                            {role}
                        </Badge>
                    </div>

                    {/* Category Badge */}
                    {categoryInfo && (
                        <div>
                            <Badge variant="outline" className="text-xs">
                                {categoryInfo.emoji} {categoryInfo.label}
                            </Badge>
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {description}
                        </p>
                    )}

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
                        <Badge variant="outline" className={`capitalize text-xs ${statusColors[status]}`}>
                            {status}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
