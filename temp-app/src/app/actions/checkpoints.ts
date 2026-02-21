'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }

// ============================================================================
// SCHEMAS
// ============================================================================

const createCheckpointSchema = z.object({
    project_id: z.string().uuid(),
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
    description: z.string().optional(),
    due_date: z.string().datetime().optional(),
    assigned_to: z.string().uuid().optional(),
    order: z.number().int().min(1).optional(),
    is_vacant: z.boolean().optional(),
    image_url: z.string().url().optional(),
})

const updateCheckpointSchema = z.object({
    checkpoint_id: z.string().uuid(),
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    due_date: z.string().datetime().optional(),
})

const toggleCheckpointSchema = z.object({
    checkpoint_id: z.string().uuid(),
    is_completed: z.boolean(),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function canManageProject(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    projectId: string
): Promise<boolean> {
    const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    return member?.role === 'admin' || member?.role === 'manager'
}

async function canManageCheckpoint(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    checkpointId: string
): Promise<boolean> {
    const { data: checkpoint } = await supabase
        .from('checkpoints')
        .select('project_id')
        .eq('id', checkpointId)
        .single()

    if (!checkpoint) return false

    return canManageProject(supabase, userId, checkpoint.project_id)
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Crear checkpoint
 */
export async function createCheckpoint(
    data: z.infer<typeof createCheckpointSchema>
): Promise<ActionResult<{ id: string }>> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        const validated = createCheckpointSchema.parse(data)

        // Verificar permisos
        const hasPermission = await canManageProject(
            supabase,
            user.id,
            validated.project_id
        )
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para crear checkpoints en este proyecto',
            }
        }

        // Crear checkpoint
        const { data: checkpoint, error: createError } = await supabase
            .from('checkpoints')
            .insert({
                project_id: validated.project_id,
                title: validated.title,
                description: validated.description,
                due_date: validated.due_date,
                assigned_to: validated.assigned_to,
                is_completed: false,
                order: validated.order,
                is_vacant: validated.is_vacant ?? false,
                image_url: validated.image_url,
            })
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating checkpoint:', createError)
            return { success: false, error: 'Error al crear el checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${validated.project_id}`)
        revalidatePath('/dashboard')

        return { success: true, data: { id: checkpoint.id } }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Actualizar checkpoint
 */
export async function updateCheckpoint(
    data: z.infer<typeof updateCheckpointSchema>
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        const validated = updateCheckpointSchema.parse(data)

        // Verificar permisos
        const hasPermission = await canManageCheckpoint(
            supabase,
            user.id,
            validated.checkpoint_id
        )
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para actualizar este checkpoint',
            }
        }

        // Obtener project_id para revalidación
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id')
            .eq('id', validated.checkpoint_id)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Actualizar checkpoint
        const updateData: Record<string, unknown> = {}
        if (validated.title !== undefined) updateData.title = validated.title
        if (validated.description !== undefined) updateData.description = validated.description
        if (validated.due_date !== undefined) updateData.due_date = validated.due_date

        const { error: updateError } = await supabase
            .from('checkpoints')
            .update(updateData)
            .eq('id', validated.checkpoint_id)

        if (updateError) {
            console.error('Error updating checkpoint:', updateError)
            return { success: false, error: 'Error al actualizar el checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Eliminar checkpoint
 */
export async function deleteCheckpoint(checkpointId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Verificar permisos
        const hasPermission = await canManageCheckpoint(supabase, user.id, checkpointId)
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para eliminar este checkpoint',
            }
        }

        // Obtener project_id para revalidación
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id')
            .eq('id', checkpointId)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Eliminar checkpoint (cascada elimina evidencias)
        const { error: deleteError } = await supabase
            .from('checkpoints')
            .delete()
            .eq('id', checkpointId)

        if (deleteError) {
            console.error('Error deleting checkpoint:', deleteError)
            return { success: false, error: 'Error al eliminar el checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Marcar checkpoint como completado/incompleto
 */
export async function toggleCheckpointCompletion(
    data: z.infer<typeof toggleCheckpointSchema>
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        const validated = toggleCheckpointSchema.parse(data)

        // Obtener checkpoint con project_id
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id, assigned_to')
            .eq('id', validated.checkpoint_id)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Verificar permisos (asignado o admin/manager)
        const isAssigned = checkpoint.assigned_to === user.id
        const isManager = await canManageProject(supabase, user.id, checkpoint.project_id)

        if (!isAssigned && !isManager) {
            return {
                success: false,
                error: 'No tienes permisos para cambiar el estado de este checkpoint',
            }
        }

        // Actualizar estado
        const { error: updateError } = await supabase
            .from('checkpoints')
            .update({ is_completed: validated.is_completed })
            .eq('id', validated.checkpoint_id)

        if (updateError) {
            console.error('Error toggling checkpoint:', updateError)
            return { success: false, error: 'Error al actualizar el estado del checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================================================

async function isMemberOfProject(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    projectId: string
): Promise<boolean> {
    const { data: member } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    return !!member
}

// ============================================================================
// ADDITIONAL CHECKPOINT ACTIONS
// ============================================================================

/**
 * Reclamar checkpoint vacante (claim task)
 */
export async function claimCheckpoint(checkpointId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Obtener checkpoint con project_id
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id, is_vacant')
            .eq('id', checkpointId)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        if (!checkpoint.is_vacant) {
            return { success: false, error: 'Este checkpoint ya no está disponible' }
        }

        // Verificar que es miembro del proyecto
        const isMember = await isMemberOfProject(supabase, user.id, checkpoint.project_id)
        if (!isMember) {
            return { success: false, error: 'No eres miembro de este proyecto' }
        }

        // Insertar assignment
        const { error: assignError } = await supabase
            .from('checkpoint_assignments')
            .insert({ checkpoint_id: checkpointId, user_id: user.id })

        if (assignError) {
            console.error('Error assigning checkpoint:', assignError)
            return { success: false, error: 'Error al reclamar el checkpoint' }
        }

        // Marcar como no vacante
        const { error: updateError } = await supabase
            .from('checkpoints')
            .update({ is_vacant: false })
            .eq('id', checkpointId)

        if (updateError) {
            console.error('Error updating checkpoint:', updateError)
            return { success: false, error: 'Error al actualizar el checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Revertir checkpoint a vacante (revert to vacant)
 */
export async function revertCheckpointToVacant(checkpointId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Verificar permisos
        const hasPermission = await canManageCheckpoint(supabase, user.id, checkpointId)
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para revertir este checkpoint',
            }
        }

        // Obtener project_id para revalidación
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id')
            .eq('id', checkpointId)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Eliminar todas las asignaciones
        const { error: deleteError } = await supabase
            .from('checkpoint_assignments')
            .delete()
            .eq('checkpoint_id', checkpointId)

        if (deleteError) {
            console.error('Error deleting assignments:', deleteError)
            return { success: false, error: 'Error al eliminar asignaciones' }
        }

        // Marcar como vacante
        const { error: updateError } = await supabase
            .from('checkpoints')
            .update({ is_vacant: true })
            .eq('id', checkpointId)

        if (updateError) {
            console.error('Error updating checkpoint:', updateError)
            return { success: false, error: 'Error al actualizar el checkpoint' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Remover asignado de checkpoint
 */
export async function removeCheckpointAssignee(
    checkpointId: string,
    userId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Verificar permisos
        const hasPermission = await canManageCheckpoint(supabase, user.id, checkpointId)
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para gestionar asignaciones',
            }
        }

        // Obtener project_id para revalidación
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id')
            .eq('id', checkpointId)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Eliminar asignación
        const { error: deleteError } = await supabase
            .from('checkpoint_assignments')
            .delete()
            .match({ checkpoint_id: checkpointId, user_id: userId })

        if (deleteError) {
            console.error('Error removing assignee:', deleteError)
            return { success: false, error: 'Error al remover asignado' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}
