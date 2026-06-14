import { v4 as uuidv4 } from 'uuid';
import { Bid, AuctionResult, AdSlot, Deal, AuctionAnalytics, VickreyAuctionRequest } from '../types';
import { Auction } from '../models/Auction';
import { AuctionHistory } from '../models/AuctionHistory';
import logger from 'utils/logger.js';
import { recordAuctionMetrics, recordBidMetrics } from '../utils/metrics';

export class VickreyService {
  async execute(request: VickreyAuctionRequest): Promise<AuctionResult> {
    const startTime = Date.now();
    logger.info(`Executing Vickrey auction: ${request.auctionId}`, { auctionId: request.auctionId, bidCount: request.bids.length });

    try {
      const sortedBids = [...request.bids].sort((a, b) => b.price - a.price);
      const analytics = this.calculateAnalytics(sortedBids);
      const dealWinner = this.checkDeals(request.deals, sortedBids, request.adSlots);
      const reservePrice = request.adSlots[0]?.reservePrice || 0;

      let winner: Bid | null = null;
      let price = 0;
      let secondPrice = 0;
      let status: 'completed' | 'no-fill' = 'completed';
      let reasoning = '';

      if (dealWinner) {
        winner = dealWinner.bid;
        price = dealWinner.deal.price;
        secondPrice = sortedBids.find(b => b.seatId !== winner?.seatId)?.price || 0;
        reasoning = `Deal ${dealWinner.deal.dealId} wins with deal price ${price}. True second-highest was ${secondPrice}`;
      } else if (sortedBids.length >= 2) {
        const highestBid = sortedBids[0];
        const secondHighestBid = sortedBids[1];
        if (highestBid.price >= reservePrice) {
          winner = highestBid;
          secondPrice = secondHighestBid.price;
          price = secondPrice; // Pure Vickrey: pay exactly second-highest
          reasoning = `Seat ${highestBid.seatId} wins with sealed bid ${highestBid.price}, pays ${price} (second-highest sealed bid)`;
        } else {
          status = 'no-fill';
          reasoning = `Highest sealed bid ${highestBid.price} below reserve price ${reservePrice}`;
        }
      } else if (sortedBids.length === 1) {
        if (sortedBids[0].price >= reservePrice) {
          winner = sortedBids[0];
          price = Math.max(reservePrice, sortedBids[0].price * 0.5);
          secondPrice = 0;
          reasoning = `Single sealed bid ${winner.seatId} wins at ${price} (reserve/floor applied)`;
        } else {
          status = 'no-fill';
          reasoning = `Single sealed bid ${sortedBids[0].price} below reserve ${reservePrice}`;
        }
      }

      const duration = Date.now() - startTime;
      recordBidMetrics('vickrey', request.bids.length);
      recordAuctionMetrics('vickrey', status, duration / 1000, price, winner?.seatId);

      const auction = new Auction({
        auctionId: request.auctionId,
        auctionType: 'vickrey',
        bids: request.bids.map(b => ({ ...b, bidId: b.bidId || uuidv4(), timestamp: b.timestamp || new Date() })),
        winner: winner ? { seatId: winner.seatId, adId: winner.adId, price: winner.price, qualityScore: winner.qualityScore, creative: winner.creative } : null,
        price, secondPrice,
        deals: request.deals || [],
        adSlots: request.adSlots,
        status, timestamp: new Date(), analytics, reasoning,
        metadata: { startTime: new Date(startTime), endTime: new Date(), duration, error: null as any },
      });

      await auction.save();
      await this.saveToHistory(auction, winner, price, secondPrice, status, analytics);

      const result: AuctionResult = { auctionId: request.auctionId, auctionType: 'vickrey', winner, price, secondPrice, deal: dealWinner?.deal || null, status, timestamp: new Date(), analytics, reasoning };
      logger.info(`Vickrey auction completed: ${request.auctionId}`, { auctionId: request.auctionId, winner: winner?.seatId, winningBid: winner?.price, price, duration });
      return result;
    } catch (error) {
      logger.error(`Vickrey auction failed: ${request.auctionId}`, { auctionId: request.auctionId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private calculateAnalytics(bids: Bid[]): AuctionAnalytics {
    const prices = bids.map(b => b.price).sort((a, b) => a - b);
    const totalBids = bids.length;
    return { totalBids, bidFloor: prices[0] || 0, bidCeiling: prices[prices.length - 1] || 0, spread: (prices[prices.length - 1] || 0) - (prices[0] || 0), avgBidPrice: prices.reduce((a, b) => a + b, 0) / totalBids || 0, medianBidPrice: totalBids > 0 ? (totalBids % 2 !== 0 ? prices[Math.floor(totalBids / 2)] : (prices[Math.floor(totalBids / 2) - 1] + prices[Math.floor(totalBids / 2)]) / 2) : 0 };
  }

  private checkDeals(deals: Deal[] | undefined, sortedBids: Bid[], adSlots: AdSlot[]): { bid: Bid; deal: Deal } | null {
    if (!deals || deals.length === 0) return null;
    const reservePrice = adSlots[0]?.reservePrice || 0;
    const sortedDeals = [...deals].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const deal of sortedDeals) {
      if (deal.price >= reservePrice) {
        const matchingBid = sortedBids.find(b => b.seatId === deal.seatId);
        if (matchingBid && matchingBid.price >= deal.price) return { bid: matchingBid, deal };
      }
    }
    return null;
  }

  private async saveToHistory(auction: any, winner: Bid | null, price: number, secondPrice: number, status: 'completed' | 'no-fill', analytics: AuctionAnalytics) {
    try {
      const seatStats = new Map<string, { bids: number; wins: number; spend: number }>();
      for (const bid of auction.bids) {
        const existing = seatStats.get(bid.seatId) || { bids: 0, wins: 0, spend: 0 };
        existing.bids++;
        if (winner && bid.seatId === winner.seatId) { existing.wins++; existing.spend += price; }
        seatStats.set(bid.seatId, existing);
      }
      const topBidders = Array.from(seatStats.entries()).map(([seatId, stats]) => ({ seatId, bidCount: stats.bids, winCount: stats.wins, totalSpend: stats.spend, avgBidPrice: stats.bids > 0 ? stats.spend / stats.bids : 0 }));
      const history = new AuctionHistory({ auctionId: auction.auctionId, auctionType: 'vickrey', results: { winner: winner ? { seatId: winner.seatId, adId: winner.adId, price: winner.price } : null as any, price, secondPrice, status: status === 'completed' ? 'completed' : 'no-fill' }, analytics, topBidders, revenue: { total: status === 'completed' ? price : 0, byType: new Map([['vickrey', status === 'completed' ? price : 0]]) }, timestamp: new Date(), metadata: { date: new Date().toISOString().split('T')[0], hour: new Date().getHours(), dayOfWeek: new Date().getDay() } });
      await history.save();
    } catch (error) { logger.error('Failed to save auction history', { auctionId: auction.auctionId, error: error instanceof Error ? error.message : 'Unknown error' }); }
  }

  async simulateStrategy(trueValue: number, competitorBids: number[], numSimulations: number = 1000) {
    let optimalBid = trueValue;
    let bestProfit = -Infinity;
    let winCount = 0;
    for (const bidMultiplier of [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1]) {
      const bid = trueValue * bidMultiplier;
      let profit = 0;
      let wins = 0;
      for (const compBid of competitorBids) {
        if (bid > compBid) { wins++; profit += trueValue - compBid; }
      }
      const avgProfit = profit / competitorBids.length;
      if (avgProfit > bestProfit) { bestProfit = avgProfit; optimalBid = bid; winCount = wins; }
    }
    return { optimalBid, expectedProfit: bestProfit, winProbability: winCount / competitorBids.length, bidStrategy: optimalBid === trueValue ? 'truthful' : optimalBid < trueValue ? 'conservative' : 'aggressive' };
  }
}

export const vickreyService = new VickreyService();