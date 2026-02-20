"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Project } from "@/types"

export function useProjectSettings(project: Project, onUpdate?: () => void) {
    const [isLoading, setIsLoading] = useState(false)

    // General Settings
    const updateGeneralSettings = async (
        title: string,
        description: string,
        category: string,
        projectIcon: string
    ) => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    title,
                    description,
                    category,
                    project_icon: projectIcon,
                })
                .eq('id', project.id)

            if (error) throw error

            toast.success("Project updated successfully")
            onUpdate?.()
            return true
        } catch (error: any) {
            toast.error("Failed to update project", { description: error.message })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    // Visibility
    const toggleVisibility = async (currentVisibility: boolean) => {
        setIsLoading(true)
        try {
            const newVisibility = !currentVisibility
            const { error } = await supabase
                .from('projects')
                .update({ is_public: newVisibility })
                .eq('id', project.id)

            if (error) throw error

            toast.success(newVisibility ? "Project is now public" : "Project is now private")
            onUpdate?.()
            return newVisibility
        } catch (error: any) {
            toast.error("Failed to update visibility", { description: error.message })
            return null
        } finally {
            setIsLoading(false)
        }
    }

    // Members
    const kickMember = async (userId: string) => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('project_members')
                .update({ status: 'left' })
                .eq('project_id', project.id)
                .eq('user_id', userId)

            if (error) throw error

            toast.success("Member removed from project")
            onUpdate?.()
            return true
        } catch (error: any) {
            toast.error("Failed to remove member", { description: error.message })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    // Danger Zone
    const transferOwnership = async (newOwnerId: string) => {
        setIsLoading(true)
        try {
            // Update the project owner
            const { error: projectError } = await supabase
                .from('projects')
                .update({ owner_id: newOwnerId })
                .eq('id', project.id)

            if (projectError) throw projectError

            // Update roles: new owner becomes admin, old owner becomes member
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Update new owner to admin
                await supabase
                    .from('project_members')
                    .update({ role: 'admin' })
                    .eq('project_id', project.id)
                    .eq('user_id', newOwnerId)

                // Update old owner to member
                await supabase
                    .from('project_members')
                    .update({ role: 'member' })
                    .eq('project_id', project.id)
                    .eq('user_id', user.id)
            }

            toast.success("Ownership transferred successfully")
            onUpdate?.()
            return true
        } catch (error: any) {
            toast.error("Failed to transfer ownership", { description: error.message })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const deleteProject = async (confirmTitle: string) => {
        if (confirmTitle !== project.title) return false

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', project.id)

            if (error) throw error

            toast.success("Project deleted successfully")
            return true
        } catch (error: any) {
            toast.error("Failed to delete project", { description: error.message })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        isLoading,
        updateGeneralSettings,
        toggleVisibility,
        kickMember,
        transferOwnership,
        deleteProject
    }
}
