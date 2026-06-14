import axios from 'axios';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { RideMemory, IRideMemory } from '../models/memory';
import { Ride } from '../models/ride';
import { RiderProfile } from '../models/rider';

// Memory generation templates
const MEMORY_TEMPLATES = {
  short: (data: any) => `
Started from ${data.startLocation}${data.companions > 1 ? ` with ${data.companions} fellow riders` : ''},
covering ${data.distance}km over ${data.durationMinutes} minutes${data.weather ? ` under ${data.weather} skies` : ''}.
${data.waypoints > 0 ? `${data.waypoints} memorable stops made this journey special.` : ''}
`,

  medium: (data: any) => `
${data.title}

What a ride! Started from ${data.startLocation}${data.companions > 1 ? ` with ${data.companions} fellow riders` : ''},
embarking on a ${data.distance}km adventure${data.weather ? ` under ${data.weather} skies` : ''}.

The journey took us through winding roads and scenic vistas, with ${data.waypoints} stops along the way.
We covered the distance in ${data.durationHours}, with an average speed of ${data.avgSpeed}km/h.

${data.maxSpeed > 80 ? `We hit a thrilling max speed of ${data.maxSpeed}km/h! ` : ''}
${data.elevation > 500 ? `The ride treated us to ${data.elevation}m of elevation gain. ` : ''}
Total cost: ₹${data.totalCost || 0}
`,

  long: (data: any) => `
${data.title}

It was ${data.weather || 'clear'} morning when we set off from ${data.startLocation}${data.companions > 1 ? `, a group of ${data.companions} enthusiastic riders` : ''} on what would become an unforgettable ${data.distance}km journey.

The route took us through ${data.terrain || 'diverse landscapes'}, with the road ${data.roadCondition || 'offering a mix of smooth stretches and exciting curves'}.
${data.elevation > 0 ? `We climbed a total of ${data.elevation}m, enjoying breathtaking views from elevated viewpoints. ` : ''}

With ${data.waypoints} planned stops and ${data.spontaneousStops || 0} spontaneous breaks, we took in ${data.stopNames || 'some incredible scenery'}.
The ride lasted ${data.durationHours}, with an average speed of ${data.avgSpeed}km/h and a max speed of ${data.maxSpeed}km/h.

${data.companions > 1 ? `The camaraderie among riders made this ride even more special. ` : ''}
${data.totalCost > 0 ? `The adventure cost ₹${data.totalCost} (fuel: ₹${data.fuelCost || 0}, food: ₹${data.foodCost || 0}). ` : ''}

This ride will be remembered as ${data.highlight || 'one of those rides where everything just felt right'}.
`
};

// Highlight generators
function generateHighlights(data: any): string[] {
  const highlights: string[] = [];

  if (data.distance > 100) highlights.push(`${data.distance}km covered`);
  if (data.durationHours > 4) highlights.push(`${data.durationHours}h epic journey`);
  if (data.companions > 2) highlights.push(`Group of ${data.companions} riders`);
  if (data.waypoints > 0) highlights.push(`${data.waypoints} waypoints explored`);
  if (data.elevation > 500) highlights.push(`${data.elevation}m elevation gain`);
  if (data.maxSpeed > 100) highlights.push(`Max speed: ${data.maxSpeed}km/h`);
  if (data.spontaneousStops > 3) highlights.push(`${data.spontaneousStops} scenic stops`);
  if (data.isFirstRide) highlights.push('First ride of the season');

  return highlights;
}

// Hashtag generators
function generateHashtags(data: any): string[] {
  const hashtags = [
    '#RiderCircle',
    `#Ride${data.distance}km`,
    '#TwoWheels',
    '#AdventureRider'
  ];

  if (data.distance > 200) hashtags.push('#LongRide', '#Endurance');
  if (data.distance > 500) hashtags.push('#EpicRide');
  if (data.elevation > 1000) hashtags.push('#MountainRider', '#Ghats');
  if (data.companions > 5) hashtags.push('#GroupRide');
  if (data.weather === 'rainy') hashtags.push('#RainRider', '#MonsoonRide');
  if (data.weather === 'sunny') hashtags.push('#PerfectDay');

  // Location hashtags
  if (data.endLocation) {
    const locationTag = data.endLocation.split(',')[0].replace(/\s+/g, '');
    if (locationTag) hashtags.push(`#${locationTag}`);
  }

  // Time-based
  const month = new Date().toLocaleString('default', { month: 'long' });
  hashtags.push(`#${month}${new Date().getFullYear()}`);

  return hashtags;
}

// Title generator
function generateTitle(data: any): string {
  const distanceKm = Math.round(data.distance);

  if (data.endLocation) {
    return `${data.endLocation.split(',')[0]} Adventure`;
  }

  if (distanceKm > 300) return `Epic ${distanceKm}km Journey`;
  if (distanceKm > 150) return `Amazing ${distanceKm}km Ride`;
  if (distanceKm > 80) return `Great ${distanceKm}km Run`;
  if (distanceKm > 40) return `${distanceKm}km Cruise`;
  return `${distanceKm}km Spin`;
}

export class MemoryService {
  private intelligenceUrl: string;

  constructor() {
    this.intelligenceUrl = config.hojai?.agentUrl || process.env.INTELLIGENCE_URL || 'http://localhost:4400';
  }

