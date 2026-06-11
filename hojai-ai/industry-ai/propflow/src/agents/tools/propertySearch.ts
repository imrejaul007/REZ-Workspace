/**
 * PROPFLOW - Property Search Tool
 * Tool for searching and filtering properties based on criteria
 */

import { BaseTool } from '@hojai/agent-runtime';
import { AgentContext, ToolResult } from '@hojai/agent-runtime';
import { Property, Lead } from '../../models';

export class PropertySearchTool extends BaseTool {
  name = 'propertySearch';
  description = 'Search for properties based on budget, location, type, and other criteria';

  parameters = [
    {
      name: 'budgetMin',
      type: 'number',
      description: 'Minimum budget in INR',
      required: false
    },
    {
      name: 'budgetMax',
      type: 'number',
      description: 'Maximum budget in INR',
      required: false
    },
    {
      name: 'propertyType',
      type: 'string',
      description: 'Type of property (apartment, villa, plot, etc.)',
      required: false,
      enum: ['apartment', 'villa', 'plot', 'penthouse', 'studio', 'row_house', 'independent_house']
    },
    {
      name: 'location',
      type: 'string',
      description: 'Location or locality preference',
      required: false
    },
    {
      name: 'bedrooms',
      type: 'number',
      description: 'Number of bedrooms required',
      required: false
    },
    {
      name: 'bathrooms',
      type: 'number',
      description: 'Number of bathrooms required',
      required: false
    },
    {
      name: 'minArea',
      type: 'number',
      description: 'Minimum area in sqft',
      required: false
    },
    {
      name: 'maxArea',
      type: 'number',
      description: 'Maximum area in sqft',
      required: false
    },
    {
      name: 'amenities',
      type: 'array',
      description: 'Required amenities (e.g., parking, pool, gym)',
      required: false
    },
    {
      name: 'status',
      type: 'string',
      description: 'Property status filter',
      required: false,
      enum: ['available', 'sold', 'reserved', 'under-construction']
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of results to return',
      required: false,
      default: 20
    }
  ];

  async execute(params: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const {
        budgetMin,
        budgetMax,
        propertyType,
        location,
        bedrooms,
        bathrooms,
        minArea,
        maxArea,
        amenities,
        status = 'available',
        limit = 20
      } = params;

      // Build MongoDB query
      const query: any = {
        status,
        isActive: true
      };

      // Budget filter
      if (budgetMin !== undefined || budgetMax !== undefined) {
        query.price = {};
        if (budgetMin !== undefined) query.price.$gte = budgetMin;
        if (budgetMax !== undefined) query.price.$lte = budgetMax;
      }

      // Property type filter
      if (propertyType) {
        query.type = propertyType;
      }

      // Location filter
      if (location) {
        query.$or = [
          { 'location.locality': { $regex: location, $options: 'i' } },
          { 'location.city': { $regex: location, $options: 'i' } },
          { 'location.area': { $regex: location, $options: 'i' } }
        ];
      }

      // Bedrooms filter
      if (bedrooms !== undefined) {
        query['specifications.bedrooms'] = bedrooms;
      }

      // Bathrooms filter
      if (bathrooms !== undefined) {
        query['specifications.bathrooms'] = { $gte: bathrooms };
      }

      // Area filter
      if (minArea !== undefined || maxArea !== undefined) {
        query['specifications.area'] = {};
        if (minArea !== undefined) query['specifications.area'].$gte = minArea;
        if (maxArea !== undefined) query['specifications.area'].$lte = maxArea;
      }

      // Amenities filter
      if (amenities && amenities.length > 0) {
        query.amenities = { $all: amenities };
      }

      // Execute search
      const properties = await Property.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Transform results
      const results = properties.map(p => ({
        id: p._id.toString(),
        title: p.title,
        type: p.type,
        price: p.price,
        priceFormatted: this.formatPrice(p.price),
        location: {
          locality: p.location?.locality,
          city: p.location?.city,
          address: p.location?.address
        },
        specifications: {
          bedrooms: p.specifications?.bedrooms,
          bathrooms: p.specifications?.bathrooms,
          area: p.specifications?.area,
          areaFormatted: `${p.specifications?.area?.toLocaleString() || 0} sqft`
        },
        pricePerSqft: Math.round(p.price / (p.specifications?.area || 1)),
        amenities: p.amenities?.slice(0, 5),
        totalAmenities: p.amenities?.length || 0,
        daysOnMarket: Math.floor(
          (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
        images: p.images?.slice(0, 3),
        agent: p.agentId,
        status: p.status
      }));

      // Calculate summary statistics
      const prices = properties.map(p => p.price);
      const summary = {
        totalFound: await Property.countDocuments(query),
        returned: results.length,
        priceRange: {
          min: Math.min(...prices) || 0,
          max: Math.max(...prices) || 0,
          avg: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
        },
        avgPricePerSqft: properties.length > 0
          ? Math.round(
              properties.reduce((sum, p) => sum + (p.price / (p.specifications?.area || 1)), 0) / properties.length
            )
          : 0
      };

      // If we have a user context, get personalized recommendations
      let recommendations: string[] = [];
      if (context?.userId) {
        const lead = await Lead.findOne({ userId: context.userId });
        if (lead) {
          recommendations = this.getRecommendations(properties, lead);
        }
      }

      return {
        result: {
          properties: results,
          summary,
          recommendations,
          filters: {
            budgetMin,
            budgetMax,
            propertyType,
            location,
            bedrooms,
            bathrooms,
            minArea,
            maxArea,
            amenities
          }
        }
      };
    } catch (error) {
      return {
        result: null,
        error: `Property search failed: ${error}`
      };
    }
  }

  private formatPrice(price: number): string {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} L`;
    }
    return price.toLocaleString('en-IN');
  }

  private getRecommendations(properties: any[], lead: any): string[] {
    const recommendations: string[] = [];

    if (properties.length === 0) {
      recommendations.push('No exact matches found - consider expanding your search criteria');
      recommendations.push('You may want to check nearby localities');
    } else if (properties.length < 3) {
      recommendations.push('Limited inventory in this range - act quickly on good options');
    }

    // Budget analysis
    const avgPrice = properties.reduce((sum, p) => sum + p.price, 0) / properties.length;
    const leadAvgBudget = (lead.budget?.min + lead.budget?.max) / 2;

    if (avgPrice > leadAvgBudget) {
      recommendations.push('Consider increasing budget for better options');
    } else if (avgPrice < leadAvgBudget * 0.8) {
      recommendations.push('Good options available within budget - compare value');
    }

    // Property type suggestion
    if (properties.length > 0) {
      const typeCounts: Record<string, number> = {};
      properties.forEach(p => {
        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      });
      const popularType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      if (popularType && properties.length >= 5) {
        recommendations.push(`${popularType[0]} is the most common type in this search`);
      }
    }

    return recommendations;
  }
}

export default new PropertySearchTool();