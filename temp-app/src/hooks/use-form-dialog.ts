"use client"

import { useState } from "react"
import { useForm, UseFormReturn, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ZodType, ZodObject, z } from "zod"
import { toast } from "sonner"

interface UseFormDialogOptions<T extends ZodType<any, any, any>> {
  schema: T
  defaultValues?: Partial<z.infer<T>>
  onSubmit: (values: z.infer<T>) => Promise<{ success: boolean; error?: string }>
  onSuccess?: () => void
  successMessage?: string
  errorMessage?: string
}

interface UseFormDialogReturn {
  form: UseFormReturn<any>
  isLoading: boolean
  open: boolean
  setOpen: (open: boolean) => void
  handleSubmit: SubmitHandler<any>
}

export function useFormDialog<T extends ZodType<any, any, any>>(
  options: UseFormDialogOptions<T>
): UseFormDialogReturn {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(options.schema),
    defaultValues: options.defaultValues,
  })

  const handleSubmit: SubmitHandler<any> = async (values) => {
    setIsLoading(true)
    try {
      const result = await options.onSubmit(values)

      if (!result.success) {
        toast.error(options.errorMessage || "An error occurred", {
          description: result.error,
        })
        return
      }

      toast.success(options.successMessage || "Operation completed successfully")
      form.reset()
      setOpen(false)
      if (options.onSuccess) options.onSuccess()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    isLoading,
    open,
    setOpen,
    handleSubmit,
  }
}

interface UseDialogOptions {
  onOpenChange?: (open: boolean) => void
}

interface UseDialogReturn {
  open: boolean
  setOpen: (open: boolean) => void
}

export function useDialog(options?: UseDialogOptions): UseDialogReturn {
  const [open, setOpenState] = useState(false)

  const setOpen = (newOpen: boolean) => {
    setOpenState(newOpen)
    options?.onOpenChange?.(newOpen)
  }

  return { open, setOpen }
}
