import axios from 'axios';
import { Product } from '../types';

// This would be configured with your Instagram API credentials
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

// Instagram Graph API base URL
const GRAPH_API_BASE = 'https://graph.instagram.com';

// Instagram Basic Display API base URL
const BASIC_DISPLAY_API_BASE = 'https://api.instagram.com';

interface InstagramMedia {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

// For public profiles without authentication
interface PublicInstagramPost {
  id: string;
  caption: {
    text: string;
  };
  images: {
    standard_resolution: {
      url: string;
    };
  };
  link: string;
  created_time: string;
}

export const instagramClient = {
  /**
   * Fetch posts from Instagram Graph API
   * This requires an Instagram Business or Creator account
   */
  fetchPosts: async (): Promise<InstagramMedia[]> => {
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      // Fallback to mock data when credentials aren't configured
      return mockInstagramPosts();
    }
    
    try {
      const response = await axios.get(
        `${GRAPH_API_BASE}/${INSTAGRAM_USER_ID}/media`,
        {
          params: {
            access_token: INSTAGRAM_ACCESS_TOKEN,
            fields: 'id,caption,media_url,permalink,timestamp'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      // Fallback to mock data on error
      return mockInstagramPosts();
    }
  },
  
  /**
   * Fetch posts from a public Instagram profile
   * This uses a workaround since Instagram limited their public API
   * 
   * In a production environment, you would use:
   * 1. Facebook Graph API with proper authentication
   * 2. A scraping service that complies with Instagram's terms
   * 3. A third-party API service that provides this data
   */
  fetchPublicPosts: async (username: string): Promise<InstagramMedia[]> => {
    try {
      // This is a placeholder - in a real implementation you would:
      // 1. Use proper Instagram API with authentication
      // 2. Use a compliant third-party service
      
      console.log(`Fetching posts for @${username}`);
      
      // For demo purposes, return mock data
      return mockInstagramPosts();
    } catch (error) {
      console.error(`Error fetching public posts for @${username}:`, error);
      throw error;
    }
  },
  
  /**
   * Transform Instagram posts to product data
   * This function would parse the post captions to extract product information
   */
  convertPostsToProducts: (posts: InstagramMedia[]): Product[] => {
    return posts.map(post => {
      // In a real implementation, you would extract product details from the post caption
      // For example, parsing product name, price, etc. from a structured caption format
      
      // Example caption format:
      // Product: Blue Denim Jacket
      // Price: $79.99
      // Available: Yes
      
      const captionLines = post.caption ? post.caption.split('\n') : [];
      const titleLine = captionLines.find(line => line.startsWith('Product:')) || '';
      const priceLine = captionLines.find(line => line.startsWith('Price:')) || '';
      const availableLine = captionLines.find(line => line.startsWith('Available:')) || '';
      
      const title = titleLine.replace('Product:', '').trim();
      const priceStr = priceLine.replace('Price: $', '').trim();
      const price = parseFloat(priceStr) || 0;
      const available = availableLine.toLowerCase().includes('yes');
      
      return {
        id: post.id,
        title: title || 'Unknown Product',
        description: post.caption || '',
        price: price || 99.99, // Default price if not specified
        imageUrl: post.media_url,
        instagramPostUrl: post.permalink,
        available: available,
        createdAt: post.timestamp
      };
    });
  },
  
  /**
   * Full process to fetch and transform Instagram posts to products
   */
  getProductsFromInstagram: async (): Promise<Product[]> => {
    try {
      const posts = await instagramClient.fetchPosts();
      return instagramClient.convertPostsToProducts(posts);
    } catch (error) {
      console.error('Error getting products from Instagram:', error);
      throw error;
    }
  },
  
  /**
   * Get products from a public Instagram profile
   */
  getProductsFromPublicProfile: async (username: string): Promise<Product[]> => {
    try {
      const posts = await instagramClient.fetchPublicPosts(username);
      return instagramClient.convertPostsToProducts(posts);
    } catch (error) {
      console.error(`Error getting products from @${username}:`, error);
      throw error;
    }
  }
};

/**
 * Mock Instagram posts for development and demonstration
 */
function mockInstagramPosts(): InstagramMedia[] {
  return [
    {
      id: '1',
      caption: 'Product: Blue Denim Jacket\nPrice: $79.99\nAvailable: Yes\nThis classic blue denim jacket is perfect for any casual outfit.',
      media_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
      permalink: 'https://www.instagram.com/p/sample1/',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      caption: 'Product: White Sneakers\nPrice: $59.99\nAvailable: Yes\nMinimalist white sneakers that go with everything.',
      media_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
      permalink: 'https://www.instagram.com/p/sample2/',
      timestamp: new Date().toISOString()
    },
    {
      id: '3',
      caption: 'Product: Black Leather Bag\nPrice: $129.99\nAvailable: Yes\nStylish black leather bag with gold hardware.',
      media_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
      permalink: 'https://www.instagram.com/p/sample3/',
      timestamp: new Date().toISOString()
    },
    {
      id: '4',
      caption: 'Product: Round Sunglasses\nPrice: $39.99\nAvailable: Yes\nVintage-inspired round sunglasses with UV protection.',
      media_url: 'https://images.unsplash.com/photo-1577803645773-f96470509666',
      permalink: 'https://www.instagram.com/p/sample4/',
      timestamp: new Date().toISOString()
    }
  ];
} 