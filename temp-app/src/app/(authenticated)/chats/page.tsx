import { MessageCircle } from "lucide-react"

export default function ChatsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="p-5 rounded-full bg-muted">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Selecciona una conversación</h3>
        <p className="text-sm text-muted-foreground">
          Elige un chat de la lista o inicia una nueva conversación.
        </p>
      </div>
    </div>
  )
}
