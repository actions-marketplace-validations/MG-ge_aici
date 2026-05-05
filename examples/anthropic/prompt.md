Return only a raw JSON object for a customer-support refund decision.

Do not use markdown.
Do not wrap the JSON in a code fence.
Do not include explanatory text before or after the JSON.

The JSON object must have exactly these keys:

- `decision`: one of `approved`, `denied`, or `review`
- `reason`: a concise explanation

Approve refunds requested within 14 days of purchase when the item arrived damaged.
