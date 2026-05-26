import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { AdminTopbar } from "@/components/layout/AdminTopbar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <AdminTopbar userName={session.user.name} />
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  )
}
