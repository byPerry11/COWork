"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useProjectSettings } from "@/hooks/use-project-settings"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import { Project, ProjectMemberWithProfile } from "@/types"
import { GeneralSettingsTab } from "./settings/general-settings-tab"
import { MembersTab } from "./settings/members-tab"
import { DangerZoneTab } from "./settings/danger-zone-tab"

interface ProjectSettingsDialogProps {
    project: Project
    members: ProjectMemberWithProfile[]
    isOwner: boolean
    onProjectUpdate?: () => void
}

export function ProjectSettingsDialog({
    project,
    members,
    isOwner,
    onProjectUpdate
}: ProjectSettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPublic, setIsPublic] = useState(project.is_public ?? false)

    // Reset state when dialog opens or project updates
    useEffect(() => {
        if (open) {
            setIsPublic(project.is_public ?? false)
        }
    }, [open, project])

    const {
        isLoading,
        updateGeneralSettings,
        toggleVisibility,
        kickMember,
        transferOwnership,
        deleteProject
    } = useProjectSettings(project, onProjectUpdate)

    const handleToggleVisibility = async () => {
        const newVisibility = await toggleVisibility(isPublic)
        if (newVisibility !== null) {
            setIsPublic(newVisibility)
        }
    }

    const handleDeleteProject = async (title: string) => {
        const success = await deleteProject(title)
        if (success) {
            setOpen(false)
            window.location.href = '/dashboard'
        }
        return success
    }

    const handleTransferOwnership = async (userId: string) => {
        const success = await transferOwnership(userId)
        if (success) {
            setOpen(false)
        }
        return success
    }

    if (!isOwner) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-auto md:px-4 md:gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                    <DialogDescription>
                        Manage your project settings and team members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">Danger</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="flex-1 overflow-auto">
                        <GeneralSettingsTab
                            initialTitle={project.title}
                            initialDescription={project.description || ""}
                            initialCategory={project.category || ""}
                            initialIcon={project.project_icon || "📁"}
                            isLoading={isLoading}
                            onSave={updateGeneralSettings}
                        />
                    </TabsContent>

                    <TabsContent value="members" className="flex-1 overflow-hidden">
                        <MembersTab
                            members={members}
                            onKickMember={kickMember}
                        />
                    </TabsContent>

                    <TabsContent value="danger" className="flex-1 overflow-auto">
                        <DangerZoneTab
                            isPublic={isPublic}
                            projectTitle={project.title}
                            members={members}
                            isLoading={isLoading}
                            onToggleVisibility={handleToggleVisibility}
                            onTransferOwnership={handleTransferOwnership}
                            onDeleteProject={handleDeleteProject}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
