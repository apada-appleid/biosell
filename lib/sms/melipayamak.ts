class MelipayamakService {
  private token: string;

  constructor(token?: string) {
    // Use environment variable as default, with fallback to provided parameter
    this.token = token || process.env.MELIPAYAMAK_TOKEN || '';

    if (!this.token) {
      throw new Error('Melipayamak token is required');
    }
  }

  async sendSMS(to: string | string[], text: string, from?: string) {
    try {
      // For OTP endpoint, we only need the recipient number
      const recipient = Array.isArray(to) ? to[0] : to;
      
      const url = `https://console.melipayamak.com:443/api/send/otp/${this.token}`;
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: recipient })
      };

      console.log('Melipayamak URL:', url);
      console.log('Melipayamak Request Data:', { to: recipient });
      
      const response = await fetch(url, options);

      console.log('Melipayamak Response Status:', response.status);
      console.log('Melipayamak Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('Response not OK, trying text response...');
        const textResponse = await response.text();
        console.log('Melipayamak Text Response:', textResponse);
        throw new Error(`HTTP error! status: ${response.status}, response: ${textResponse}`);
      }

      const result = await response.json();
      console.log('Melipayamak Response Data:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async getCredit() {
    try {
      // For credit endpoint, we might need to use a different endpoint
      // This is a placeholder - we'll need to find the correct credit endpoint
      const url = `https://console.melipayamak.com:443/api/credit/${this.token}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const textResponse = await response.text();
        console.log('Credit API Text Response:', textResponse);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Melipayamak Credit Response:', result);
      return result;
    } catch (error) {
      console.error('Error getting credit:', error);
      throw new Error('Failed to get credit');
    }
  }
}

export default MelipayamakService; 