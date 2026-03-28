import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, UtensilsCrossed, List, Megaphone, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/restaurants/my')
      return data.data.restaurant
    },
    retry: false
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No restaurant yet</h2>
        <p className="text-muted-foreground">Set up your restaurant to get started</p>
        <Button asChild>
          <Link to="/restaurant">Set Up Restaurant</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground">Restaurant Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {restaurant.isApproved ? (
            <Badge variant="success">Approved</Badge>
          ) : (
            <Badge variant="warning">Pending Approval</Badge>
          )}
          {restaurant.isOpen ? (
            <Badge variant="success">Open</Badge>
          ) : (
            <Badge variant="secondary">Closed</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </div>
            <p className="text-xs text-muted-foreground">
              {restaurant.isApproved ? 'Approved by admin' : 'Waiting for admin approval'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <span className="text-lg">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurant.avgRating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {restaurant.totalReviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivery</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{restaurant.deliveryFee || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {restaurant.estimatedDeliveryTime || '30-45'} min delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Min Order</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{restaurant.minimumOrder || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum order amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link to="/restaurant">
                <Store className="h-4 w-4" /> Edit Restaurant
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link to="/menu/categories">
                <List className="h-4 w-4" /> Manage Categories
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link to="/menu/items">
                <UtensilsCrossed className="h-4 w-4" /> Manage Menu
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link to="/promotions">
                <Megaphone className="h-4 w-4" /> Promotions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
