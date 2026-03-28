import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2, Megaphone } from 'lucide-react'

const emptyForm = {
  title: '',
  discountType: 'percentage',
  discountValue: '',
  thresholdAmount: '',
  maxDiscount: '',
  expiresAt: ''
}

export default function Promotions() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/restaurants/my')
      return data.data.restaurant
    },
    retry: false
  })

  const restaurantId = restaurant?._id

  const { data: promotion, isLoading } = useQuery({
    queryKey: ['my-promotion', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/promotions/${restaurantId}`)
      return data.data.promotion
    },
    enabled: !!restaurantId,
    retry: false
  })

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingPromo) {
        return api.put(`/promotions/${editingPromo._id}`, payload)
      }
      return api.post('/promotions', { ...payload, restaurantId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promotion'] })
      toast.success(editingPromo ? 'Promotion updated' : 'Promotion created')
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promotion'] })
      toast.success('Promotion deleted')
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => api.put(`/promotions/${id}/toggle`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promotion'] })
      toast.success('Promotion toggled')
    }
  })

  const openCreate = () => {
    setEditingPromo(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = () => {
    if (!promotion) return
    setEditingPromo(promotion)
    setForm({
      title: promotion.title || '',
      discountType: promotion.discountType || 'percentage',
      discountValue: promotion.discountValue || '',
      thresholdAmount: promotion.thresholdAmount || '',
      maxDiscount: promotion.maxDiscount || '',
      expiresAt: promotion.expiresAt ? promotion.expiresAt.slice(0, 10) : ''
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingPromo(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      thresholdAmount: Number(form.thresholdAmount)
    }
    if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount)
    if (form.expiresAt) payload.expiresAt = form.expiresAt
    saveMutation.mutate(payload)
  }

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">
            Manage your restaurant promotion
          </p>
        </div>
        {!promotion && (
          <Button onClick={openCreate} className="gap-2" disabled={!restaurantId}>
            <Plus className="h-4 w-4" /> Create Promotion
          </Button>
        )}
      </div>

      {!promotion ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active promotion</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a promotion to attract more customers
            </p>
            <Button onClick={openCreate} disabled={!restaurantId}>Create Promotion</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {promotion.title}
              </CardTitle>
              <Badge variant={promotion.isActive ? 'success' : 'secondary'}>
                {promotion.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="text-lg font-bold">
                  {promotion.discountType === 'percentage'
                    ? `${promotion.discountValue}%`
                    : `৳${promotion.discountValue}`}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Min. Order</p>
                <p className="text-lg font-bold">৳{promotion.thresholdAmount}</p>
              </div>
              {promotion.maxDiscount > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Max Discount</p>
                  <p className="text-lg font-bold">৳{promotion.maxDiscount}</p>
                </div>
              )}
              {promotion.expiresAt && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-sm font-medium">
                    {new Date(promotion.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active</span>
                <Switch
                  checked={promotion.isActive}
                  onCheckedChange={() => toggleMutation.mutate({ id: promotion._id, isActive: !promotion.isActive })}
                />
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive gap-1"
                  onClick={() => {
                    if (confirm('Delete this promotion?')) {
                      deleteMutation.mutate(promotion._id)
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promotion' : 'New Promotion'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-title">Title</Label>
              <Input
                id="promo-title"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g. Grand Opening 20% Off"
                required
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => updateForm('discountType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-value">
                  {form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (৳)'}
                </Label>
                <Input
                  id="promo-value"
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => updateForm('discountValue', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-threshold">Min. Order Amount (৳)</Label>
                <Input
                  id="promo-threshold"
                  type="number"
                  value={form.thresholdAmount}
                  onChange={(e) => updateForm('thresholdAmount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-max">Max Discount (৳, optional)</Label>
                <Input
                  id="promo-max"
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => updateForm('maxDiscount', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-expires">Expires At (optional)</Label>
              <Input
                id="promo-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => updateForm('expiresAt', e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPromo ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
