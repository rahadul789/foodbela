import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'

export default function Categories() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 })

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/restaurants/my')
      return data.data.restaurant
    },
    retry: false
  })

  const restaurantId = restaurant?._id

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/menu/categories/${restaurantId}`)
      return data.data.categories
    },
    enabled: !!restaurantId
  })

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCategory) {
        return api.put(`/menu/categories/${editingCategory._id}`, payload)
      }
      return api.post('/menu/categories', { ...payload, restaurantId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      toast.success(editingCategory ? 'Category updated' : 'Category created')
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/menu/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      toast.success('Category deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete')
  })

  const openCreate = () => {
    setEditingCategory(null)
    setForm({ name: '', description: '', sortOrder: categories.length })
    setDialogOpen(true)
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    setForm({
      name: cat.name,
      description: cat.description || '',
      sortOrder: cat.sortOrder || 0
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Categories</h1>
          <p className="text-muted-foreground">
            Organize your menu items into categories
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={!restaurantId}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GripVertical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first category to start building your menu
            </p>
            <Button onClick={openCreate} disabled={!restaurantId}>Create Category</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    {cat.sortOrder + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    {cat.itemCount || 0} items
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this category?')) {
                        deleteMutation.mutate(cat._id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rice Items, Beverages"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (optional)</Label>
              <Input
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Sort Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
