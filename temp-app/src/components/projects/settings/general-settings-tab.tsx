"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { ENGINEERING_CATEGORIES } from "@/lib/project-constants"
import { useState } from "react"

interface GeneralSettingsTabProps {
    initialTitle: string
    initialDescription: string
    initialCategory: string
    initialIcon: string
    isLoading: boolean
    onSave: (title: string, description: string, category: string, icon: string) => Promise<any>
}

export function GeneralSettingsTab({
    initialTitle,
    initialDescription,
    initialCategory,
    initialIcon,
    isLoading,
    onSave
}: GeneralSettingsTabProps) {
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [category, setCategory] = useState(initialCategory)
    const [projectIcon, setProjectIcon] = useState(initialIcon)

    const handleSave = () => {
        onSave(title, description, category, projectIcon)
    }

    return (
        <div className="flex-1 overflow-auto space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project title"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {ENGINEERING_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    <span className="flex items-center gap-2">
                                        <span>{cat.emoji}</span>
                                        <span>{cat.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input
                        id="icon"
                        value={projectIcon}
                        onChange={(e) => setProjectIcon(e.target.value)}
                        placeholder="📁"
                        className="text-center text-xl"
                    />
                </div>
            </div>

            <Button onClick={handleSave} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        </div>
    )
}
