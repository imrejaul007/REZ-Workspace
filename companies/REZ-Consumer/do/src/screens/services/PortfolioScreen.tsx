/**
 * Portfolio Screen
 *
 * AssetMind financial integration for DO App
 * Features: Portfolio, Stocks, Watchlist, Trading
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { assetmindClient } from '../services/clients';

interface Props {
  navigation?: any;
}

const PortfolioScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId] = useState('USER001');

  const [portfolio, setPortfolio] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist' | 'trade' | 'insights'>('portfolio');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portfolioData, watchlistData] = await Promise.all([
        assetmindClient.getPortfolio(userId),
        assetmindClient.getWatchlist(userId),
      ]);
      setPortfolio(portfolioData);
      setWatchlist(watchlistData?.watchlist || []);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const searchStocks = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const result = await assetmindClient.searchStocks(searchQuery);
      // Handle search results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <Text style={styles.headerSubtitle}>AssetMind Intelligence</Text>
      </View>

      {/* Portfolio Value Card */}
      <View style={styles.valueCard}>
        <Text style={styles.valueLabel}>Total Portfolio Value</Text>
        <Text style={styles.valueAmount}>₹{portfolio?.totalValue?.toLocaleString() || '12,50,000'}</Text>
        <View style={styles.changeRow}>
          <Text style={[styles.change, styles.changeUp]}>+₹8,500</Text>
          <Text style={[styles.changePercent, styles.changeUp]}>+0.68%</Text>
          <Text style={styles.changePeriod}>Today</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>1M Return</Text>
          <Text style={[styles.statValue, styles.changeUp]}>+3.2%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>YTD Return</Text>
          <Text style={[styles.statValue, styles.changeUp]}>+22%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Stocks</Text>
          <Text style={styles.statValue}>{portfolio?.holdings?.length || 5}</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['portfolio', 'watchlist', 'trade', 'insights'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <View>
            <Text style={styles.sectionTitle}>Top Holdings</Text>
            {[
              { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1680, change: 2.3, shares: 50 },
              { symbol: 'TCS', name: 'Tata Consultancy', price: 3850, change: 1.2, shares: 20 },
              { symbol: 'INFY', name: 'Infosys', price: 1520, change: -0.5, shares: 30 },
              { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850, change: 0.8, shares: 15 },
              { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 980, change: 1.5, shares: 40 },
            ].map((stock, index) => (
              <TouchableOpacity key={index} style={styles.holdingCard}>
                <View style={styles.holdingLeft}>
                  <Text style={styles.holdingSymbol}>{stock.symbol}</Text>
                  <Text style={styles.holdingName}>{stock.name}</Text>
                  <Text style={styles.holdingShares}>{stock.shares} shares</Text>
                </View>
                <View style={styles.holdingRight}>
                  <Text style={styles.holdingPrice}>₹{stock.price}</Text>
                  <Text style={[styles.holdingChange, stock.change >= 0 ? styles.changeUp : styles.changeDown]}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </Text>
                  <Text style={styles.holdingValue}>₹{(stock.price * stock.shares).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <View>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search stocks..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchStocks}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Watchlist</Text>
            {watchlist.length > 0 ? (
              watchlist.map((stock: any, index: number) => (
                <View key={index} style={styles.watchlistCard}>
                  <View>
                    <Text style={styles.watchlistSymbol}>{stock.symbol}</Text>
                    <Text style={styles.watchlistPrice}>₹{stock.price}</Text>
                  </View>
                  <View style={[styles.watchlistChange, stock.change >= 0 ? styles.changeUp : styles.changeDown]}>
                    <Text style={styles.watchlistChangeText}>
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <>
                {[
                  { symbol: 'HDFCBANK', price: 1680, change: 2.3 },
                  { symbol: 'TCS', price: 3850, change: 1.2 },
                  { symbol: 'INFY', price: 1520, change: -0.5 },
                ].map((stock, index) => (
                  <View key={index} style={styles.watchlistCard}>
                    <View>
                      <Text style={styles.watchlistSymbol}>{stock.symbol}</Text>
                      <Text style={styles.watchlistPrice}>₹{stock.price}</Text>
                    </View>
                    <View style={[styles.watchlistChange, stock.change >= 0 ? styles.changeUp : styles.changeDown]}>
                      <Text style={styles.watchlistChangeText}>
                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Trade Tab */}
        {activeTab === 'trade' && (
          <View>
            <View style={styles.tradeCard}>
              <Text style={styles.tradeTitle}>Quick Trade</Text>

              <View style={styles.tradeForm}>
                <Text style={styles.tradeLabel}>Stock</Text>
                <TextInput
                  style={styles.tradeInput}
                  placeholder="Enter symbol"
                  placeholderTextColor="#999"
                />

                <View style={styles.tradeRow}>
                  <View style={styles.tradeField}>
                    <Text style={styles.tradeLabel}>Quantity</Text>
                    <TextInput
                      style={styles.tradeInput}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.tradeField}>
                    <Text style={styles.tradeLabel}>Price</Text>
                    <TextInput
                      style={styles.tradeInput}
                      placeholder="Market"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.tradeButtons}>
                  <TouchableOpacity style={[styles.tradeButton, styles.buyButton]}>
                    <Text style={styles.tradeButtonText}>Buy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tradeButton, styles.sellButton]}>
                    <Text style={styles.tradeButtonText}>Sell</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.recentTrades}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {[
                { type: 'BUY', symbol: 'HDFCBANK', qty: 10, price: 1680, status: 'Executed' },
                { type: 'BUY', symbol: 'TCS', qty: 5, price: 3850, status: 'Pending' },
                { type: 'SELL', symbol: 'INFY', qty: 10, price: 1520, status: 'Executed' },
              ].map((order, index) => (
                <View key={index} style={styles.orderCard}>
                  <View style={styles.orderLeft}>
                    <Text style={[styles.orderType, order.type === 'BUY' ? styles.buyType : styles.sellType]}>
                      {order.type}
                    </Text>
                    <Text style={styles.orderSymbol}>{order.symbol}</Text>
                  </View>
                  <View style={styles.orderMiddle}>
                    <Text style={styles.orderQty}>{order.qty} @ ₹{order.price}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={[styles.orderStatus, order.status === 'Executed' ? styles.executedStatus : styles.pendingStatus]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <View>
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Portfolio Health</Text>
              <View style={styles.healthScore}>
                <Text style={styles.healthNumber}>82</Text>
                <Text style={styles.healthLabel}>/100</Text>
              </View>
              <Text style={styles.healthDesc}>Good diversification across sectors</Text>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>AI Insights</Text>
              {[
                { icon: '📊', text: 'Your portfolio is outperforming benchmark by 4%', type: 'positive' },
                { icon: '⚠️', text: 'Consider reducing HDFC Bank concentration', type: 'warning' },
                { icon: '💡', text: 'Add IT sector exposure for better diversification', type: 'info' },
              ].map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightText}>{insight.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Mistakes to Avoid</Text>
              {[
                { icon: '❌', text: 'Avoid checking portfolio multiple times daily' },
                { icon: '❌', text: 'Don\'t sell during temporary dips' },
                { icon: '✅', text: 'Stick to your investment plan' },
              ].map((tip, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightIcon}>{tip.icon}</Text>
                  <Text style={styles.insightText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  valueCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeUp: {
    color: '#4CAF50',
  },
  changeDown: {
    color: '#F44336',
  },
  changePercent: {
    fontSize: 14,
    marginLeft: 8,
  },
  changePeriod: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  holdingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holdingLeft: {},
  holdingSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  holdingName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  holdingShares: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  holdingChange: {
    fontSize: 12,
    marginTop: 2,
  },
  holdingValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  watchlistCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchlistSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  watchlistPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  watchlistChange: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  watchlistChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tradeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tradeForm: {},
  tradeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tradeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  tradeRow: {
    flexDirection: 'row',
  },
  tradeField: {
    flex: 1,
    marginRight: 8,
  },
  tradeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tradeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
  },
  sellButton: {
    backgroundColor: '#F44336',
  },
  tradeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentTrades: {},
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderType: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  buyType: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  sellType: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  orderSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  orderQty: {
    fontSize: 12,
    color: '#666',
  },
  orderRight: {},
  orderStatus: {
    fontSize: 10,
    fontWeight: '500',
  },
  executedStatus: {
    color: '#4CAF50',
  },
  pendingStatus: {
    color: '#FF9800',
  },
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  healthNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  healthLabel: {
    fontSize: 20,
    color: '#999',
  },
  healthDesc: {
    fontSize: 12,
    color: '#666',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PortfolioScreen;
