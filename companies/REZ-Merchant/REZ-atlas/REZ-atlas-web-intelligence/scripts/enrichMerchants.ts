/**
 * Script to enrich REZ Atlas merchants with web intelligence
 *
 * Usage:
 *   npx tsx scripts/enrichMerchants.ts
 *   npx tsx scripts/enrichMerchants.ts --limit 50
 */

import { AtlasWebIntelligenceBridge } from '../src/index';

const WEB_INTELLIGENCE_URL = process.env.WEB_INTELLIGENCE_URL || 'http://localhost:4595';

async function main() {
  console.log('🔍 REZ Atlas Web Intelligence Enrichment\n');
  console.log(`Web Intelligence: ${WEB_INTELLIGENCE_URL}\n`);

  const bridge = new AtlasWebIntelligenceBridge();

  // Demo merchant
  const demoMerchantUrl = 'https://www.google.com';

  console.log(`📊 Enriching: ${demoMerchantUrl}\n`);

  try {
    // Get merchant intelligence
    console.log('⏳ Fetching web intelligence...');
    const intelligence = await bridge.getMerchantIntelligence('demo-merchant', demoMerchantUrl);

    console.log('\n📋 Results:\n');

    console.log('🌐 Web Presence:');
    console.log(`  - Website: ${intelligence.webPresence.hasWebsite ? '✅' : '❌'}`);
    console.log(`  - Google: ${intelligence.webPresence.hasGoogleListing ? '✅' : '❌'}`);
    console.log(`  - Zomato: ${intelligence.webPresence.hasZomato ? '✅' : '❌'}`);
    console.log(`  - Swiggy: ${intelligence.webPresence.hasSwiggy ? '✅' : '❌'}`);
    console.log(`  - Visibility Score: ${intelligence.webPresence.searchVisibility}/100`);

    console.log('\n📰 News:');
    console.log(`  - Articles found: ${intelligence.news.length}`);
    if (intelligence.news.length > 0) {
      console.log(`  - Latest: ${intelligence.news[0].title.slice(0, 60)}...`);
    }

    console.log('\n🔗 Social:');
    const socialCount = Object.values(intelligence.social).filter(Boolean).length;
    console.log(`  - Social profiles: ${socialCount}`);
    if (intelligence.social.facebook) console.log(`  - Facebook: ✅`);
    if (intelligence.social.instagram) console.log(`  - Instagram: ✅`);
    if (intelligence.social.twitter) console.log(`  - Twitter: ✅`);

    console.log('\n🏢 Competitors:');
    console.log(`  - Found: ${intelligence.competitors.length}`);

    // Generate signals
    console.log('\n🎯 Signals:');
    const { signals, score } = await bridge.updateAtlasSignals('demo-merchant', demoMerchantUrl);
    console.log(`  - Score modifier: ${score > 0 ? '+' : ''}${score}`);
    console.log('  - Active signals:');
    signals.forEach(signal => console.log(`    - ${signal}`));

    console.log('\n✅ Enrichment complete!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure Web Intelligence is running:');
    console.log('  cd hojai-ai/services/hojai-web-intelligence && npm run dev\n');
  }
}

main();
