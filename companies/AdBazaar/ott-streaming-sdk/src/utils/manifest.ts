interface ManifestOptions {
  contentId: string;
  streams: {
    url: string;
    type: 'hls' | 'dash';
    quality: string;
    bitrate: number;
  }[];
  drm: {
    widevine: boolean;
    fairplay: boolean;
  };
  cdn: string;
}

export function generateHLSMasterManifest(options: ManifestOptions): string {
  const { streams } = options;
  const hlsStreams = streams.filter((s) => s.type === 'hls');

  const variants = hlsStreams.map((stream) => {
    return `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=${stream.bitrate},RESOLUTION=${getResolution(stream.quality)},NAME="${stream.quality}"
${stream.url}`;
  });

  return `#EXTM3U
#EXT-X-VERSION:4
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
${variants.join('\n')}
`;
}

export function generateDASHManifest(options: ManifestOptions): string {
  const { streams, drm } = options;
  const dashStreams = streams.filter((s) => s.type === 'dash');

  const representations = dashStreams.map((stream, index) => {
    return `      <Representation id="${index}" bandwidth="${stream.bitrate}" width="${getWidth(stream.quality)}" height="${getHeight(stream.quality)}">
        <BaseURL>${stream.url}</BaseURL>
        <SegmentBase indexRange="${getIndexRange(stream.quality)}"/>
      </Representation>`;
  });

  const drmElements = generateDRMElements(drm);

  return `<?xml version="1.0" encoding="UTF-8"?>
<MPD type="static" mediaPresentationDuration="PT3600S" minBufferTime="PT5S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
  <Period>
    <AdaptationSet mimeType="video/mp4" ${drm ? 'contentProtection=' + drmElements : ''}>
${representations.join('\n')}
    </AdaptationSet>
  </Period>
</MPD>`;
}

function getResolution(quality: string): string {
  const resolutions: Record<string, string> = {
    '4K': '3840x2160',
    '1080p': '1920x1080',
    '720p': '1280x720',
    '480p': '854x480',
    '360p': '640x360',
  };
  return resolutions[quality] || '1920x1080';
}

function getWidth(quality: string): number {
  const widths: Record<string, number> = {
    '4K': 3840,
    '1080p': 1920,
    '720p': 1280,
    '480p': 854,
    '360p': 640,
  };
  return widths[quality] || 1920;
}

function getHeight(quality: string): number {
  const heights: Record<string, number> = {
    '4K': 2160,
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
    '360p': 360,
  };
  return heights[quality] || 1080;
}

function getIndexRange(quality: string): string {
  const ranges: Record<string, string> = {
    '4K': '0-999',
    '1080p': '0-899',
    '720p': '0-799',
    '480p': '0-699',
    '360p': '0-599',
  };
  return ranges[quality] || '0-899';
}

function generateDRMElements(drm: { widevine: boolean; fairplay: boolean }): string {
  const elements: string[] = [];

  if (drm.widevine) {
    elements.push('<ContentProtection schemeIdUri="urn:uuid:e2726c20-a6fc-11df-83c0-12313b1c4e64"/>');
  }

  if (drm.fairplay) {
    elements.push('<ContentProtection schemeIdUri="urn:uuid:94ce73d3-5e9b-4c2e-9b7e-2f1a7e2b3c4d"/>');
  }

  return elements.join(' ');
}