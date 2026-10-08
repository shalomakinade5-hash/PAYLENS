# PayPal Sandbox integration boundary

This package is reserved for the real PayPal Sandbox integration. No PayPal SDK,
credentials, authorization flow, webhook handling, or transaction data is wired
into the application yet.

The next integration should add server-side credential configuration, OAuth token
handling, verified webhooks, and a normalized transaction service here. Keep
secrets on the backend and map provider payloads into PayLens-owned models before
they reach the frontend.