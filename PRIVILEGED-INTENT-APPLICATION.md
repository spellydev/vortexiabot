# Vortexia — Message Content Intent Review Pack

Updated: 18 November 2026

## Current Discord threshold
Discord's June 10, 2026 guidance says privileged-intent review is required when an app reaches 10,000 unique users who can access it across all servers. This is not a 1,000-member single-server threshold. If the app has fewer than 10,000 users, Discord says intents can be enabled in the Developer Portal without applying. If the Developer Portal shows a review workflow for this app, follow that workflow. Sources: [Discord announcement](https://support-dev.discord.com/hc/en-us/articles/40281523410967-Changes-to-Privileged-Intent-Access-for-Discord-Apps), [review guide](https://support-dev.discord.com/hc/en-us/articles/6205754771351-How-do-I-get-Privileged-Intents-for-my-bot).

## Code review findings
- `index.js` currently has `GatewayIntentBits.MessageContent` commented out.
- The `Events.MessageCreate` handler contains message-driven AutoMod, custom auto-response, AI mention/reply and button-initiated paste-input paths.
- The handler ignores bot-authored messages and messages outside guilds.
- AutoMod uses in-memory short windows for message-text spam/repetition checks.
- AI is activated by mention/reply and sends the prompt to the configured provider; session context is memory-only and bounded.
- Slash command invocations do not require Message Content.

## Application text
Use the application draft on https://vortexia.top/message-content-intent/ and tailor it to the exact form shown in the Developer Portal. Do not claim a feature is enabled in production unless it is.

## Evidence required
Record real demonstrations of AutoMod, custom auto-response and mention/reply AI, plus a view of the public privacy policy. Include the current app user count and the exact Developer Portal prompt if review is requested.

## Rejection prevention checklist
1. Confirm the exact intent requested is Message Content only (unless another intent is independently required).
2. Ensure the production code and submitted description match.
3. Explain why metadata/slash commands cannot replace the text-dependent features.
4. Demonstrate opt-in AI activation and message-triggered features with real screens/video.
5. Publish and verify the Privacy Policy URL.
6. State accurately what is processed in memory, what is persisted, and which AI provider receives prompts.
7. Do not claim automatic deletion periods that are not implemented.
