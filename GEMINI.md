# TOON Extension for Gemini CLI

This extension provides tools to work with **TOON (Token Oriented Object Notation)**, a token-efficient alternative to JSON.

## Why use TOON?
- **Token Efficiency:** Reduces token usage by 40-60% compared to JSON.
- **Cost Reduction:** Lower token usage directly translates to lower costs for API calls.
- **Context Management:** Allows you to include larger datasets within the model's context window.

## Available Tools
- `toon_encode`: Use this to convert large JSON arrays of objects (like database results or log exports) into TOON format before injecting them into the conversation.
- `toon_decode`: Use this to convert a TOON string back into a standard JSON array if you need to process it further as structured data.

## Best Practices
1. **Large Datasets:** Always prefer `toon_encode` for arrays with more than 5 items.
2. **Read-Only Context:** TOON is excellent for providing reference data to the model.
3. **Avoid for Outputs:** Do not ask the model to generate TOON as its primary response format unless explicitly requested, as models are better trained on JSON for structured output.
