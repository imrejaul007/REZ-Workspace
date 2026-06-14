import { CTVCampaign, CTVCreative } from '../types/index.js';
import { config } from '../config/index.js';

interface VASTOptions {
  skipOffset?: number;
  podPosition?: number;
  companionAds?: boolean;
  trackingEvents?: boolean;
}

class VASTGeneratorService {
  private readonly version: string;

  constructor() {
    this.version = config.vast.version;
  }

  generateVAST(campaign: CTVCampaign, creative: CTVCreative, options: VASTOptions = {}): string {
    const { skipOffset = config.adDecision.defaultSkipOffset, podPosition = 1, companionAds = true } = options;

    const trackingBaseUrl = this.getTrackingBaseUrl(campaign.campaignId, creative.creativeId);
    const skipTime = this.formatDuration(skipOffset);

    return this.buildVASTDocument(campaign, creative, {
      skipOffset,
      skipTime,
      podPosition,
      companionAds,
      trackingBaseUrl,
 });
  }

  generatePodVAST(campaign: CTVCampaign, creatives: CTVCreative[], options: VASTOptions = {}): string {
    const { skipOffset = config.adDecision.defaultSkipOffset, companionAds = true } = options;
    const trackingBaseUrl = this.getTrackingBaseUrl(campaign.campaignId, '');

    let adElements = '';

    creatives.forEach((creative, index) => {
      const position = index + 1;
      const trackingUrl = this.getTrackingBaseUrl(campaign.campaignId, creative.creativeId);
      const skipTime = this.formatDuration(skipOffset);

      adElements += this.buildAdElement(campaign, creative, {
        skipOffset,
        skipTime,
        podPosition: position,
        companionAds,
        trackingBaseUrl: trackingUrl,
      });
    });

    return this.buildPodVASTDocument(adElements);
  }

