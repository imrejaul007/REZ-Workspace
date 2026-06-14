import express from 'express';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  port: parseInt(process.env.PORT || '4300'),
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'ridercircle',
  },
};

// Logger
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
};

// Neo4j Driver
let driver: Driver;

async function connectNeo4j(): Promise<void> {
  try {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );

    await driver.verifyConnectivity();
    logger.info(`Neo4j connected: ${config.neo4j.uri}`);
  } catch (error) {
    logger.error('Failed to connect to Neo4j:', error);
    throw error;
  }
}

// Graph Node Types
interface RiderNode {
  id: string;
  displayName: string;
  avatar?: string;
  trustScore: number;
  ridingStyle: string;
  city: string;
}

interface BikeNode {
  id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
}

interface RouteNode {
  id: string;
  name: string;
  distance: number;
  difficulty: string;
  city: string;
}

interface GroupNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
}

interface DestinationNode {
  id: string;
  name: string;
  type: string;
  city: string;
  rating: number;
}

interface ServiceCenterNode {
  id: string;
  name: string;
  type: string;
  city: string;
  rating: number;
}

// Graph Service Class
class RiderGraphService {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  // ==========================================
  // RIDER OPERATIONS
  // ==========================================

  async createRider(rider: RiderNode): Promise<void> {
    const query = `
      CREATE (r:Rider {
        id: $id,
        displayName: $displayName,
        avatar: $avatar,
        trustScore: $trustScore,
        ridingStyle: $ridingStyle,
        city: $city,
        createdAt: datetime()
      })
      RETURN r
    `;

    await this.session.run(query, rider);
    logger.info(`Created Rider node: ${rider.id}`);
  }

  async updateRiderTrustScore(riderId: string, trustScore: number): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      SET r.trustScore = $trustScore
    `;

    await this.session.run(query, { riderId, trustScore });
  }

  async getRiderRecommendations(riderId: string, limit = 10): Promise<any[]> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (r)-[:RODE]->(route:Route)
      MATCH (similar:Rider)-[:RODE]->(route)
      WHERE similar <> r
      WITH similar, count(route) as commonRoutes
      ORDER BY commonRoutes DESC, similar.trustScore DESC
      LIMIT $limit
      RETURN similar.id as id,
             similar.displayName as displayName,
             similar.avatar as avatar,
             similar.trustScore as trustScore,
             commonRoutes
    `;

