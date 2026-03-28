"use client"

import { useRouter } from "next/navigation"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

export function ProjectsClientRefresher() {
    const router = useRouter()

    const handleProjectCreated = () => {
        router.refresh()
    }

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2 w-full md:w-auto">
                <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                    Manage and view all your projects.
                </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                <CreateProjectDialog onSuccess={handleProjectCreated} />
            </div>
        </div>
    )
}
