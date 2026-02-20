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

const updateProfileSchema = z.object({
    display_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50).optional(),
    bio: z.string().max(500).optional(),
    avatar_url: z.string().url().optional(),
})

const updatePasswordSchema = z.object({
    current_password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    new_password: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Actualizar perfil de usuario
 */
export async function updateProfile(
    data: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autenticado' }
        }

        const validated = updateProfileSchema.parse(data)

        // Actualizar perfil
        const updateData: Record<string, unknown> = {}
        if (validated.display_name !== undefined) updateData.display_name = validated.display_name
        if (validated.bio !== undefined) updateData.bio = validated.bio
        if (validated.avatar_url !== undefined) updateData.avatar_url = validated.avatar_url

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return { success: false, error: 'Error al actualizar el perfil' }
        }

        // Revalidar caché
        revalidatePath('/profile')
        revalidatePath('/dashboard')

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
 * Actualizar avatar de usuario
 */
export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autenticado' }
        }

        // Validar URL
        const urlSchema = z.string().url()
        const validated = urlSchema.parse(avatarUrl)

        // Actualizar avatar
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: validated })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating avatar:', updateError)
            return { success: false, error: 'Error al actualizar el avatar' }
        }

        // Revalidar caché
        revalidatePath('/profile')
        revalidatePath('/dashboard')

        return { success: true, data: undefined }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'URL de avatar inválida' }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Cambiar contraseña de usuario
 */
export async function updatePassword(
    data: z.infer<typeof updatePasswordSchema>
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autenticado' }
        }

        const validated = updatePasswordSchema.parse(data)

        // Verificar contraseña actual (intentando sign in)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: validated.current_password,
        })

        if (signInError) {
            return { success: false, error: 'Contraseña actual incorrecta' }
        }

        // Actualizar contraseña
        const { error: updateError } = await supabase.auth.updateUser({
            password: validated.new_password,
        })

        if (updateError) {
            console.error('Error updating password:', updateError)
            return { success: false, error: 'Error al cambiar la contraseña' }
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
