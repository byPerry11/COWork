'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Briefcase, GraduationCap, Gamepad2, LayoutDashboard } from 'lucide-react'
import { createWorkspace } from '@/app/actions/workspaces'
import { WorkspaceCategory } from '@/types'
import { toast } from 'sonner'

export function CreateWorkspaceDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<WorkspaceCategory>('Trabajo')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createWorkspace({
        name,
        category,
      })

      if (result.success) {
        toast.success('Workspace creado exitosamente')
        setOpen(false)
        setName('')
        setCategory('Trabajo')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al crear el workspace')
      }
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (cat: WorkspaceCategory) => {
    switch (cat) {
      case 'Escuela': return <GraduationCap className="h-4 w-4 mr-2" />
      case 'Trabajo': return <Briefcase className="h-4 w-4 mr-2" />
      case 'Hobby': return <Gamepad2 className="h-4 w-4 mr-2" />
      case 'Otro': return <LayoutDashboard className="h-4 w-4 mr-2" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button variant="outline" className="w-full justify-start mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Workspace
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Workspace</DialogTitle>
          <DialogDescription>
            Un workspace te ayuda a organizar tus proyectos y grupos de trabajo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Proyectos Personales"
                required
                minLength={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as WorkspaceCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Escuela">
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Escuela
                    </div>
                  </SelectItem>
                  <SelectItem value="Trabajo">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Trabajo
                    </div>
                  </SelectItem>
                  <SelectItem value="Hobby">
                    <div className="flex items-center">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Hobby
                    </div>
                  </SelectItem>
                  <SelectItem value="Otro">
                    <div className="flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Otro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || name.length < 3}>
              {isLoading ? 'Creando...' : 'Crear Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