  /**
   * Generate a ride memory from completed ride data
   */
  async generateMemory(rideId: string): Promise<IRideMemory> {
    logger.info(`Generating memory for ride: ${rideId}`);

    // Get ride data
    const ride = await Ride.findById(rideId).populate('riderId');
    if (!ride) {
      throw new Error('Ride not found');
    }

    // Get rider data
    const rider = await RiderProfile.findById(ride.riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    // Prepare data for memory generation
    const data = this.prepareMemoryData(ride);

    // Try to use AI service, fall back to template
    let story = '';
    try {
      story = await this.generateAIStory(data);
    } catch {
      story = this.generateTemplateStory(data);
    }

    // Generate other components
    const title = generateTitle(data);
    const highlights = generateHighlights(data);
    const hashtags = generateHashtags(data);

    // Create or update memory
    const memory = await RideMemory.findOneAndUpdate(
      { rideId },
      {
        rideId: ride._id,
        riderId: rider._id,
        title,
        story,
        highlights,
        hashtags,
        stats: {
          distance: data.distance,
          duration: data.durationMinutes,
          maxSpeed: data.maxSpeed,
          avgSpeed: data.avgSpeed,
          elevation: { gain: data.elevation, loss: 0 },
          fuelCost: data.fuelCost,
          totalCost: data.totalCost,
        },
        route: {
          name: data.routeName,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          waypointsCount: data.waypoints,
        },
        weather: data.weather,
        companions: data.companionDetails,
        aiGenerated: true,
        generatedAt: new Date(),
        model: 'template',
        isPublic: !ride.isPrivate,
        tags: data.tags || [],
      },
      { upsert: true, new: true }
    );

    logger.info(`Memory generated: ${memory._id}`);

    return memory;
  }

  /**
   * Regenerate memory with AI (if available)
   */
  async regenerateWithAI(rideId: string): Promise<IRideMemory> {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Ride not found');
    }

    const data = this.prepareMemoryData(ride);

    // Try AI generation
    try {
      const story = await this.generateAIStory(data);
      const memory = await RideMemory.findOneAndUpdate(
        { rideId },
        {
          story,
          aiGenerated: true,
          model: 'hojai-genie',
          generatedAt: new Date(),
        },
        { new: true }
      );

      return memory!;
    } catch {
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Prepare ride data for memory generation
   */
  private prepareMemoryData(ride: any): any {
    const durationMinutes = ride.duration || 0;
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    return {
      distance: Math.round(ride.route.distance || 0),
      durationMinutes,
      durationHours: `${durationHours}h ${remainingMinutes}m`,
      maxSpeed: Math.round(ride.stats?.maxSpeed || 0),
      avgSpeed: Math.round(ride.stats?.avgSpeed || 0),
      elevation: Math.round(ride.route.elevation?.gain || 0),
      startLocation: ride.route.startLocation?.name || 'Unknown',
      endLocation: ride.route.endLocation?.name || null,
      routeName: ride.route.name || null,
      waypoints: ride.route.waypoints?.length || 0,
      companions: ride.companions?.length || 0,
      companionDetails: [],
      weather: ride.weather?.condition || null,
      fuelCost: ride.expenses?.fuel || 0,
      foodCost: ride.expenses?.food || 0,
      totalCost: ride.expenses?.total || 0,
      tags: ride.tags || [],
      isFirstRide: false, // TODO: check if first ride ever
      spontaneousStops: 0,
      stopNames: ride.route.waypoints?.map((w: any) => w.name).join(', '),
      terrain: 'varied',
      roadCondition: 'exciting',
      highlight: 'an adventure to remember',
    };
  }

  /**
   * Generate story using AI service
   */
  private async generateAIStory(data: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.intelligenceUrl}/api/memory/generate`,
        {
          ride_id: data.rideId,
          rider_id: data.riderId,
          title: generateTitle(data),
          distance: data.distance,
          duration: data.durationMinutes,
          start_location: data.startLocation,
          end_location: data.endLocation,
          waypoints: data.waypoints,
          companions: data.companions,
          expenses: { fuel: data.fuelCost, food: data.foodCost },
          weather: data.weather,
          photos: [],
        },
        { timeout: 10000 }
      );

      return response.data.story || this.generateTemplateStory(data);
    } catch (error) {
      logger.warn('AI memory generation failed, using template');
      throw error;
    }
  }

  /**
   * Generate story using templates
   */
  private generateTemplateStory(data: any): string {
    // Choose template based on distance
    if (data.distance < 50) {
      return MEMORY_TEMPLATES.short(data);
    } else if (data.distance < 200) {
      return MEMORY_TEMPLATES.medium(data);
    } else {
      return MEMORY_TEMPLATES.long(data);
    }
  }

  /**
   * Get memory by ID
   */
  async getMemory(memoryId: string): Promise<IRideMemory | null> {
    return RideMemory.findById(memoryId)
      .populate('riderId', 'displayName avatar')
      .populate('likes', 'displayName avatar');
  }

  /**
   * Get memories for a rider
   */
  async getRiderMemories(riderId: string, limit = 10): Promise<IRideMemory[]> {
    return RideMemory.findByRider(riderId, limit);
  }

  /**
   * Get public memories
   */
  async getPublicMemories(limit = 20, offset = 0): Promise<IRideMemory[]> {
    return RideMemory.findPublic(limit, offset);
  }

  /**
   * Get featured memories
   */
  async getFeaturedMemories(): Promise<IRideMemory[]> {
    return RideMemory.findFeatured();
  }

  /**
   * Like/unlike a memory
   */
  async toggleLike(memoryId: string, riderId: string): Promise<{ liked: boolean; likesCount: number }> {
    const memory = await RideMemory.findById(memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    const liked = await memory.like(riderId);
    return { liked, likesCount: memory.likesCount };
  }

  /**
   * Share a memory (increment share count)
   */
  async shareMemory(memoryId: string): Promise<string> {
    const memory = await RideMemory.findById(memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    await memory.incrementShare();
    return memory.shareableLink || `memory/${memory._id}`;
  }
}

// Singleton
let memoryService: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!memoryService) {
    memoryService = new MemoryService();
  }
  return memoryService;
}
