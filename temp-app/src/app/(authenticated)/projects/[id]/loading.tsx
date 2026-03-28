import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                 {/* Breadcrumb / Back button */}
                 <Skeleton className="h-4 w-32 mb-4" />

                {/* Header Profile Area */}
                <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </div>

                {/* Project Description & Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>

                    <div className="space-y-6">
                        <Skeleton className="h-[250px] w-full rounded-xl" />
                        <Skeleton className="h-[150px] w-full rounded-xl" />
                    </div>
                </div>
            </main>
        </div>
    )
}
