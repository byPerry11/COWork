'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown, Blocks, GraduationCap, Briefcase, Gamepad2, LayoutDashboard } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getWorkspaces } from '@/app/actions/workspaces'
import { Workspace } from '@/types'
import { CreateWorkspaceDialog } from './create-workspace-dialog'

interface WorkspaceSelectorProps {
  className?: string
}

export function WorkspaceSelector({ className }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Cargar workspaces
  useEffect(() => {
    async function loadWorkspaces() {
      setIsLoading(true)
      const result = await getWorkspaces()
      if (result.success && result.data) {
        setWorkspaces(result.data)
        
        // Determinar workspace activo desde URL o localStorage
        const workspaceIdParam = searchParams.get('workspace')
        const storedWorkspaceId = typeof window !== 'undefined' ? localStorage.getItem('active-workspace') : null
        
        const targetId = workspaceIdParam || storedWorkspaceId
        
        if (targetId) {
          const found = result.data.find(w => w.id === targetId)
          if (found) {
            setActiveWorkspace(found)
            return
          }
        }
        
        // Fallback al primero de la lista si hay alguno
        if (result.data.length > 0) {
          setActiveWorkspace(result.data[0])
          if (typeof window !== 'undefined') {
             localStorage.setItem('active-workspace', result.data[0].id)
          }
        }
      }
      setIsLoading(false)
    }
    
    loadWorkspaces()
  }, [searchParams])

  const handleSelect = (workspaceId: string) => {
    const selected = workspaces.find((w) => w.id === workspaceId) || null
    setActiveWorkspace(selected)
    
    if (typeof window !== 'undefined' && selected) {
      localStorage.setItem('active-workspace', selected.id)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('active-workspace')
    }
    
    setOpen(false)
    
    // Actualizar URL parameters y mantener la ruta actual
    const params = new URLSearchParams(searchParams.toString())
    if (workspaceId) {
      params.set('workspace', workspaceId)
    } else {
      params.delete('workspace')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Escuela': return <GraduationCap className="mr-2 h-4 w-4" />
      case 'Trabajo': return <Briefcase className="mr-2 h-4 w-4" />
      case 'Hobby': return <Gamepad2 className="mr-2 h-4 w-4" />
      case 'Otro': return <LayoutDashboard className="mr-2 h-4 w-4" />
      default: return <Blocks className="mr-2 h-4 w-4" />
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center truncate">
              {activeWorkspace ? (
                <>
                  {getCategoryIcon(activeWorkspace.category)}
                  <span className="truncate">{activeWorkspace.name}</span>
                </>
              ) : isLoading ? (
                "Cargando..."
              ) : (
                <>
                  <Blocks className="mr-2 h-4 w-4" />
                  <span className="truncate">Todos los proyectos</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar workspace..." />
            <CommandList>
              <CommandEmpty>No se encontró ningún workspace.</CommandEmpty>
              
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSelect('')}
                  className="cursor-pointer"
                >
                  <Blocks className="mr-2 h-4 w-4" />
                  Todos los proyectos
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      !activeWorkspace ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>

              {workspaces.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Mis Workspaces">
                    {workspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        onSelect={() => handleSelect(workspace.id)}
                        className="cursor-pointer"
                      >
                        {getCategoryIcon(workspace.category)}
                        <span className="truncate">{workspace.name}</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            activeWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            
            <CommandSeparator />
            <div className="p-2">
              <CreateWorkspaceDialog />
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
