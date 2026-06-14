import { vastGeneratorService } from '../services/vast-generator.service.js';
import { mockCampaign } from './campaign.service.test.js';

describe('VASTGeneratorService', () => {
  describe('generateVAST', () => {
    it('should generate valid VAST XML for a campaign with creative', () => {
      const campaign = mockCampaign as any;
      const creative = campaign.creatives![0];

      const vast = vastGeneratorService.generateVAST(campaign, creative);

      expect(vast).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(vast).toContain('<VAST version="4.2"');
      expect(vast).toContain(`<Ad id="${campaign.campaignId}">`);
      expect(vast).toContain(`<Duration>${formatDuration(creative.duration)}</Duration>`);
      expect(vast).toContain(`<![CDATA[${creative.videoUrl}]]>`);
      expect(vast).toContain(`<ClickThrough id="clickThrough">${creative.clickUrl}</ClickThrough>`);
    });

    it('should include skip offset in VAST when provided', () => {
      const campaign = mockCampaign as any;
      const creative = campaign.creatives![0];
      const skipOffset = 5;

      const vast = vastGeneratorService.generateVAST(campaign, creative, { skipOffset });

      expect(vast).toContain('<Icons>');
      expect(vast).toContain('type="skip"');
    });

    it('should not include skip offset when skipOffset is 0', () => {
      const campaign = mockCampaign as any;
      const creative = campaign.creatives![0];

      const vast = vastGeneratorService.generateVAST(campaign, creative, { skipOffset: 0 });

      expect(vast).not.toContain('<Icons>');
    });

    it('should include companion ads when provided and enabled', () => {
      const campaign = {
        ...mockCampaign as any,
        creatives: [{
          ...mockCampaign.creatives![0],
          companionAds: [{
            id: 'companion-1',
            type: 'static' as const,
            content: 'https://cdn.example.com/companion.jpg',
            clickUrl: 'https://example.com/companion-click',
            altText: 'Companion Ad',
          }],
        }],
      };

      const vast = vastGeneratorService.generateVAST(campaign, campaign.creatives![0], { companionAds: true });

      expect(vast).toContain('<CompanionAds>');
      expect(vast).toContain('companion-1');
      expect(vast).toContain('https://cdn.example.com/companion.jpg');
    });

    it('should include tracking events', () => {
      const campaign = mockCampaign as any;
      const creative = campaign.creatives![0];

      const vast = vastGeneratorService.generateVAST(campaign, creative);

      expect(vast).toContain('<TrackingEvents>');
      expect(vast).toContain('event="start"');
      expect(vast).toContain('event="firstQuartile"');
      expect(vast).toContain('event="midpoint"');
      expect(vast).toContain('event="thirdQuartile"');
      expect(vast).toContain('event="complete"');
      expect(vast).toContain('event="skip"');
    });

    it('should include ReZ extension in VAST', () => {
      const campaign = mockCampaign as any;
      const creative = campaign.creatives![0];

      const vast = vastGeneratorService.generateVAST(campaign, creative);

      expect(vast).toContain('<Extensions>');
      expect(vast).toContain('<Extension type="ReZ">');
      expect(vast).toContain(`<CampaignId>${campaign.campaignId}</CampaignId>`);
      expect(vast).toContain(`<AdvertiserId>${campaign.advertiserId}</AdvertiserId>`);
    });
  });

  describe('generatePodVAST', () => {
    it('should generate VAST with multiple creatives in a pod', () => {
      const campaign = mockCampaign as any;
      const creatives = campaign.creatives!;

      const vast = vastGeneratorService.generatePodVAST(campaign, creatives);

      expect(vast).toContain('<Ad id="pod"');
      expect(vast).toContain('<Creatives>');
      expect(vast).toContain('creative-001');
      expect(vast).toContain('creative-002');
    });

    it('should include tracking for each creative in pod', () => {
      const campaign = mockCampaign as any;
      const creatives = campaign.creatives!;

      const vast = vastGeneratorService.generatePodVAST(campaign, creatives);

      // Each creative should have its own tracking
      creatives.forEach((creative: any) => {
        expect(vast).toContain(creative.creativeId);
      });
    });
  });

  describe('generateNoVAST', () => {
    it('should generate empty VAST with error tracking URL', () => {
      const vast = vastGeneratorService.generateNoVAST();

      expect(vast).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(vast).toContain('<VAST version="4.2"');
      expect(vast).toContain('<Error>');
      expect(vast).toContain('noAdAvailable');
    });
  });

  describe('generateEmptyVAST', () => {
    it('should generate empty VAST document', () => {
      const vast = vastGeneratorService.generateEmptyVAST();

      expect(vast).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(vast).toContain('<VAST version="4.2"');
      expect(vast).toContain('<Ad id="empty">');
      expect(vast).toContain('<AdTitle>No Ad Available</AdTitle>');
    });
  });
});

// Helper function to format duration (matches service implementation)
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}