    const result = await this.session.run(query, { riderId, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      displayName: record.get('displayName'),
      avatar: record.get('avatar'),
      trustScore: record.get('trustScore'),
      commonRoutes: record.get('commonRoutes'),
    }));
  }

  // ==========================================
  // BIKE OPERATIONS
  // ==========================================

  async createBike(bike: BikeNode, ownerId: string): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $ownerId})
      CREATE (r)-[:OWNS]->(b:Bike {
        id: $id,
        nickname: $nickname,
        make: $make,
        model: $model,
        year: $year,
        registrationNumber: $registrationNumber,
        createdAt: datetime()
      })
    `;

    await this.session.run(query, { ...bike, ownerId });
    logger.info(`Created Bike node: ${bike.id} for rider: ${ownerId}`);
  }

  async getSimilarBikes(bikeId: string, limit = 5): Promise<any[]> {
    const query = `
      MATCH (b:Bike {id: $bikeId})
      MATCH (b)<-[:OWNS]-(r:Rider)-[:OWNS]->(similar:Bike)
      WHERE similar <> b AND b.make = similar.make
      WITH similar, count(r) as ownerCount
      ORDER BY ownerCount DESC
      LIMIT $limit
      RETURN similar.id as id,
             similar.nickname as nickname,
             similar.make as make,
             similar.model as model,
             ownerCount
    `;

    const result = await this.session.run(query, { bikeId, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      nickname: record.get('nickname'),
      make: record.get('make'),
      model: record.get('model'),
      ownerCount: record.get('ownerCount'),
    }));
  }

  // ==========================================
  // ROUTE OPERATIONS
  // ==========================================

  async createRoute(route: RouteNode, riderId: string): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      CREATE (r)-[:CREATED]->(rt:Route {
        id: $id,
        name: $name,
        distance: $distance,
        difficulty: $difficulty,
        city: $city,
        rideCount: 0,
        avgRating: 0,
        createdAt: datetime()
      })
    `;

    await this.session.run(query, { ...route, riderId });
    logger.info(`Created Route node: ${route.id}`);
  }

  async recordRide(riderId: string, routeId: string, rideId: string, distance: number): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (rt:Route {id: $routeId})
      MERGE (r)-[rel:RODE]->(rt)
      ON CREATE SET rel.rideIds = [$rideId], rel.rideCount = 1, rel.totalDistance = $distance
      ON MATCH SET rel.rideIds = rel.rideIds + $rideId, rel.rideCount = rel.rideCount + 1, rel.totalDistance = rel.totalDistance + $distance
      SET rt.rideCount = coalesce(rt.rideCount, 0) + 1
    `;

    await this.session.run(query, { riderId, routeId, rideId, distance });
  }

  async getRouteRecommendations(riderId: string, limit = 10): Promise<any[]> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (r)-[:RODE]->(myRoute:Route)
      MATCH (r)-[:LIKES]->(likedRoute:Route)
      MATCH (likedRoute)-[:SIMILAR_TO]->(recRoute:Route)
      WHERE NOT (r)-[:RODE]->(recRoute) AND recRoute <> myRoute
      WITH recRoute, count(DISTINCT likedRoute) as matchScore
      ORDER BY matchScore DESC, recRoute.rideCount DESC
      LIMIT $limit
      RETURN recRoute.id as id,
             recRoute.name as name,
             recRoute.distance as distance,
             recRoute.difficulty as difficulty,
             recRoute.city as city,
             recRoute.rideCount as rideCount,
             matchScore
    `;

    const result = await this.session.run(query, { riderId, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      distance: record.get('distance'),
      difficulty: record.get('difficulty'),
      city: record.get('city'),
      rideCount: record.get('rideCount'),
      matchScore: record.get('matchScore'),
    }));
  }

  async getPopularRoutes(city?: string, limit = 10): Promise<any[]> {
    let query = `
      MATCH (rt:Route)
    `;

    if (city) {
      query += ` WHERE rt.city = $city`;
    }

    query += `
      RETURN rt.id as id,
             rt.name as name,
             rt.distance as distance,
             rt.difficulty as difficulty,
             rt.city as city,
             rt.rideCount as rideCount,
             rt.avgRating as avgRating
      ORDER BY rt.rideCount DESC
      LIMIT $limit
    `;

    const result = await this.session.run(query, { city, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      distance: record.get('distance'),
      difficulty: record.get('difficulty'),
      city: record.get('city'),
      rideCount: record.get('rideCount'),
      avgRating: record.get('avgRating'),
    }));
  }

  // ==========================================
  // GROUP OPERATIONS
  // ==========================================

  async createGroup(group: GroupNode, ownerId: string): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $ownerId})
      CREATE (r)-[:CREATED]->(g:Group {
        id: $id,
        name: $name,
        slug: $slug,
        type: $type,
        city: $city,
        memberCount: 1,
        createdAt: datetime()
      })
      CREATE (r)-[:MEMBER_OF]->(g)
    `;

    await this.session.run(query, { ...group, ownerId });
    logger.info(`Created Group node: ${group.id}`);
  }

  async joinGroup(riderId: string, groupId: string): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (g:Group {id: $groupId})
      MERGE (r)-[:MEMBER_OF]->(g)
      SET g.memberCount = coalesce(g.memberCount, 0) + 1
    `;

    await this.session.run(query, { riderId, groupId });
  }

  async getGroupRecommendations(riderId: string, limit = 5): Promise<any[]> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (r)-[:MEMBER_OF]->(myGroup:Group)
      MATCH (myGroup)-[:SIMILAR_TO]-(recGroup:Group)
      WHERE NOT (r)-[:MEMBER_OF]->(recGroup)
      WITH recGroup, count(myGroup) as matchScore
      ORDER BY matchScore DESC, recGroup.memberCount DESC
      LIMIT $limit
      RETURN recGroup.id as id,
             recGroup.name as name,
             recGroup.slug as slug,
             recGroup.type as type,
             recGroup.city as city,
             recGroup.memberCount as memberCount,
             matchScore
    `;

    const result = await this.session.run(query, { riderId, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      slug: record.get('slug'),
      type: record.get('type'),
      city: record.get('city'),
      memberCount: record.get('memberCount'),
      matchScore: record.get('matchScore'),
    }));
  }

  // ==========================================
  // DESTINATION OPERATIONS
  // ==========================================

  async createDestination(destination: DestinationNode): Promise<void> {
    const query = `
      CREATE (d:Destination {
        id: $id,
        name: $name,
        type: $type,
        city: $city,
        rating: $rating,
        visitCount: 0,
        createdAt: datetime()
      })
    `;

    await this.session.run(query, destination);
    logger.info(`Created Destination node: ${destination.id}`);
  }

  async recordVisit(riderId: string, destinationId: string): Promise<void> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (d:Destination {id: $destinationId})
      MERGE (r)-[rel:VISITED]->(d)
      SET d.visitCount = coalesce(d.visitCount, 0) + 1
    `;

    await this.session.run(query, { riderId, destinationId });
  }

  async getDestinationRecommendations(riderId: string, limit = 10): Promise<any[]> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH (r)-[:VISITED]->(visited:Destination)
      MATCH (visited)-[:NEARBY]->(rec:Destination)
      WHERE NOT (r)-[:VISITED]->(rec)
      WITH rec, visited, count(visited) as nearbyScore
      ORDER BY nearbyScore DESC, rec.rating DESC
      LIMIT $limit
      RETURN rec.id as id,
             rec.name as name,
             rec.type as type,
             rec.city as city,
             rec.rating as rating,
             nearbyScore
    `;

    const result = await this.session.run(query, { riderId, limit });
    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      type: record.get('type'),
      city: record.get('city'),
      rating: record.get('rating'),
      nearbyScore: record.get('nearbyScore'),
    }));
  }

  // ==========================================
  // SERVICE CENTER OPERATIONS
  // ==========================================

  async createServiceCenter(center: ServiceCenterNode): Promise<void> {
    const query = `
      CREATE (s:ServiceCenter {
        id: $id,
        name: $name,
        type: $type,
        city: $city,
        rating: $rating,
        reviewCount: 0,
        createdAt: datetime()
      })
    `;

    await this.session.run(query, center);
    logger.info(`Created ServiceCenter node: ${center.id}`);
  }

  async getNearbyServiceCenters(coordinates: [number, number], bikeType: string, limit = 5): Promise<any[]> {
    // In production, use spatial queries with Neo4j Point type
    const query = `
      MATCH (s:ServiceCenter)
      WHERE s.city = $city
      RETURN s.id as id,
             s.name as name,
             s.type as type,
             s.rating as rating,
             s.reviewCount as reviewCount
      ORDER BY s.rating DESC, s.reviewCount DESC
      LIMIT $limit
    `;

    const result = await this.session.run(query, { city: 'Bangalore', limit }); // TODO: Use coordinates
    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      type: record.get('type'),
      rating: record.get('rating'),
      reviewCount: record.get('reviewCount'),
    }));
  }

  // ==========================================
  // TRUST & RELATIONSHIPS
  // ==========================================

  async followRider(fromId: string, toId: string): Promise<void> {
    const query = `
      MATCH (a:Rider {id: $fromId})
      MATCH (b:Rider {id: $toId})
      MERGE (a)-[:FOLLOWS]->(b)
    `;

    await this.session.run(query, { fromId, toId });
  }

  async getRiderNetwork(riderId: string, depth = 2): Promise<any[]> {
    const query = `
      MATCH (r:Rider {id: $riderId})
      MATCH path = (r)-[:FOLLOWS|MEMBER_OF|RODE*1..${depth}]-(connected)
      WITH DISTINCT connected, length(path) as dist
      RETURN connected.id as id,
             connected.displayName as displayName,
             connected.trustScore as trustScore,
             dist
      ORDER BY dist, trustScore DESC
      LIMIT 50
    `;

    const result = await this.session.run(query, { riderId });
    return result.records.map(record => ({
      id: record.get('id'),
      displayName: record.get('displayName'),
      trustScore: record.get('trustScore'),
      distance: record.get('dist'),
    }));
  }

  async calculateTrustScore(riderId: string): Promise<number> {
    // Calculate trust score based on network
    const query = `
      MATCH (r:Rider {id: $riderId})
      OPTIONAL MATCH (r)<-[:FOLLOWS]-(follower:Rider)
      OPTIONAL MATCH (r)-[:RODE]->(route:Route)
      OPTIONAL MATCH (r)-[:MEMBER_OF]->(g:Group)

      WITH r,
           count(DISTINCT follower) as followers,
           count(DISTINCT route) as rides,
           count(DISTINCT g) as groups

      RETURN CASE
        WHEN followers > 0 AND rides > 0
        THEN min(100, (followers * 5) + (rides * 2) + (groups * 10) + 50)
        ELSE 50
      END as trustScore
    `;

    const result = await this.session.run(query, { riderId });
    return result.records[0]?.get('trustScore') || 50;
  }

  // ==========================================
  // SEARCH & DISCOVERY
  // ==========================================

  async search(query: string, types: string[]): Promise<any[]> {
    const results: any[] = [];

    if (types.includes('riders') || types.length === 0) {
      const ridersQuery = `
        MATCH (r:Rider)
        WHERE r.displayName CONTAINS $query
        RETURN 'rider' as type, r.id as id, r.displayName as name, r.avatar as avatar, r.trustScore as score
        LIMIT 10
      `;
      const ridersResult = await this.session.run(ridersQuery, { query });
      results.push(...ridersResult.records.map(r => ({
        type: 'rider',
        id: r.get('id'),
        name: r.get('name'),
        avatar: r.get('avatar'),
        score: r.get('score'),
      })));
    }

    if (types.includes('routes') || types.length === 0) {
      const routesQuery = `
        MATCH (rt:Route)
        WHERE rt.name CONTAINS $query
        RETURN 'route' as type, rt.id as id, rt.name as name, rt.distance as distance, rt.rideCount as score
        LIMIT 10
      `;
      const routesResult = await this.session.run(routesQuery, { query });
      results.push(...routesResult.records.map(r => ({
        type: 'route',
        id: r.get('id'),
        name: r.get('name'),
        distance: r.get('distance'),
        score: r.get('score'),
      })));
    }

    if (types.includes('groups') || types.length === 0) {
      const groupsQuery = `
        MATCH (g:Group)
        WHERE g.name CONTAINS $query
        RETURN 'group' as type, g.id as id, g.name as name, g.memberCount as score
        LIMIT 10
      `;
      const groupsResult = await this.session.run(groupsQuery, { query });
      results.push(...groupsResult.records.map(r => ({
        type: 'group',
        id: r.get('id'),
        name: r.get('name'),
        score: r.get('score'),
      })));
    }

    if (types.includes('destinations') || types.length === 0) {
      const destQuery = `
        MATCH (d:Destination)
        WHERE d.name CONTAINS $query
        RETURN 'destination' as type, d.id as id, d.name as name, d.rating as score
        LIMIT 10
      `;
      const destResult = await this.session.run(destQuery, { query });
      results.push(...destResult.records.map(r => ({
        type: 'destination',
        id: r.get('id'),
        name: r.get('name'),
        score: r.get('score'),
      })));
    }

    return results.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}

// Express App
const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rider-circle-graph' });
});

// Routes
app.post('/api/riders', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    await graphService.createRider(req.body);

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error creating rider:', error);
    res.status(500).json({ error: 'Failed to create rider' });
  }
});

app.get('/api/riders/:id/recommendations', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    const recommendations = await graphService.getRiderRecommendations(req.params.id);

    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    await graphService.createRoute(req.body, req.body.riderId);

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

app.get('/api/routes/recommendations/:riderId', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    const recommendations = await graphService.getRouteRecommendations(req.params.riderId);

    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('Error getting route recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.get('/api/routes/popular', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    const routes = await graphService.getPopularRoutes(req.query.city as string);

    res.json({ success: true, data: routes });
  } catch (error) {
    logger.error('Error getting popular routes:', error);
    res.status(500).json({ error: 'Failed to get routes' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    await graphService.createGroup(req.body, req.body.ownerId);

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    const types = req.query.types
      ? (req.query.types as string).split(',')
      : [];

    const results = await graphService.search(req.query.q as string, types);

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/network/:riderId', async (req, res) => {
  try {
    const session = driver.session();
    const graphService = new RiderGraphService(session);

    const network = await graphService.getRiderNetwork(
      req.params.riderId,
      parseInt(req.query.depth as string) || 2
    );

    res.json({ success: true, data: network });
  } catch (error) {
    logger.error('Error getting network:', error);
    res.status(500).json({ error: 'Failed to get network' });
  }
});

// Start server
async function start() {
  try {
    await connectNeo4j();

    app.listen(config.port, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🧠 RiderCircle Graph Service Starting...               ║
║                                                            ║
║   Port: ${config.port.toString().padEnd(50)}║
║   Neo4j: ${config.neo4j.uri.padEnd(45)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();