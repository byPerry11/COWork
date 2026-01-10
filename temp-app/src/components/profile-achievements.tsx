"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Rocket, Users, Trophy, Target, CheckCircle, UsersRound, Award, Crown } from "lucide-react"

// Map specific icons
const IconMap: Record<string, any> = {
    Rocket, Users, Trophy, Target, CheckCircle, UsersRound, Award, Crown
}

interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export function ProfileAchievements({ userId }: { userId: string }) {
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAchievements = async () => {
            const { data } = await supabase
                .from('user_achievements')
                .select(`
                    achievement:achievements (
                        id,
                        name,
                        description,
                        icon,
                        tier
                    )
                `)
                .eq('user_id', userId)

            if (data) {
                // @ts-ignore
                setAchievements(data.map(d => d.achievement).filter(Boolean))
            }
            setLoading(false)
        }
        fetchAchievements()
    }, [userId])

    if (loading) return <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>

    if (achievements.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No achievements unlocked yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map(ach => {
                    const IconComp = IconMap[ach.icon] || Trophy
                    return (
                        <div key={ach.id} className="flex flex-col items-center text-center p-3 rounded-lg bg-secondary/20 border">
                            <div className={`p-2 rounded-full mb-2 ${ach.tier === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                                ach.tier === 'silver' ? 'bg-gray-100 text-gray-600' :
                                    ach.tier === 'platinum' ? 'bg-cyan-100 text-cyan-600' :
                                        'bg-orange-100 text-orange-600'
                                }`}>
                                <IconComp className="h-6 w-6" />
                            </div>
                            <h4 className="font-semibold text-sm">{ach.name}</h4>
                            <p className="text-xs text-muted-foreground">{ach.description}</p>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
