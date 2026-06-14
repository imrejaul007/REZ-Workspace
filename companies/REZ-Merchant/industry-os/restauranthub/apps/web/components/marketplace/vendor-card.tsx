'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, MapPin, Phone, Globe, TruckIcon, DollarSign, Package } from 'lucide-react';
import { Vendor } from '@/types/marketplace';

interface VendorCardProps {
  vendor: Vendor;
  onViewDetails: (vendor: Vendor) => void;
  onContact: (vendor: Vendor) => void;
}

export function VendorCard({ vendor, onViewDetails, onContact }: VendorCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(vendor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {vendor.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vendor.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm font-medium">{vendor.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({vendor.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            {vendor.category.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {vendor.description}
        </p>

        {vendor.services.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {vendor.services.slice(0, 3).map((service) => (
                <Badge key={service} variant="outline" className="text-xs">
                  {service.replace('_', ' ')}
                </Badge>
              ))}
              {vendor.services.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{vendor.services.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.deliveryTime}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{vendor.location}</span>
          </div>
          {vendor.minOrderValue && (
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Min order: ${vendor.minOrderValue}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {vendor.bulkDiscount && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Package className="h-3 w-3 mr-1" />
              {vendor.bulkDiscount}% Bulk Discount
            </Badge>
          )}
          {vendor.subscriptionPlans && vendor.subscriptionPlans.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Subscription Available
            </Badge>
          )}
          {vendor.certifications.length > 0 && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Certified
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="default"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(vendor);
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
              onContact(vendor);
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