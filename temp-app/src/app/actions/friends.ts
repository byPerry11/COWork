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

const sendFriendRequestSchema = z.object({
    receiver_id: z.string().uuid(),
})

const respondToRequestSchema = z.object({
    request_id: z.string().uuid(),
})

const removeFriendSchema = z.object({
    friend_id: z.string().uuid(),
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Enviar solicitud de amistad
 */
export async function sendFriendRequest(
    data: z.infer<typeof sendFriendRequestSchema>
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

        const validated = sendFriendRequestSchema.parse(data)

        // Verificar que no se envíe solicitud a sí mismo
        if (validated.receiver_id === user.id) {
            return { success: false, error: 'No puedes enviarte una solicitud a ti mismo' }
        }

        // Verificar que no exista una solicitud pendiente o amistad activa
        const { data: existingRequest } = await supabase
            .from('friend_requests')
            .select('id, status')
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${validated.receiver_id}),and(sender_id.eq.${validated.receiver_id},receiver_id.eq.${user.id})`
            )
            .maybeSingle()

        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                return { success: false, error: 'Ya son amigos' }
            }
            if (existingRequest.status === 'pending') {
                return { success: false, error: 'Ya existe una solicitud pendiente' }
            }
        }

        // Crear solicitud
        const { data: request, error: createError } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: user.id,
                receiver_id: validated.receiver_id,
                status: 'pending',
            })
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating friend request:', createError)
            return { success: false, error: 'Error al enviar la solicitud' }
        }

        // Revalidar caché
        revalidatePath(`/profile/${validated.receiver_id}`)
        revalidatePath('/friends')

        return { success: true, data: { id: request.id } }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

/**
 * Aceptar solicitud de amistad
 */
export async function acceptFriendRequest(
    data: z.infer<typeof respondToRequestSchema>
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

        const validated = respondToRequestSchema.parse(data)

        // Verificar que la solicitud existe y es para el usuario actual
        const { data: request } = await supabase
            .from('friend_requests')
            .select('id, sender_id, receiver_id, status')
            .eq('id', validated.request_id)
            .single()

        if (!request) {
            return { success: false, error: 'Solicitud no encontrada' }
        }

        if (request.receiver_id !== user.id) {
            return { success: false, error: 'No tienes permisos para aceptar esta solicitud' }
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Esta solicitud ya fue procesada' }
        }

        // Actualizar estado a aceptado
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', validated.request_id)

        if (updateError) {
            console.error('Error accepting friend request:', updateError)
            return { success: false, error: 'Error al aceptar la solicitud' }
        }

        // Revalidar caché
        revalidatePath(`/profile/${request.sender_id}`)
        revalidatePath('/friends')

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
 * Rechazar solicitud de amistad
 */
export async function rejectFriendRequest(
    data: z.infer<typeof respondToRequestSchema>
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

        const validated = respondToRequestSchema.parse(data)

        // Verificar que la solicitud existe y es para el usuario actual
        const { data: request } = await supabase
            .from('friend_requests')
            .select('id, sender_id, receiver_id, status')
            .eq('id', validated.request_id)
            .single()

        if (!request) {
            return { success: false, error: 'Solicitud no encontrada' }
        }

        if (request.receiver_id !== user.id) {
            return { success: false, error: 'No tienes permisos para rechazar esta solicitud' }
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Esta solicitud ya fue procesada' }
        }

        // Eliminar la solicitud
        const { error: deleteError } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', validated.request_id)

        if (deleteError) {
            console.error('Error rejecting friend request:', deleteError)
            return { success: false, error: 'Error al rechazar la solicitud' }
        }

        // Revalidar caché
        revalidatePath(`/profile/${request.sender_id}`)
        revalidatePath('/friends')

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
 * Eliminar amistad
 */
export async function removeFriend(
    data: z.infer<typeof removeFriendSchema>
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

        const validated = removeFriendSchema.parse(data)

        // Buscar la amistad (puede estar en cualquier dirección)
        const { data: friendship } = await supabase
            .from('friend_requests')
            .select('id, sender_id, receiver_id, status')
            .eq('status', 'accepted')
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${validated.friend_id}),and(sender_id.eq.${validated.friend_id},receiver_id.eq.${user.id})`
            )
            .maybeSingle()

        if (!friendship) {
            return { success: false, error: 'Amistad no encontrada' }
        }

        // Eliminar la amistad
        const { error: deleteError } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', friendship.id)

        if (deleteError) {
            console.error('Error removing friend:', deleteError)
            return { success: false, error: 'Error al eliminar la amistad' }
        }

        // Revalidar caché
        revalidatePath(`/profile/${validated.friend_id}`)
        revalidatePath('/friends')

        return { success: true, data: undefined }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error:', error)
        return { success: false, error: 'Error inesperado' }
    }
}
