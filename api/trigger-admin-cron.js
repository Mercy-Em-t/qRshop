export default async function handler(req, res) {
  // If Vercel is validating the cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const supabaseEdgeUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/admin-cron-report`;
  
  try {
     const response = await fetch(supabaseEdgeUrl, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.CRON_SECRET}`,
         'Content-Type': 'application/json'
       }
     });

     const data = await response.json();
     res.status(200).json(data);
  } catch (err) {
     res.status(500).json({ error: 'Failed to trigger Supabase edge function' });
  }
}
