"use client"

import Link from "next/link"
import { Folder, Users, ArrowRight } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface WorkGroupCardProps {
    id: string
    name: string
    description?: string | null
    memberCount?: number
    isOwner?: boolean
}

export function WorkGroupCard({ id, name, description, memberCount = 0, isOwner }: WorkGroupCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Folder className="h-4 w-4" />
                        </div>
                        <CardTitle className="line-clamp-1 text-lg">{name}</CardTitle>
                    </div>
                    {isOwner && <Badge variant="secondary">Owner</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {description || "No description provided."}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{memberCount} members</span>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Link href={`/groups/${id}`} className="w-full">
                    <Button variant="outline" className="w-full justify-between group">
                        View Group
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
