'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  TrendingUp,
  Users,
  Building,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react';

interface HeatmapPoint {
  locality: string;
  pincode: string;
  intensity: number;
  merchantCount: number;
  avgOrderValue: number;
  demandScore: number;
  growthRate: number;
  industry: string;
}

interface BenchmarkData {
  avgOrderValue: number;
  avgOrdersPerDay: number;
  avgRetentionRate: number;
  avgRepeatRate: number;
  avgRevenueGrowth: number;
}

interface NeighborhoodAnalysis {
  locality: string;
  totalMerchants: number;
  topCategories: { category: string; percentage: number }[];
  avgOrderValue: number;
  demandScore: number;
  saturationLevel: 'low' | 'medium' | 'high' | 'saturated';
  opportunityScore: number;
  recommendations: string[];
}

export default function MarketViewPage() {
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Bangalore');
  const [industry, setIndustry] = useState('restaurant');
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [neighborhood, setNeighborhood] = useState<NeighborhoodAnalysis | null>(null);
  const [trending, setTrending] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    fetchMarketData();
  }, [city, industry]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const [heatmapRes, benchmarkRes, trendingRes] = await Promise.all([
        fetch(`/api/merchant/intelligence/market/heatmap/${city}?industry=${industry}`),
        fetch(`/api/merchant/intelligence/market/benchmark?industry=${industry}`),
        fetch(`/api/merchant/intelligence/market/trending?city=${city}&industry=${industry}`),
      ]);

      if (heatmapRes.ok) {
        const data = await heatmapRes.json();
        setHeatmapData(data.data?.points || []);
      }

      if (benchmarkRes.ok) {
        const data = await benchmarkRes.json();
        setBenchmark(data.data);
      }

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrending(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
    setLoading(false);
  };

  const getDemandColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'saturated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-gray-500">Cross-merchant insights and benchmarking</p>
        </div>
        <div className="flex gap-2">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Chennai">Chennai</option>
          </select>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="restaurant">Restaurant</option>
            <option value="hotel">Hotel</option>
            <option value="salon">Salon</option>
            <option value="fitness">Fitness</option>
            <option value="healthcare">Healthcare</option>
          </select>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                ₹{benchmark?.avgOrderValue?.toLocaleString() || '0'}
              </div>
            )}
            <p className="text-xs text-gray-500">Industry average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders/Day</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {benchmark?.avgOrdersPerDay?.toFixed(0) || '0'}
              </div>
            )}
            <p className="text-xs text-gray-500">Per merchant avg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {benchmark?.avgRetentionRate?.toFixed(0) || '0'}%
              </div>
            )}
            <p className="text-xs text-gray-500">Repeat customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                +{benchmark?.avgRevenueGrowth?.toFixed(1) || '0'}%
              </div>
            )}
            <p className="text-xs text-gray-500">30-day growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap">Demand Heatmap</TabsTrigger>
          <TabsTrigger value="trending">Trending Areas</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="neighborhood">My Neighborhood</TabsTrigger>
        </TabsList>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Demand Heatmap - {city}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : heatmapData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available for {city} yet</p>
                  <p className="text-sm">Data will appear as merchants opt into the program</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heatmapData.map((point) => (
                    <Card key={point.locality} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{point.locality}</h3>
                            <p className="text-sm text-gray-500">{point.pincode}</p>
                          </div>
                          <Badge className={getDemandColor(point.demandScore)}>
                            {point.demandScore}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Merchants</p>
                            <p className="font-semibold">{point.merchantCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Avg Order</p>
                            <p className="font-semibold">₹{point.avgOrderValue}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Orders/Day</p>
                            <p className="font-semibold">{point.ordersPerDay}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Growth</p>
                            <p className={`font-semibold ${point.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {point.growthRate >= 0 ? '+' : ''}{point.growthRate}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Fastest Growing Areas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trending data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trending.map((area, index) => (
                    <Card key={area.locality}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{area.locality}</h3>
                          <p className="text-sm text-gray-500">{area.pincode} • {area.merchantCount} merchants</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600 font-semibold">+{area.growthRate}%</p>
                          <p className="text-sm text-gray-500">growth</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Expansion Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Discover underserved markets ready for growth</p>
                <Button className="mt-4">View Opportunities</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Neighborhood Tab */}
        <TabsContent value="neighborhood">
          <Card>
            <CardHeader>
              <CardTitle>Your Neighborhood Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48" />
              ) : neighborhood ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-4 text-center">
                        <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">{neighborhood.totalMerchants}</p>
                        <p className="text-sm text-gray-600">Merchants</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold">{neighborhood.opportunityScore}</p>
                        <p className="text-sm text-gray-600">Opportunity Score</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardContent className="p-4 text-center">
                        <Badge className={getSaturationColor(neighborhood.saturationLevel)}>
                          {neighborhood.saturationLevel.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-2">Saturation</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {neighborhood.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your store location to see neighborhood analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
