import { v4 as uuidv4 } from 'uuid';
import { Bid, AuctionResult, AdSlot, Deal, AuctionAnalytics, WeightedAuctionRequest } from '../types';
import { Auction } from '../models/Auction';
import { AuctionHistory } from '../models/AuctionHistory';
import logger from 'utils/logger.js';
import { recordAuctionMetrics, recordBidMetrics, qualityScoreHistogram, effectiveBidHistogram } from '../utils/metrics';

export class WeightedService {
  async execute(request: WeightedAuctionRequest): Promise<AuctionResult> {
    const startTime = Date.now();
    logger.info(`Executing weighted auction: ${request.auctionId}`, { auctionId: request.auctionId, bidCount: request.bids.length });

    try {
      const weightFormula = request.weightFormula || 'linear';
      const bidsWithEffectivePrice = request.bids.map(bid => ({ bid, effectiveBid: this.calculateEffectiveBid(bid, weightFormula) }));
      const sortedBids = bidsWithEffectivePrice.sort((a, b) => b.effectiveBid - a.effectiveBid);

      for (const { bid } of sortedBids) {
        if (bid.qualityScore !== undefined) qualityScoreHistogram.observe(bid.qualityScore);
        effectiveBidHistogram.observe({ auction_type: 'weighted' }, bid.price * (bid.qualityScore || 1));
      }

      const analytics = this.calculateAnalytics(sortedBids.map(s => s.bid));
      const dealWinner = this.checkDeals(request.deals, sortedBids.map(s => s.bid), request.adSlots);
      const reservePrice = request.adSlots[0]?.reservePrice || 0;

      let winner: Bid | null = null;
      let price = 0;
      let effectiveBid = 0;
      let adjustedBid = 0;
      let secondPrice = 0;
      let status: 'completed' | 'no-fill' = 'completed';
      let reasoning = '';

      if (dealWinner) {
        winner = dealWinner.bid;
        price = dealWinner.deal.price;
        effectiveBid = winner.price * (winner.qualityScore || 1);
        adjustedBid = winner.price;
        secondPrice = sortedBids.find(s => s.bid.seatId !== winner?.seatId)?.effectiveBid || 0;
        reasoning = `Deal ${dealWinner.deal.dealId} wins with deal price ${price}. Effective bid: ${effectiveBid.toFixed(4)}`;
      } else if (sortedBids.length >= 2) {
        const highestEntry = sortedBids[0];
        const secondHighestEntry = sortedBids[1];
        if (highestEntry.effectiveBid >= reservePrice) {
          winner = highestEntry.bid;
          effectiveBid = highestEntry.effectiveBid;
          adjustedBid = winner.price;
          secondPrice = secondHighestEntry.effectiveBid;
          price = secondHighestEntry.bid.qualityScore ? secondHighestEntry.effectiveBid / (winner.qualityScore || 1) : secondHighestEntry.bid.price;
          price = Math.max(price, reservePrice);
          reasoning = `${winner.seatId} wins with effective bid ${effectiveBid.toFixed(4)} (${winner.price} * ${winner.qualityScore || 1}), pays ${price.toFixed(4)} (beats ${secondPrice.toFixed(4)})`;
        } else {
          status = 'no-fill';
          reasoning = `Highest effective bid ${highestEntry.effectiveBid.toFixed(4)} below reserve ${reservePrice}`;
        }
      } else if (sortedBids.length === 1) {
        const entry = sortedBids[0];
        if (entry.effectiveBid >= reservePrice) {
          winner = entry.bid;
          effectiveBid = entry.effectiveBid;
          adjustedBid = winner.price;
          price = Math.max(reservePrice, winner.price * 0.5);
          reasoning = `Single bidder ${winner.seatId} wins at ${price} (reserve/floor applied)`;
        } else {
          status = 'no-fill';
          reasoning = `Effective bid ${entry.effectiveBid.toFixed(4)} below reserve ${reservePrice}`;
        }
      }

      const duration = Date.now() - startTime;
      recordBidMetrics('weighted', request.bids.length);
      recordAuctionMetrics('weighted', status, duration / 1000, price, winner?.seatId);

      const auction = new Auction({
        auctionId: request.auctionId,
        auctionType: 'weighted',
        bids: request.bids.map(b => ({ ...b, bidId: b.bidId || uuidv4(), timestamp: b.timestamp || new Date() })),
        winner: winner ? { seatId: winner.seatId, adId: winner.adId, price: winner.price, qualityScore: winner.qualityScore, creative: winner.creative } : null,
        price, secondPrice, effectiveBid, adjustedBid,
        deals: request.deals || [],
        adSlots: request.adSlots,
        status, timestamp: new Date(), analytics, reasoning,
        metadata: { startTime: new Date(startTime), endTime: new Date(), duration, error: null as any },
      });

      await auction.save();
      await this.saveToHistory(auction, winner, price, secondPrice, status, analytics);

      const result: AuctionResult = { auctionId: request.auctionId, auctionType: 'weighted', winner, price, secondPrice, effectiveBid, adjustedBid, deal: dealWinner?.deal || null, status, timestamp: new Date(), analytics, reasoning };
      logger.info(`Weighted auction completed: ${request.auctionId}`, { auctionId: request.auctionId, winner: winner?.seatId, effectiveBid, price, duration });
      return result;
    } catch (error) {
      logger.error(`Weighted auction failed: ${request.auctionId}`, { auctionId: request.auctionId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private calculateEffectiveBid(bid: Bid, formula: 'linear' | 'exponential' | 'sqrt'): number {
    const price = bid.price;
    const quality = bid.qualityScore !== undefined ? bid.qualityScore : 1;
    switch (formula) {
      case 'exponential': return price * Math.pow(quality, 2);
      case 'sqrt': return price * Math.sqrt(quality);
      default: return price * quality;
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
      const history = new AuctionHistory({ auctionId: auction.auctionId, auctionType: 'weighted', results: { winner: winner ? { seatId: winner.seatId, adId: winner.adId, price: winner.price } : null as any, price, secondPrice, status: status === 'completed' ? 'completed' : 'no-fill' }, analytics, topBidders, revenue: { total: status === 'completed' ? price : 0, byType: new Map([['weighted', status === 'completed' ? price : 0]]) }, timestamp: new Date(), metadata: { date: new Date().toISOString().split('T')[0], hour: new Date().getHours(), dayOfWeek: new Date().getDay() } });
      await history.save();
    } catch (error) { logger.error('Failed to save auction history', { auctionId: auction.auctionId, error: error instanceof Error ? error.message : 'Unknown error' }); }
  }
}

export const weightedService = new WeightedService();