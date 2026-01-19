import { useState } from "react";
import { Checkpoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Camera, GripVertical, ChevronDown, User as UserIcon, X as XIcon, ImageIcon, AlertCircle, RotateCcw } from "lucide-react";
import { EvidenceForm } from "@/components/evidence-form";
import { EvidenceViewer } from "@/components/evidence-viewer";
import { CheckpointTasksList } from "@/components/checkpoint-tasks-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { AvatarStack } from "@/components/avatar-stack";
import { claimCheckpoint, revertCheckpointToVacant, removeCheckpointAssignee } from "@/app/actions/checkpoints";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";

interface MemberProfile {
  user_id: string;
  role: string;
  status: string;
  member_color?: string;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CheckpointListProps {
  checkpoints: Checkpoint[];
  projectId: string;
  userRole: string | null;
  currentUserId: string; // Added currentUserId
  members: MemberProfile[];
  onRefresh?: () => void;
}

interface SortableCheckpointItemProps {
  checkpoint: Checkpoint;
  onSelect: (checkpoint: Checkpoint) => void;
  userRole: string | null;
  currentUserId: string;
  members: MemberProfile[];
  onRefresh?: () => void;
}

function SortableCheckpointItem({
  checkpoint,
  onSelect,
  userRole,
  currentUserId,
  members,
  onRefresh,
}: SortableCheckpointItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } =
    useSortable({
      id: checkpoint.id,
      data: {
        type: 'checkpoint',
        checkpointId: checkpoint.id
      }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Find completer color if completed
  let cardStyle = {};

  if (checkpoint.is_completed && checkpoint.completed_by) {
    const completer = members.find(
      (m) => m.user_id === checkpoint.completed_by,
    );
    if (completer && completer.member_color) {
      const color =
        completer.role === "admin" ? "#a855f7" : completer.member_color;
      cardStyle = {
        borderColor: color,
        backgroundColor: `${color}10`, // 10% opacity hex
      };
    }
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const assignments = checkpoint.assignments || [];
  const isVacant = checkpoint.is_vacant;
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const isAssignedToMe = assignments.some(a => a.user_id === currentUserId);

  // Allow admins and owners to remove assignees or revert vacant status
  const canManageAssignees = userRole === 'admin' || userRole === 'owner' || userRole === 'manager';

  const handleClaim = async () => {
    try {
      const result = await claimCheckpoint(checkpoint.id)

      if (!result.success) {
        toast.error('Error al reclamar checkpoint', {
          description: result.error,
        })
        return
      }

      toast.success('¡Checkpoint reclamado!')
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Error inesperado')
    }
  }

  const handleRevert = async () => {
    try {
      const result = await revertCheckpointToVacant(checkpoint.id)

      if (!result.success) {
        toast.error('Error al revertir checkpoint', {
          description: result.error,
        })
        return
      }

      toast.success('Checkpoint revertido a vacante')
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Error inesperado')
    }
  }

  const handleRemoveAssignee = async (userId: string) => {
    try {
      const result = await removeCheckpointAssignee(checkpoint.id, userId)

      if (!result.success) {
        toast.error('Error al remover asignado', {
          description: result.error,
        })
        return
      }

      toast.success('Asignado removido')
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Error inesperado')
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card
        className={`${checkpoint.is_completed ? "border-2" : ""} transition-all duration-200 ${isOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}`}
        style={cardStyle}
      >
        <CardHeader className="flex flex-row items-start space-x-4 p-4 pb-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary touch-none mt-1"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 space-y-1">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {checkpoint.title}
                  </CardTitle>
                  {isVacant && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                      VACANT
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                {checkpoint.description && isExpanded && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{checkpoint.description}</p>
                )}
              </div>

              {checkpoint.is_completed ? (
                <CheckCircle2
                  className={`h-5 w-5 ${!checkpoint.completed_by ? "text-green-500" : ""}`}
                  style={{
                    color: cardStyle["borderColor" as keyof typeof cardStyle],
                  }}
                />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </div>

            {/* Task Actions / Image / Claim */}
            {(isVacant || checkpoint.image_url) && isExpanded && (
              <div className="flex items-center gap-2 mt-2">
                {checkpoint.image_url && (
                  <Dialog open={showImage} onOpenChange={setShowImage}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                        <ImageIcon className="h-3 w-3" /> View Image
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl rounded-lg overflow-hidden p-0">
                      <img src={checkpoint.image_url} alt="Task attachment" className="w-full h-auto" />
                    </DialogContent>
                  </Dialog>
                )}

                {isVacant && (
                  <Button onClick={handleClaim} size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700">
                    Claim Task
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 pl-14">
          {/* Sub-tasks area - Visible when expanded */}
          {isExpanded && (
            <div className="mb-4 border-t pt-2 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
              <CheckpointTasksList
                checkpointId={checkpoint.id}
                canEdit={true}
              />
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {/* Avatar Stack (Bottom Left) */}
            <div className="flex items-center h-8 gap-2">
              {assignments.length > 0 && (
                <Dialog open={showAssignees} onOpenChange={setShowAssignees}>
                  <DialogTrigger asChild>
                    <div
                      className="transition-opacity cursor-pointer p-1 rounded-md hover:bg-muted/50 items-center inline-flex"
                      onClick={(e) => { e.stopPropagation(); }}
                      title="Click to manage assignees"
                    >
                      <AvatarStack
                        members={assignments.map(a => ({
                          avatar_url: a.profile?.avatar_url || null,
                          username: a.profile?.username || undefined
                        }))}
                        max={3}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Checkpoint Assignees</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {assignments.map(a => (
                        <div key={a.user_id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={a.profile?.avatar_url || ""} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{a.profile?.display_name || a.profile?.username || "Unknown"}</span>
                          </div>
                          {canManageAssignees && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => handleRemoveAssignee(a.user_id)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm">No users assigned.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Revert Button for Admins if task was claimed (formerly vacant) or just has assignments */}
              {isAdminOrManager && !isVacant && assignments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevert}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-orange-600"
                  title="Revert to Vacant (Clear Assignees)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={checkpoint.is_completed ? "outline" : "default"}
                  size="sm"
                  onClick={() => onSelect(checkpoint)}
                  style={
                    checkpoint.is_completed
                      ? {
                        borderColor:
                          cardStyle["borderColor" as keyof typeof cardStyle],
                        color:
                          cardStyle["borderColor" as keyof typeof cardStyle],
                      }
                      : {}
                  }
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {checkpoint.is_completed ? "View Evidence" : "Add Evidence"}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {checkpoint.is_completed
                      ? `Evidence: ${checkpoint.title}`
                      : `Submit Evidence: ${checkpoint.title}`}
                  </DialogTitle>
                </DialogHeader>
                {checkpoint.is_completed ? (
                  <EvidenceViewer
                    checkpointId={checkpoint.id}
                    userRole={userRole}
                    onSuccess={() => {
                      if (onRefresh) onRefresh()
                    }}
                  />
                ) : (
                  <EvidenceForm
                    checkpointId={checkpoint.id}
                    onSuccess={() => {
                      if (onRefresh) onRefresh();
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckpointList({
  checkpoints,
  userRole,
  currentUserId,
  members,
  onRefresh
}: CheckpointListProps) {

  if (checkpoints.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No checkpoints defined for this project.
      </div>
    );
  }

  return (
    <SortableContext
      items={checkpoints.map((c) => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-4">
        {checkpoints.map((checkpoint) => (
          <SortableCheckpointItem
            key={checkpoint.id}
            checkpoint={checkpoint}
            userRole={userRole}
            currentUserId={currentUserId}
            members={members}
            onSelect={() => { }}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </SortableContext>
  );
}
