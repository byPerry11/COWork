"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    AlertTriangle,
    ArrowRightLeft,
    Eye,
    EyeOff,
    Trash2,
} from "lucide-react"
import { useState } from "react"
import { ProjectMemberWithProfile } from "@/types"

// Redefine locally if types not exported or import from common
interface DangerZoneTabProps {
    isPublic: boolean
    projectTitle: string
    members: ProjectMemberWithProfile[]
    isLoading: boolean
    onToggleVisibility: () => Promise<void>
    onTransferOwnership: (userId: string) => Promise<boolean>
    onDeleteProject: (title: string) => Promise<boolean>
}

export function DangerZoneTab({
    isPublic,
    projectTitle,
    members,
    isLoading,
    onToggleVisibility,
    onTransferOwnership,
    onDeleteProject
}: DangerZoneTabProps) {
    const [showTransferConfirm, setShowTransferConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [transferToUserId, setTransferToUserId] = useState<string | null>(null)
    const [confirmTitle, setConfirmTitle] = useState("")

    const activeMembers = members.filter(m => m.status === 'active' && m.role !== 'admin')

    const handleTransfer = async () => {
        if (transferToUserId) {
            const success = await onTransferOwnership(transferToUserId)
            if (success) {
                setShowTransferConfirm(false)
            }
        }
    }

    const handleDelete = async () => {
        await onDeleteProject(confirmTitle)
    }

    return (
        <div className="flex-1 overflow-auto space-y-4 py-4">
            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isPublic ? <Eye className="h-5 w-5 text-orange-600" /> : <EyeOff className="h-5 w-5 text-orange-600" />}
                        <div>
                            <p className="font-medium text-sm">Project Visibility</p>
                            <p className="text-xs text-muted-foreground">
                                {isPublic ? "Anyone can see this project" : "Only members can see this project"}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isPublic}
                        onCheckedChange={() => onToggleVisibility()}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Transfer Ownership */}
            <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
                <div className="flex items-center gap-3 mb-3">
                    <ArrowRightLeft className="h-5 w-5 text-yellow-600" />
                    <div>
                        <p className="font-medium text-sm">Transfer Ownership</p>
                        <p className="text-xs text-muted-foreground">
                            Transfer this project to another team member
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select value={transferToUserId || ""} onValueChange={setTransferToUserId}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select new owner" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeMembers.map((member) => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                    {member.profile?.display_name || member.profile?.username || "Unknown"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={() => setShowTransferConfirm(true)}
                        disabled={!transferToUserId || isLoading}
                    >
                        Transfer
                    </Button>
                </div>
            </div>

            {/* Delete Project */}
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                        <p className="font-medium text-sm text-destructive">Delete Project</p>
                        <p className="text-xs text-muted-foreground">
                            Permanently delete this project and all its data
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                </Button>
            </div>

            {/* Transfer Ownership Confirmation */}
            <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to transfer ownership of this project? You will become a regular member and the new owner will have full control.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTransfer}>
                            Transfer Ownership
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Project Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-2">
                            This action cannot be undone. This will permanently delete the project
                            <strong> {projectTitle}</strong> and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Type the project name to confirm</Label>
                        <Input
                            value={confirmTitle}
                            onChange={(e) => setConfirmTitle(e.target.value)}
                            placeholder={projectTitle}
                            className="font-mono"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={confirmTitle !== projectTitle}
                        >
                            I understand, delete this project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
