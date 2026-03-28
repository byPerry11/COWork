"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ColorPicker } from "@/components/color-picker"
import { EmojiPicker } from "@/components/emoji-picker"
import { updateProject } from "@/app/actions/projects"

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
    project_icon: z.string().optional(),
    max_users: z.coerce.number().min(1, "Se requiere al menos 1 miembro"),
})

type FormValues = {
    title: string
    description?: string
    color?: string
    project_icon?: string
    max_users: number
}


export interface EditProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    initialData: {
        title: string
        description?: string | null
        color?: string
        project_icon?: string
        max_users?: number
    }
}

export function EditProjectDialog({ open, onOpenChange, projectId, initialData }: EditProjectDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            title: initialData.title,
            description: initialData.description || "",
            color: initialData.color || "#6366f1",
            project_icon: initialData.project_icon || "📁",
            max_users: initialData.max_users ?? 1,
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                title: initialData.title,
                description: initialData.description || "",
                color: initialData.color || "#6366f1",
                project_icon: initialData.project_icon || "📁",
                max_users: initialData.max_users ?? 1,
            })
        }
    }, [open, initialData, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const result = await updateProject({
                project_id: projectId,
                title: values.title,
                description: values.description,
                color: values.color,
                project_icon: values.project_icon,
                max_users: values.max_users,
            })

            if (!result.success) {
                toast.error('Error al actualizar el proyecto', {
                    description: result.error,
                })
                return
            }

            toast.success('Proyecto actualizado exitosamente')
            onOpenChange(false)
            
            // Reload page to reflect changes
            router.refresh()
            
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error('Error inesperado al actualizar el proyecto')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Proyecto</DialogTitle>
                    <DialogDescription>
                        Actualiza la información básica de este proyecto.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Daily Inspection..." {...field} />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the project..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Color</FormLabel>
                                    <FormControl>
                                        <ColorPicker value={field.value || "#6366f1"} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="project_icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Icon</FormLabel>
                                    <FormControl>
                                        <EmojiPicker value={field.value || "📁"} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="max_users"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Límite de miembros</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="Ej. 10"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Número máximo de integrantes permitidos en el equipo.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="sm:justify-end">
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
