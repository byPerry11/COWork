import { Skeleton } from "@/components/ui/skeleton"

export default function GroupDetailLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-8">
                {/* Header Profile Area */}
                <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row border-b pb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Interactive Board/Timeline placeholder */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar details */}
                        <Skeleton className="h-8 w-32" />
                        <div className="space-y-4">
                           <Skeleton className="h-[120px] w-full rounded-xl" />
                           <Skeleton className="h-[120px] w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
