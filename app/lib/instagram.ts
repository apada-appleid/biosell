import axios from 'axios';
import { Product } from '../types';

// This would be configured with your Instagram API credentials
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

interface InstagramMedia {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

export const instagramClient = {
  /**
   * Fetch posts from Instagram Graph API
   * This requires an Instagram Business or Creator account
   */
  fetchPosts: async (): Promise<InstagramMedia[]> => {
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      throw new Error('Instagram API credentials not configured');
    }
    
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media`,
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
      
      const captionLines = post.caption.split('\n');
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
        description: post.caption,
        price: price,
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
  }
}; 