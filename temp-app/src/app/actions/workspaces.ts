'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Workspace, WorkspaceCategory } from '@/types'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const createWorkspaceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  category: z.enum(['Escuela', 'Trabajo', 'Hobby', 'Otro']),
})

const updateWorkspaceSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(3).optional(),
  category: z.enum(['Escuela', 'Trabajo', 'Hobby', 'Otro']).optional(),
})

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// FUNCIONES HELPER
// =====================================================

async function isWorkspaceOwner(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  return workspace?.owner_id === userId
}

// =====================================================
// SERVER ACTIONS
// =====================================================

/**
 * Obtener todos los workspaces del usuario actual
 */
export async function getWorkspaces(): Promise<ActionResult<Workspace[]>> {
  try {
    const supabase = await createClient()

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Error de autenticación' }
    }

    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspaces:', error)
      return { success: false, error: 'Error al obtener los workspaces' }
    }

    return { success: true, data: workspaces as Workspace[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al obtener workspaces' }
  }
}

/**
 * Crear un nuevo workspace
 */
export async function createWorkspace(
  data: z.infer<typeof createWorkspaceSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Error de autenticación' }
    }

    // Validar datos
    const validated = createWorkspaceSchema.parse(data)

    // Crear workspace
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: validated.name,
        category: validated.category,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError)
      return { success: false, error: 'Error al crear el workspace' }
    }

    // Revalidar caché
    revalidatePath('/dashboard')

    return { success: true, data: { id: workspaceData.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al crear el workspace' }
  }
}

/**
 * Actualizar un workspace existente
 */
export async function updateWorkspace(
  data: z.infer<typeof updateWorkspaceSchema>
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

    const validated = updateWorkspaceSchema.parse(data)

    // Verificar permisos
    const isOwner = await isWorkspaceOwner(supabase, user.id, validated.workspace_id)
    if (!isOwner) {
      return {
        success: false,
        error: 'No tienes permisos para actualizar este workspace',
      }
    }

    // Construir objeto de actualización
    const updateData: any = {}
    if (validated.name) updateData.name = validated.name
    if (validated.category) updateData.category = validated.category

    // Actualizar workspace
    const { error: updateError } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', validated.workspace_id)

    if (updateError) {
      console.error('Error updating workspace:', updateError)
      return { success: false, error: 'Error al actualizar el workspace' }
    }

    // Revalidar caché
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al actualizar el workspace' }
  }
}

/**
 * Eliminar workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Error de autenticación' }
    }

    // Verificar que el usuario es el owner
    const isOwner = await isWorkspaceOwner(supabase, user.id, workspaceId)
    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede eliminar el workspace',
      }
    }

    // Eliminar workspace
    const { error: deleteError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (deleteError) {
      console.error('Error deleting workspace:', deleteError)
      return { success: false, error: 'Error al eliminar el workspace' }
    }

    // Revalidar caché
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al eliminar el workspace' }
  }
}
