'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import { SubscriptionPlan } from '@/types/marketplace';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  vendorName: string;
  onSubscribe: (planId: string) => void;
  isPopular?: boolean;
}

export function SubscriptionCard({ plan, vendorName, onSubscribe, isPopular = false }: SubscriptionCardProps) {
  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return 'per week';
      case 'monthly':
        return 'per month';
      case 'quarterly':
        return 'per quarter';
      case 'yearly':
        return 'per year';
      default:
        return `per ${cycle}`;
    }
  };

  const getBillingCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'monthly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quarterly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'yearly':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`relative hover:shadow-lg transition-shadow ${isPopular ? 'border-primary border-2' : ''}`}>
      {isPopular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{vendorName}</p>
          </div>
          <Badge className={getBillingCycleColor(plan.billingCycle)}>
            {plan.billingCycle}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-3xl font-bold text-foreground">
              ${plan.price}
            </span>
            <span className="text-sm text-muted-foreground">
              {getBillingCycleLabel(plan.billingCycle)}
            </span>
          </div>
          {plan.minimumCommitment && (
            <p className="text-xs text-muted-foreground mt-1">
              Minimum {plan.minimumCommitment} {plan.billingCycle} commitment
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {plan.description}
        </p>

        {plan.deliveryFrequency && (
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Delivered {plan.deliveryFrequency.toLowerCase()}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">What's included:</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <Button 
            className="w-full" 
            variant={isPopular ? "default" : "outline"}
            onClick={() => onSubscribe(plan.id)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Subscribe Now
          </Button>
        </div>

        {isPopular && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Save up to 20% compared to one-time orders
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}