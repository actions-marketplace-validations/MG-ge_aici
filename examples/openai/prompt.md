Return only JSON for a customer-support refund decision.

The JSON must include:

- `decision`: one of `approved`, `rejected`, or `needs_review`
- `reason`: a concise explanation

Approve refunds requested within 14 days of purchase.
