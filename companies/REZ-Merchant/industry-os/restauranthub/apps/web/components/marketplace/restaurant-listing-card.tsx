'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Users, Calendar, Phone, Mail, Building2 } from 'lucide-react';
import { RestaurantListing } from '@/types/marketplace';

interface RestaurantListingCardProps {
  listing: RestaurantListing;
  onViewDetails: (listing: RestaurantListing) => void;
  onContact: (listing: RestaurantListing) => void;
}

export function RestaurantListingCard({ listing, onViewDetails, onContact }: RestaurantListingCardProps) {
  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lease':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price: number, type: string) => {
    if (type === 'sale') {
      return `$${price.toLocaleString()}`;
    } else {
      return `$${price.toLocaleString()}/month`;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(listing)}>
      <CardHeader className="pb-3">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-3">
          <div className="flex items-center justify-center h-40 text-gray-400">
            <Building2 className="h-16 w-16" />
          </div>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getListingTypeColor(listing.type)}>
                For {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
              </Badge>
              {listing.details.kitchenEquipped && (
                <Badge variant="secondary">Kitchen Equipped</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {listing.description}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold text-primary">
                {formatPrice(listing.price, listing.type)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{listing.details.size}</span>
            </div>
            {listing.details.seatingCapacity && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{listing.details.seatingCapacity} seats</span>
              </div>
            )}
          </div>

          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
            <span className="text-sm text-muted-foreground">
              {listing.location.address}, {listing.location.city}, {listing.location.state}
            </span>
          </div>

          {listing.details.yearEstablished && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Established {listing.details.yearEstablished}
              </span>
            </div>
          )}

          {listing.details.revenue && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Revenue: {listing.details.revenue}
              </span>
            </div>
          )}
        </div>

        {listing.amenities && listing.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Amenities:</p>
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 4).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {listing.availability && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Availability</p>
            <p className="text-sm text-blue-700">{listing.availability}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="default"
            size="default"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(listing);
            }}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="default"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onContact(listing);
            }}
          >
            <Phone className="h-4 w-4 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}