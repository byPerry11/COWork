"use client"

import { Plus, Briefcase, FolderPlus, FilePlus2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"

export function CreationDropdown({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create +
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <CreateWorkspaceDialog 
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Workspace</span>
            </DropdownMenuItem>
          } 
        />
        <CreateGroupDialog 
          onSuccess={onSuccess}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Work Group</span>
            </DropdownMenuItem>
          } 
        />
        <CreateProjectDialog 
          onSuccess={onSuccess || (() => {})}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              <span>Project</span>
            </DropdownMenuItem>
          } 
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
