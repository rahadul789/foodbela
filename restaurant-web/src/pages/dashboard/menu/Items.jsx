import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
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
import { Loader2, Plus, Pencil, Trash2, UtensilsCrossed, Percent, X } from 'lucide-react'
import ImageUpload from '@/components/ui/image-upload'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: '',
  preparationTime: '',
  isVeg: false,
  customizations: []
}

const emptyCustomization = {
  name: '',
  type: 'single',
  required: false,
  minSelect: 0,
  maxSelect: 1,
  options: [{ name: '', price: 0 }]
}

export default function Items() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [discountDialog, setDiscountDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [discountForm, setDiscountForm] = useState({ type: 'percentage', value: '', validUntil: '' })
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

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/menu/categories/${restaurantId}`)
      return data.data.categories
    },
    enabled: !!restaurantId
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/menu/items/${restaurantId}`)
      return data.data.items
    },
    enabled: !!restaurantId
  })

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingItem) {
        return api.put(`/menu/items/${editingItem._id}`, payload)
      }
      return api.post('/menu/items', { ...payload, restaurantId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success(editingItem ? 'Item updated' : 'Item created')
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/menu/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item deleted')
    }
  })

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }) => api.put(`/menu/items/${id}/availability`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    }
  })

  const setDiscountMutation = useMutation({
    mutationFn: async ({ id, discount }) => {
      return api.put(`/menu/items/${id}/discount`, discount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Discount updated')
      setDiscountDialog(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const openCreate = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId?._id || item.categoryId || '',
      image: item.image || '',
      preparationTime: item.preparationTime || '',
      isVeg: item.isVeg || false,
      customizations: item.customizations?.length
        ? item.customizations.map((c) => ({
            name: c.name || '',
            type: c.type || 'single',
            required: c.required || false,
            minSelect: c.minSelect || 0,
            maxSelect: c.maxSelect || 1,
            options: c.options?.length ? c.options.map((o) => ({ name: o.name, price: o.price || 0 })) : [{ name: '', price: 0 }]
          }))
        : []
    })
    setDialogOpen(true)
  }

  const openDiscount = (item) => {
    setSelectedItem(item)
    setDiscountForm({
      type: item.discount?.type || 'percentage',
      value: item.discount?.value || '',
      validUntil: item.discount?.validUntil ? item.discount.validUntil.slice(0, 10) : ''
    })
    setDiscountDialog(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
  }

  const addCustomization = () => {
    setForm((prev) => ({
      ...prev,
      customizations: [...prev.customizations, { ...emptyCustomization, options: [{ name: '', price: 0 }] }]
    }))
  }

  const removeCustomization = (index) => {
    setForm((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }))
  }

  const updateCustomization = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      customizations: prev.customizations.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }))
  }

  const addOption = (custIndex) => {
    setForm((prev) => ({
      ...prev,
      customizations: prev.customizations.map((c, i) =>
        i === custIndex ? { ...c, options: [...c.options, { name: '', price: 0 }] } : c
      )
    }))
  }

  const removeOption = (custIndex, optIndex) => {
    setForm((prev) => ({
      ...prev,
      customizations: prev.customizations.map((c, i) =>
        i === custIndex ? { ...c, options: c.options.filter((_, j) => j !== optIndex) } : c
      )
    }))
  }

  const updateOption = (custIndex, optIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      customizations: prev.customizations.map((c, i) =>
        i === custIndex
          ? { ...c, options: c.options.map((o, j) => j === optIndex ? { ...o, [field]: value } : o) }
          : c
      )
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      categoryId: form.categoryId,
      image: form.image,
      isVeg: form.isVeg
    }
    if (form.preparationTime) payload.preparationTime = Number(form.preparationTime)

    // Clean up customizations — remove empty ones
    const cleanCustomizations = form.customizations
      .filter((c) => c.name.trim())
      .map((c) => ({
        ...c,
        maxSelect: c.type === 'single' ? 1 : (c.maxSelect || c.options.length),
        options: c.options.filter((o) => o.name.trim()).map((o) => ({ name: o.name, price: Number(o.price) || 0 }))
      }))
      .filter((c) => c.options.length > 0)

    if (cleanCustomizations.length > 0) {
      payload.customizations = cleanCustomizations
    } else {
      payload.customizations = []
    }

    saveMutation.mutate(payload)
  }

  const getDiscountedPrice = (item) => {
    if (!item.discount?.type || !item.discount?.value) return null
    if (item.discount.type === 'percentage') {
      return Math.round(item.price * (1 - item.discount.value / 100))
    }
    return Math.max(0, item.price - item.discount.value)
  }

  const getCategoryName = (item) => {
    const cat = item.categoryId
    if (typeof cat === 'object') return cat?.name
    return categories.find((c) => c._id === cat)?.name || 'Uncategorized'
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
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} in your menu
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={!restaurantId}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No menu items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first item to start building your menu
            </p>
            <Button onClick={openCreate} disabled={!restaurantId}>Add Item</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const discountedPrice = getDiscountedPrice(item)
            const hasDiscount = discountedPrice !== null

            return (
              <Card key={item._id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {hasDiscount && (
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      {item.discount.type === 'percentage' ? `-${item.discount.value}%` : `-৳${item.discount.value}`}
                    </Badge>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary">Unavailable</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{getCategoryName(item)}</p>
                    </div>
                    <div className="text-right">
                      {hasDiscount ? (
                        <>
                          <p className="text-sm font-bold text-primary">৳{discountedPrice}</p>
                          <p className="text-xs text-muted-foreground line-through">৳{item.price}</p>
                        </>
                      ) : (
                        <p className="text-sm font-bold">৳{item.price}</p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.isVeg && <Badge variant="success" className="text-[10px]">Veg</Badge>}
                    {item.preparationTime && (
                      <Badge variant="outline" className="text-[10px]">{item.preparationTime} min</Badge>
                    )}
                    {item.customizations?.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.customizations.length} variant{item.customizations.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Available</span>
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleAvailability.mutate({ id: item._id, isAvailable: !item.isAvailable })}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDiscount(item)}>
                        <Percent className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm('Delete this item?')) deleteMutation.mutate(item._id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                value={form.image}
                onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                label="Upload item photo"
                aspectRatio="video"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (৳)</Label>
                <Input
                  id="item-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(val) => setForm({ ...form, categoryId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-prep">Prep Time (minutes)</Label>
                <Input
                  id="item-prep"
                  type="number"
                  value={form.preparationTime}
                  onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                  placeholder="15"
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isVeg}
                    onCheckedChange={(v) => setForm({ ...form, isVeg: v })}
                  />
                  <Label>Vegetarian</Label>
                </div>
              </div>
            </div>

            {/* Customizations / Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants / Customizations</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addCustomization}>
                  <Plus className="h-3.5 w-3.5" /> Add Group
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add size options, toppings, extras, etc.
              </p>

              {form.customizations.map((cust, ci) => (
                <div key={ci} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={cust.name}
                      onChange={(e) => updateCustomization(ci, 'name', e.target.value)}
                      placeholder="Group name (e.g. Size, Toppings)"
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCustomization(ci)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Select value={cust.type} onValueChange={(v) => updateCustomization(ci, 'type', v)}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Pick One</SelectItem>
                          <SelectItem value="multiple">Pick Many</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cust.required}
                        onCheckedChange={(v) => updateCustomization(ci, 'required', v)}
                      />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Options</span>
                    {cust.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          value={opt.name}
                          onChange={(e) => updateOption(ci, oi, 'name', e.target.value)}
                          placeholder="Option name (e.g. Large)"
                          className="flex-1 h-8 text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">+৳</span>
                          <Input
                            type="number"
                            value={opt.price}
                            onChange={(e) => updateOption(ci, oi, 'price', e.target.value)}
                            placeholder="0"
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        {cust.options.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(ci, oi)}>
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => addOption(ci)}>
                      <Plus className="h-3 w-3" /> Add Option
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialog} onOpenChange={setDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Discount — {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={discountForm.type}
                  onValueChange={(v) => setDiscountForm({ ...discountForm, type: v })}
                >
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
                <Label>{discountForm.type === 'percentage' ? 'Value (%)' : 'Value (৳)'}</Label>
                <Input
                  type="number"
                  min="0"
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valid Until (optional)</Label>
              <Input
                type="date"
                value={discountForm.validUntil}
                onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
              />
            </div>
            {selectedItem && discountForm.value > 0 && (
              <p className="text-sm text-muted-foreground">
                New price: ৳{discountForm.type === 'percentage'
                  ? Math.round(selectedItem.price * (1 - discountForm.value / 100))
                  : Math.max(0, selectedItem.price - Number(discountForm.value))}
                {' '}<span className="line-through">৳{selectedItem.price}</span>
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDiscountMutation.mutate({ id: selectedItem._id, discount: {} })
                }}
              >
                Remove Discount
              </Button>
              <Button
                onClick={() =>
                  setDiscountMutation.mutate({
                    id: selectedItem._id,
                    discount: {
                      type: discountForm.type,
                      value: Number(discountForm.value),
                      validUntil: discountForm.validUntil || undefined
                    }
                  })
                }
                disabled={setDiscountMutation.isPending}
              >
                {setDiscountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Discount
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
