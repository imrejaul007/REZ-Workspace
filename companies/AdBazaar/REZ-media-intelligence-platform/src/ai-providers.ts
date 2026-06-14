/**
 * AI Providers Integration
 * Real integrations with OpenAI, ElevenLabs, HeyGen, Runway, Flux
 *
 * This file contains actual API calls to external AI providers
 */

import axios from 'axios';

// ============================================
// OPENAI - Text & Image Generation
// ============================================

export class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate text (captions, scripts, ad copy)
   */
  async generateText(prompt: string, maxTokens = 500): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert marketing copywriter for Indian businesses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error('OpenAI text error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate image (product photos, banners)
   */
  async generateImage(prompt: string, size = '1024x1024'): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: 'dall-e-3',
          prompt,
          size,
          n: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].url;
    } catch (error: any) {
      logger.error('OpenAI image error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate caption for social media
   */
  async generateCaption(brand: any, product: any, platform: string): Promise<string> {
    const prompt = `Generate an engaging ${platform} caption for:
Brand: ${brand.name}
Industry: ${brand.industry}
Tone: ${brand.tone}
${product ? `Product: ${product.name} - ${product.description}` : ''}

Requirements:
- Catchy hook in first line
- Relevant emojis
- 3-5 trending hashtags
- Call to action
- Max 150 characters for caption`;

    return this.generateText(prompt, 300);
  }

  /**
   * Generate reel script
   */
  async generateReelScript(brand: any, product: any, goal: string): Promise<any> {
    const prompt = `Generate a 30-second reel script for ${platform || 'Instagram'}.

Brand: ${brand.name}
Industry: ${brand.industry}
Tone: ${brand.tone}
${product ? `Product: ${product.name} - ${product.description}` : ''}
Goal: ${goal}

Return JSON with:
{
  "hook": "First 3 seconds - attention grabber",
  "body": "Main content - what to show",
  "cta": "End screen - what to do next",
  "music": "Suggested trending audio",
  "textOverlays": ["Text to show on screen"]
}`;

    const result = await this.generateText(prompt, 500);
    try {
      return JSON.parse(result);
    } catch {
      return { hook: result.split('\n')[0], body: result, cta: 'Follow for more!' };
    }
  }

  /**
   * Generate ad copy
   */
  async generateAdCopy(brand: any, product: any, platform: string): Promise<any> {
    const prompt = `Generate ad copy for ${platform}.

Brand: ${brand.name}
${product ? `Product: ${product.name} - ${product.description} - ₹${product.price}` : ''}

Return JSON:
{
  "headline": "Attention-grabbing headline (max 40 chars)",
  "description": "Supporting text (max 80 chars)",
  "cta": "Button text",
  "variations": ["Alternative headline 1", "Alternative headline 2"]
}`;

    const result = await this.generateText(prompt, 400);
    try {
      return JSON.parse(result);
    } catch {
      return { headline: 'Special Offer!', description: 'Limited time only', cta: 'Shop Now' };
    }
  }
}

// ============================================
// ELEVENLABS - Voice Generation
// ============================================

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(text: string, voiceId = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('ElevenLabs error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      return response.data.voices;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate voice for UGC ad
   */
  async generateUGCVoice(script: string, style = 'friendly'): Promise<Buffer> {
    // Voice IDs for different styles
    const voiceIds: Record<string, string> = {
      friendly: 'XB0fDUnXhr5KVfLyKQE1', // Male, friendly
      professional: '21m00Tcm4TlvDq8ikWAM', // Rachel, professional
      young: 'zrHiDhphv9CwGzN7RQUn', // Male, young
      female: 'EXAVITQu4vr4xnSDxMaL' // Charlotte, female
    };

    const voiceId = voiceIds[style] || voiceIds.friendly;
    return this.textToSpeech(script, voiceId);
  }
}

// ============================================
// HEYGEN - AI Avatar Videos
// ============================================

export class HeyGenClient {
  private apiKey: string;
  private baseUrl = 'https://api.heygen.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create avatar video
   */
  async createAvatarVideo(script: string, avatarId = 'default'): Promise<string> {
    try {
      // Create video
      const response = await axios.post(
        `${this.baseUrl}/video/avatar`,
        {
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarId
              },
              background: {
                type: 'color',
                value: '#FFFFFF'
              },
              input_text: script,
              voice: {
                type: 'text',
                input_text: script,
                voice_id: 'YOUR_VOICE_ID' // From ElevenLabs
              }
            }
          ],
          dimension: {
            width: 1080,
            height: 1920
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.video_id;
    } catch (error: any) {
      logger.error('HeyGen error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/video/${videoId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return response.data.status; // processing, completed, failed
    } catch (error) {
      return 'failed';
    }
  }

  /**
   * Get video URL
   */
  async getVideoUrl(videoId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/video/${videoId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return response.data.url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate UGC ad video
   */
  async generateUGCAd(script: string, avatarStyle = 'founder'): Promise<any> {
    const avatarIds: Record<string, string> = {
      founder: 'founder_avatar_id',
      customer: 'customer_avatar_id',
      influencer: 'influencer_avatar_id'
    };

    const avatarId = avatarIds[avatarStyle] || avatarIds.founder;
    const videoId = await this.createAvatarVideo(script, avatarId);

    // Poll for completion
    let status = 'processing';
    let attempts = 0;
    while (status === 'processing' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await this.getVideoStatus(videoId);
      attempts++;
    }

    if (status === 'completed') {
      const url = await this.getVideoUrl(videoId);
      return { videoId, url, status };
    }

    return { videoId, status: 'failed' };
  }
}

// ============================================
// RUNWAY - Video Generation
// ============================================

export class RunwayClient {
  private apiKey: string;
  private baseUrl = 'https://api.dev.runwayml.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate image to video
   */
  async generateVideo(imageUrl: string, prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/image_to_video`,
        {
          prompt_image: imageUrl,
          prompt_text: prompt
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.task_id;
    } catch (error: any) {
      logger.error('Runway error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return response.data.status;
    } catch (error) {
      return 'failed';
    }
  }

  /**
   * Generate reel from image
   */
  async generateReelFromImage(imageUrl: string, action: string): Promise<any> {
    const taskId = await this.generateVideo(
      imageUrl,
      `Animate this product image: ${action}`
    );

    // Poll for completion
    let status = 'starting';
    while (status === 'starting' || status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 10000));
      status = await this.getTaskStatus(taskId);
    }

    if (status === 'completed') {
      // Get the video URL
      const taskResponse = await axios.get(`${this.baseUrl}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return { taskId, url: taskResponse.data.output, status };
    }

    return { taskId, status: 'failed' };
  }
}

// ============================================
// FLUX - Image Generation (Product Photoshoots)
// ============================================

export class FluxClient {
  private apiKey: string;
  private baseUrl = 'https://api.together.xyz/v1'; // Flux via Together AI

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate product photoshoot
   */
  async generateProductPhotoshoot(
    productImage: string,
    scene: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: 'black-forest-labs/FLUX.1-dev',
          prompt: `Product photography: ${scene}. Keep the product exactly the same, only change the background and setting. Professional commercial photography, high quality, detailed. Product: ${productImage}`,
          width: 1024,
          height: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].url;
    } catch (error: any) {
      logger.error('Flux error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate lifestyle images
   */
  async generateLifestyle(productName: string, style: string): Promise<string[]> {
    const scenes = [
      `${style} lifestyle setting with ${productName}`,
      `Person using ${productName} in daily life`,
      `${productName} in premium ${style} environment`
    ];

    const results = await Promise.all(
      scenes.map(scene => this.generateProductPhotoshoot(productName, scene))
    );

    return results;
  }
}

// ============================================
// Factory function
// ============================================

export function createAIClients() {
  return {
    openai: new OpenAIClient(process.env.OPENAI_API_KEY || ''),
    elevenlabs: new ElevenLabsClient(process.env.ELEVENLABS_API_KEY || ''),
    heygen: new HeyGenClient(process.env.HEYGEN_API_KEY || ''),
    runway: new RunwayClient(process.env.RUNWAY_API_KEY || ''),
    flux: new FluxClient(process.env.FLUX_API_KEY || '')
  };
}