  private buildVASTDocument(
    campaign: CTVCampaign,
    creative: CTVCreative,
    options: {
      skipOffset: number;
      skipTime: string;
      podPosition: number;
      companionAds: boolean;
      trackingBaseUrl: string;
    }
  ): string {
    const { skipOffset, skipTime, companionAds, trackingBaseUrl } = options;

    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${this.version}" xmlns="http://www.iab.com/VAST/4.2">
  <Ad id="${campaign.campaignId}" sequence="${options.podPosition}">
    <InLine>
      <AdTitle>${this.escapeXml(creative.name)}</AdTitle>
      <Creatives>
<Creative id="${creative.creativeId}" sequence="${options.podPosition}">
          <Linear>
<Duration>${this.formatDuration(creative.duration)}</Duration>
            <TrackingEvents>
              <Tracking event="start">${trackingBaseUrl}/start</Tracking>
              <Tracking event="firstQuartile">${trackingBaseUrl}/firstQuartile</Tracking>
              <Tracking event="midpoint">${trackingBaseUrl}/midpoint</Tracking>
              <Tracking event="thirdQuartile">${trackingBaseUrl}/thirdQuartile</Tracking>
              <Tracking event="complete">${trackingBaseUrl}/complete</Tracking>
              <Tracking event="skip">${trackingBaseUrl}/skip</Tracking>
              <Tracking event="pause">${trackingBaseUrl}/pause</Tracking>
              <Tracking event="resume">${trackingBaseUrl}/resume</Tracking>
              <Tracking event="rewind">${trackingBaseUrl}/rewind</Tracking>
<Tracking event="mute">${trackingBaseUrl}/mute</Tracking>
              <Tracking event="unmute">${trackingBaseUrl}/unmute</Tracking>
<Tracking event="fullscreen">${trackingBaseUrl}/fullscreen</Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough id="clickThrough">${creative.clickUrl}</ClickThrough>
              <ClickTracking id="clickTracking">${trackingBaseUrl}/click</ClickTracking>
            </VideoClicks>
            ${skipOffset > 0 ? `<Icons><Icon type="skip"><![CDATA[${trackingBaseUrl}/icon]]></Icon></Icons>` : ''}
            <MediaFiles>
              <MediaFile id="${creative.creativeId}" type="${creative.mimeType || 'video/mp4'}" bitrate="${creative.bitrate || 2000}" width="${creative.width || 1920}" height="${creative.height || 1080}" delivery="progressive">
                <![CDATA[${creative.videoUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
          ${companionAds && creative.companionAds ? this.buildCompanionAds(creative.companionAds, trackingBaseUrl) : ''}
        </Creative>
      </Creatives>
      <Impression id="adImpression">${trackingBaseUrl}/impression</Impression>
      <Extensions>
        <Extension type="ReZ">
          <CampaignId>${campaign.campaignId}</CampaignId>
          <AdvertiserId>${campaign.advertiserId}</AdvertiserId>
          <BidAmount>${campaign.bid.amount}</BidAmount>
          <BidType>${campaign.bid.type}</BidType>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;
  }

  private buildPodVASTDocument(adElements: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${this.version}" xmlns="http://www.iab.com/VAST/4.2">
  <Ad id="pod" sequence="1">
    <InLine>
      <AdTitle>Ad Pod</AdTitle>
      <Creatives>
        ${adElements}
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;
  }

  private buildAdElement(
    campaign: CTVCampaign,
    creative: CTVCreative,
    options: {
      skipOffset: number;
      skipTime: string;
      podPosition: number;
      companionAds: boolean;
      trackingBaseUrl: string;
    }
  ): string {
    const { skipOffset, companionAds, trackingBaseUrl } = options;

    return `
        <Creative id="${creative.creativeId}" sequence="${options.podPosition}">
          <Linear>
            <Duration>${this.formatDuration(creative.duration)}</Duration>
            <TrackingEvents>
              <Tracking event="start">${trackingBaseUrl}/start</Tracking>
              <Tracking event="firstQuartile">${trackingBaseUrl}/firstQuartile</Tracking>
              <Tracking event="midpoint">${trackingBaseUrl}/midpoint</Tracking>
              <Tracking event="thirdQuartile">${trackingBaseUrl}/thirdQuartile</Tracking>
              <Tracking event="complete">${trackingBaseUrl}/complete</Tracking>
              <Tracking event="skip">${trackingBaseUrl}/skip</Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough id="clickThrough">${creative.clickUrl}</ClickThrough>
              <ClickTracking id="clickTracking">${trackingBaseUrl}/click</ClickTracking>
            </VideoClicks>
            <MediaFiles>
              <MediaFile id="${creative.creativeId}" type="${creative.mimeType || 'video/mp4'}" bitrate="${creative.bitrate || 2000}" width="${creative.width || 1920}" height="${creative.height || 1080}" delivery="progressive">
                <![CDATA[${creative.videoUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
          ${companionAds && creative.companionAds ? this.buildCompanionAds(creative.companionAds, trackingBaseUrl) : ''}
        </Creative>`;
  }

  private buildCompanionAds(
    companions: CTVCreative['companionAds'],
    trackingBaseUrl: string
  ): string {
    if (!companions || companions.length === 0) {
      return '';
    }

    let companionXml = '<CompanionAds>';

    companions.forEach((companion) => {
      if (companion.type === 'static') {
        companionXml += `
          <Companion id="${companion.id}" width="300" height="250" expandedWidth="300" expandedHeight="250">
            <StaticResource creativeType="image/jpeg">
              <![CDATA[${companion.content}]]>
            </StaticResource>
            <AltText>${this.escapeXml(companion.altText || '')}</AltText>
            <CompanionClickThrough id="companionClick">${companion.clickUrl}</CompanionClickThrough>
            <TrackingEvents>
              <Tracking event="creativeView">${trackingBaseUrl}/companion/creativeView</Tracking>
            </TrackingEvents>
          </Companion>`;
      } else {
        companionXml += `
          <Companion id="${companion.id}" width="300" height="250">
            <HTMLResource><![CDATA[${companion.content}]]></HTMLResource>
            <CompanionClickThrough id="companionClick">${companion.clickUrl}</CompanionClickThrough>
          </Companion>`;
      }
    });

    companionXml += '</CompanionAds>';
    return companionXml;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, ''');
  }

  private getTrackingBaseUrl(campaignId: string, creativeId: string): string {
    const baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:4702/api/track';
    return `${baseUrl}/${campaignId}/${creativeId}`;
  }

  generateNoVAST(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${this.version}" xmlns="http://www.iab.com/VAST/4.2">
  <Error><![CDATA[${process.env.TRACKING_BASE_URL || 'http://localhost:4702'}/api/track/error?reason=noAdAvailable]]></Error>
</VAST>`;
  }

  generateEmptyVAST(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${this.version}" xmlns="http://www.iab.com/VAST/4.2">
  <Ad id="empty">
    <InLine>
      <AdTitle>No Ad Available</AdTitle>
      <Creatives/>
    </InLine>
  </Ad>
</VAST>`;
  }
}

export const vastGeneratorService = new VASTGeneratorService();
