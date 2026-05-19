import { BlogForm } from "@/components/admin/BlogForm"
export const metadata = { title: "New Post" }
export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">New Post</h1><p className="text-muted-foreground">Write and publish a blog article</p></div>
      <BlogForm />
    </div>
  )
}
