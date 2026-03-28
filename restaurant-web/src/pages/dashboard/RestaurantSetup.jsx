import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin } from 'lucide-react'
import ImageUpload from '@/components/ui/image-upload'

export default function RestaurantSetup() {
  const queryClient = useQueryClient()

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/restaurants/my')
      return data.data.restaurant
    },
    retry: false
  })

  const isEdit = !!restaurant

  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    cuisineType: '',
    openingTime: '09:00',
    closingTime: '23:00',
    minimumOrder: 100,
    deliveryFee: 30,
    estimatedDeliveryTime: '30-45',
    logo: '',
    coverImage: ''
  })

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        latitude: restaurant.location?.coordinates?.[1]?.toString() || '',
        longitude: restaurant.location?.coordinates?.[0]?.toString() || '',
        cuisineType: restaurant.cuisineType?.join(', ') || '',
        openingTime: restaurant.openingTime || '09:00',
        closingTime: restaurant.closingTime || '23:00',
        minimumOrder: restaurant.minimumOrder || 100,
        deliveryFee: restaurant.deliveryFee || 30,
        estimatedDeliveryTime: restaurant.estimatedDeliveryTime || '30-45',
        logo: restaurant.logo || '',
        coverImage: restaurant.coverImage || ''
      })
    }
  }, [restaurant])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        const { data } = await api.put(`/restaurants/${restaurant._id}`, payload)
        return data
      } else {
        const { data } = await api.post('/restaurants', payload)
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] })
      toast.success(isEdit ? 'Restaurant updated!' : 'Restaurant created!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
  })

  const toggleOpenMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/restaurants/${restaurant._id}/toggle-open`, { isOpen: !restaurant.isOpen })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] })
      toast.success(restaurant.isOpen ? 'Restaurant closed' : 'Restaurant opened')
    }
  })


  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description,
      phone: form.phone,
      address: form.address,
      cuisineType: form.cuisineType.split(',').map((c) => c.trim()).filter(Boolean),
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      minimumOrder: Number(form.minimumOrder),
      deliveryFee: Number(form.deliveryFee),
      estimatedDeliveryTime: form.estimatedDeliveryTime,
      logo: form.logo,
      coverImage: form.coverImage
    }

    if (form.latitude && form.longitude) {
      payload.location = {
        type: 'Point',
        coordinates: [Number(form.longitude), Number(form.latitude)]
      }
    }

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Restaurant Settings' : 'Set Up Restaurant'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update your restaurant details' : 'Fill in your restaurant information to get started'}
          </p>
        </div>
        {isEdit && (
          <div className="flex items-center gap-3">
            {restaurant.isApproved ? (
              <Badge variant="success">Approved</Badge>
            ) : (
              <Badge variant="warning">Pending Approval</Badge>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </span>
              <Switch
                checked={restaurant.isOpen}
                onCheckedChange={() => toggleOpenMutation.mutate()}
                disabled={!restaurant.isApproved}
              />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Upload your restaurant logo and cover image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo</Label>
                <ImageUpload
                  value={form.logo}
                  onChange={(url) => setForm((prev) => ({ ...prev, logo: url }))}
                  label="Upload logo"
                  aspectRatio="square"
                />
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <ImageUpload
                  value={form.coverImage}
                  onChange={(url) => setForm((prev) => ({ ...prev, coverImage: url }))}
                  label="Upload cover image"
                  aspectRatio="wide"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Enter restaurant name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Describe your restaurant..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Types</Label>
                <Input
                  id="cuisineType"
                  value={form.cuisineType}
                  onChange={(e) => updateForm('cuisineType', e.target.value)}
                  placeholder="Bangladeshi, Chinese, Indian"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="Full restaurant address"
                rows={2}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => updateForm('latitude', e.target.value)}
                  placeholder="23.8103"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => updateForm('longitude', e.target.value)}
                  placeholder="90.4125"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => updateForm('openingTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => updateForm('closingTime', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minimumOrder">Minimum Order (৳)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  value={form.minimumOrder}
                  onChange={(e) => updateForm('minimumOrder', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee (৳)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  value={form.deliveryFee}
                  onChange={(e) => updateForm('deliveryFee', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryTime">Delivery Time</Label>
                <Input
                  id="estimatedDeliveryTime"
                  value={form.estimatedDeliveryTime}
                  onChange={(e) => updateForm('estimatedDeliveryTime', e.target.value)}
                  placeholder="30-45"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Restaurant' : 'Create Restaurant'}
        </Button>
      </form>
    </div>
  )
}
