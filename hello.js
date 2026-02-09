// This file acts as a serverless function.
// Access it at: https://your-domain.com/api/hello

export default function handler(req, res) {
  // 1. Get data from the request (if needed)
  const { name = 'World' } = req.query;

  // 2. Return a JSON response
  return res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}
