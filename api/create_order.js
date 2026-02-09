const Razorpay = require('razorpay');

// This API endpoint will be accessible at: /api/create_order
export default async function handler(req, res) {
  if (req.method === 'POST') {
    
    // 1. Initialize Razorpay with environment variables
    // NEVER hardcode your Secret Key here!
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 2. Define Order Options
    const options = {
      amount: 100, // ₹1 = 100 paise
      currency: 'INR',
      receipt: 'receipt_' + Math.random().toString(36).substring(7),
    };

    try {
      // 3. Create Order via Razorpay
      const order = await razorpay.orders.create(options);
      
      // 4. Send Order ID back to Frontend
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    // Block non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
