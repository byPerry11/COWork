import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-[250px]" />
                            <Skeleton className="h-4 w-[350px]" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-[200px]" />
                            <Skeleton className="h-10 w-[40px]" />
                        </div>
                    </div>

                    {/* Content Section 1 */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-[150px]" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>

                    {/* Content Section 2 */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-[150px]" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
