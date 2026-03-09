export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Webhook endpoint. POST only.', { status: 405 });
    }

    try {
      const payload = await request.json();
      const events = payload.events || [payload];

      for (const event of events) {
        if (event.type === 'order.completed') {
          const data = event.data;
          const orderId = data.reference || data.id || 'unknown';
          const email = data.customer?.email || data.account?.contact?.email || data.account?.email || 'unknown';
          const total = data.totalDisplay || data.total || '$?.??';
          const currency = data.currency || 'USD';

          const items = (data.items || []).map(function(item) {
            return (item.product || item.display || 'unknown') + ' x' + (item.quantity || 1);
          }).join(', ');

          console.log(`[order.completed] #${orderId} | ${email} | ${total} ${currency} | ${items}`);
        }

        if (event.type === 'subscription.activated') {
          const data = event.data;
          const product = data.product?.product || data.product || data.display || 'unknown';
          const email = data.account?.contact?.email || data.account?.email || 'unknown';
          const price = data.priceDisplay || '$?.??';
          const interval = data.intervalUnit || 'unknown';

          console.log(`[subscription.activated] ${product} | ${email} | ${price}/${interval}`);
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
