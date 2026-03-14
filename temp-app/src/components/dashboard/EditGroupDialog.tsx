"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateGroup } from "@/app/actions/groups"

const formSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    description: z.string().optional(),
})

export interface EditGroupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupId: string
    initialData: {
        name: string
        description?: string | null
    }
}

export function EditGroupDialog({ open, onOpenChange, groupId, initialData }: EditGroupDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData.name,
            description: initialData.description || "",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                name: initialData.name,
                description: initialData.description || "",
            })
        }
    }, [open, initialData, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const result = await updateGroup({
                group_id: groupId,
                name: values.name,
                description: values.description,
            })

            if (!result.success) {
                toast.error('Error al actualizar grupo', {
                    description: result.error,
                })
                return
            }

            toast.success('Grupo de trabajo actualizado exitosamente')
            onOpenChange(false)
            
            // Reload page to reflect changes
            window.location.reload()
            
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado al actualizar el grupo')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Grupo de Trabajo</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de este grupo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Grupo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Equipo de Ingeniería..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="¿Para qué es este grupo?"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="sm:justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
