"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { memo } from "react"
import { WorkspaceCategory } from "@/types"
import { Briefcase, Folder, Heart, School } from "lucide-react"

interface WorkspaceCardProps {
    id: string
    name: string
    category: WorkspaceCategory
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Escuela': return <School className="h-6 w-6 text-blue-500" />
        case 'Trabajo': return <Briefcase className="h-6 w-6 text-emerald-500" />
        case 'Hobby': return <Heart className="h-6 w-6 text-pink-500" />
        default: return <Folder className="h-6 w-6 text-gray-500" />
    }
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Escuela': return '#3b82f6' // text-blue-500
        case 'Trabajo': return '#10b981' // text-emerald-500
        case 'Hobby': return '#ec4899' // text-pink-500
        default: return '#6b7280' // text-gray-500
    }
}

export const WorkspaceCard = memo(({
    id,
    name,
    category
}: WorkspaceCardProps) => {
    const icon = getCategoryIcon(category)
    const color = getCategoryColor(category)

    return (
        <Link href={`/dashboard?workspace=${id}`} className="block h-full">
            <Card
                className="transition-all duration-200 border-l-4 h-full relative group flex flex-col justify-between hover:shadow-lg cursor-pointer"
                style={{ borderLeftColor: color }}
            >
                <CardContent className="p-4 space-y-4 relative flex-grow flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-accent rounded-xl">
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate" title={name}>{name}</h3>
                            <Badge variant="secondary" className="mt-1 font-normal opacity-80">
                                {category}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
})

WorkspaceCard.displayName = "WorkspaceCard"
