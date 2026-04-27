const { ChargilyClient } = require('@chargily/chargily-pay');
const crypto = require('crypto');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const client = new ChargilyClient({
  api_key: config.chargily.secretKey || 'test_secret', // Chargily Server uses Secret key for v2 API
  mode: config.env === 'production' ? 'live' : 'test'
});

const createCheckout = async (booking) => {
  try {
    const checkout = await client.createCheckout({
      amount: booking.depositAmount, 
      currency: 'dzd',
      success_url: `${config.clientUrl}/bookings/${booking._id}/success`,
      failure_url: `${config.clientUrl}/bookings/${booking._id}/failure`,
      webhook_endpoint: `${config.apiUrl}/api/v1/payments/webhook`,
      description: `Deposit for booking ${booking._id}`,
      metadata: [
        { booking_id: booking._id.toString() },
        { client_id: booking.client.toString() },
        { provider_id: booking.provider.toString() }
      ]
    });

    return checkout; // contains checkout_url and id
  } catch (error) {
    throw new ApiError(500, `Chargily Checkout Error: ${error.message}`);
  }
};

const verifySignature = (payload, signature) => {
  if (!signature) return false;
  
  const computedSignature = crypto
    .createHmac('sha256', config.chargily.secretKey)
    .update(payload)
    .digest('hex');
    
  return computedSignature === signature;
};

module.exports = {
  createCheckout,
  verifySignature
};
