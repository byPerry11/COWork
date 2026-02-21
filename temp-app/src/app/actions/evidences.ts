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

const submitEvidenceSchema = z.object({
    checkpoint_id: z.string().uuid(),
    note: z.string().optional(),
    image_url: z.string().url().optional(),
})

const updateEvidenceSchema = z.object({
    evidence_id: z.string().uuid(),
    note: z.string().optional(),
    image_url: z.string().url().optional(),
})

const reviewEvidenceSchema = z.object({
    evidence_id: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    feedback: z.string().optional(),
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
// ACTIONS
// ============================================================================

/**
 * Enviar evidencia para un checkpoint
 */
export async function submitEvidence(
    data: z.infer<typeof submitEvidenceSchema>
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

        const validated = submitEvidenceSchema.parse(data)

        // Obtener checkpoint y project_id
        const { data: checkpoint } = await supabase
            .from('checkpoints')
            .select('project_id')
            .eq('id', validated.checkpoint_id)
            .single()

        if (!checkpoint) {
            return { success: false, error: 'Checkpoint no encontrado' }
        }

        // Verificar que el usuario es miembro del proyecto
        const isMember = await isMemberOfProject(supabase, user.id, checkpoint.project_id)
        if (!isMember) {
            return {
                success: false,
                error: 'No eres miembro de este proyecto',
            }
        }

        // Crear evidencia
        const { data: evidence, error: createError } = await supabase
            .from('evidences')
            .insert({
                checkpoint_id: validated.checkpoint_id,
                user_id: user.id,
                note: validated.note,
                image_url: validated.image_url,
                status: 'pending',
            })
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating evidence:', createError)
            return { success: false, error: 'Error al enviar la evidencia' }
        }

        // Revalidar caché
        revalidatePath(`/projects/${checkpoint.project_id}`)

        return { success: true, data: { id: evidence.id } }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Actualizar evidencia
 */
export async function updateEvidence(
    data: z.infer<typeof updateEvidenceSchema>
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

        const validated = updateEvidenceSchema.parse(data)

        // Obtener evidencia con checkpoint y project_id
        const { data: evidence } = await supabase
            .from('evidences')
            .select('user_id, checkpoints(project_id)')
            .eq('id', validated.evidence_id)
            .single()

        if (!evidence) {
            return { success: false, error: 'Evidencia no encontrada' }
        }

        // Verificar permisos (creador o admin/manager)
        const isCreator = evidence.user_id === user.id
        const projectId = (evidence.checkpoints as unknown as { project_id: string })?.project_id
        const isManager = projectId ? await canManageProject(supabase, user.id, projectId) : false

        if (!isCreator && !isManager) {
            return {
                success: false,
                error: 'No tienes permisos para actualizar esta evidencia',
            }
        }

        // Actualizar evidencia
        const updateData: Record<string, unknown> = {}
        if (validated.note !== undefined) updateData.note = validated.note
        if (validated.image_url !== undefined) updateData.image_url = validated.image_url

        const { error: updateError } = await supabase
            .from('evidences')
            .update(updateData)
            .eq('id', validated.evidence_id)

        if (updateError) {
            console.error('Error updating evidence:', updateError)
            return { success: false, error: 'Error al actualizar la evidencia' }
        }

        // Revalidar caché
        if (projectId) {
            revalidatePath(`/projects/${projectId}`)
        }

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
 * Eliminar evidencia
 */
export async function deleteEvidence(evidenceId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Obtener evidencia con checkpoint y project_id
        const { data: evidence } = await supabase
            .from('evidences')
            .select('user_id, checkpoint_id, checkpoints(project_id)')
            .eq('id', evidenceId)
            .single()

        if (!evidence) {
            return { success: false, error: 'Evidencia no encontrada' }
        }

        // Verificar permisos (creador o admin/manager)
        const isCreator = evidence.user_id === user.id
        const projectId = (evidence.checkpoints as unknown as { project_id: string })?.project_id
        const isManager = projectId ? await canManageProject(supabase, user.id, projectId) : false

        if (!isCreator && !isManager) {
            return {
                success: false,
                error: 'No tienes permisos para eliminar esta evidencia',
            }
        }

        // Eliminar evidencia
        const { error: deleteError } = await supabase
            .from('evidences')
            .delete()
            .eq('id', evidenceId)

        if (deleteError) {
            console.error('Error deleting evidence:', deleteError)
            return { success: false, error: 'Error al eliminar la evidencia' }
        }

        // Marcar checkpoint como incompleto
        await supabase
            .from('checkpoints')
            .update({ is_completed: false })
            .eq('id', evidence.checkpoint_id)

        // Revalidar caché
        if (projectId) {
            revalidatePath(`/projects/${projectId}`)
        }

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Aprobar evidencia
 */
export async function approveEvidence(evidenceId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Error de autenticación' }
        }

        // Obtener evidencia con checkpoint y project_id
        const { data: evidence } = await supabase
            .from('evidences')
            .select('checkpoint_id, checkpoints(project_id)')
            .eq('id', evidenceId)
            .single()

        if (!evidence) {
            return { success: false, error: 'Evidencia no encontrada' }
        }

        const projectId = (evidence.checkpoints as unknown as { project_id: string })?.project_id

        // Verificar permisos (admin/manager)
        const hasPermission = projectId ? await canManageProject(supabase, user.id, projectId) : false
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para aprobar evidencias',
            }
        }

        // Aprobar evidencia
        const { error: updateError } = await supabase
            .from('evidences')
            .update({
                status: 'approved',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', evidenceId)

        if (updateError) {
            console.error('Error approving evidence:', updateError)
            return { success: false, error: 'Error al aprobar la evidencia' }
        }

        // Marcar checkpoint como completado
        await supabase
            .from('checkpoints')
            .update({ is_completed: true })
            .eq('id', evidence.checkpoint_id)

        // Revalidar caché
        if (projectId) {
            revalidatePath(`/projects/${projectId}`)
        }

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Rechazar evidencia
 */
export async function rejectEvidence(
    data: z.infer<typeof reviewEvidenceSchema>
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

        const validated = reviewEvidenceSchema.parse(data)

        if (validated.status !== 'rejected') {
            return { success: false, error: 'Estado inválido para rechazo' }
        }

        // Obtener evidencia con checkpoint y project_id
        const { data: evidence } = await supabase
            .from('evidences')
            .select('checkpoint_id, checkpoints(project_id)')
            .eq('id', validated.evidence_id)
            .single()

        if (!evidence) {
            return { success: false, error: 'Evidencia no encontrada' }
        }

        const projectId = (evidence.checkpoints as unknown as { project_id: string })?.project_id

        // Verificar permisos (admin/manager)
        const hasPermission = projectId ? await canManageProject(supabase, user.id, projectId) : false
        if (!hasPermission) {
            return {
                success: false,
                error: 'No tienes permisos para rechazar evidencias',
            }
        }

        // Rechazar evidencia
        const { error: updateError } = await supabase
            .from('evidences')
            .update({
                status: 'rejected',
                feedback: validated.feedback,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', validated.evidence_id)

        if (updateError) {
            console.error('Error rejecting evidence:', updateError)
            return { success: false, error: 'Error al rechazar la evidencia' }
        }

        // Marcar checkpoint como incompleto
        await supabase
            .from('checkpoints')
            .update({ is_completed: false })
            .eq('id', evidence.checkpoint_id)

        // Revalidar caché
        if (projectId) {
            revalidatePath(`/projects/${projectId}`)
        }

        return { success: true, data: undefined }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}
