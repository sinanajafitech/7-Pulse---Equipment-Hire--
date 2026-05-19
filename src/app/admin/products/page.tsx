import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit, Eye, EyeOff, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const metadata = { title: "Products" }

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">{products.length} total items in catalogue</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Daily Rate</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-48">{product.shortDesc}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{product.category.name}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(Number(product.dailyRate))}/day</td>
                <td className="px-4 py-3 text-muted-foreground">{product.stockQty}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {product.isAvailable ? (
                      <><Eye className="h-3 w-3 text-green-500" /><span className="text-green-500 text-xs">Active</span></>
                    ) : (
                      <><EyeOff className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground text-xs">Hidden</span></>
                    )}
                    {product.isFeatured && <Badge className="ml-1 text-xs bg-primary/20 text-primary border-primary/30">Featured</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/products/${product.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No products yet. Add your first product.</p>
          </div>
        )}
      </div>
    </div>
  )
}
