# Vortexia Data Inventory (source review)

This inventory is based on the supplied Vortexia 5.1.1 source package. Re-check it whenever features or providers change.

| Data category | Examples found in source | Purpose | Storage noted in source |
|---|---|---|---|
| Discord IDs/profile metadata | user/server/channel/role IDs, usernames | commands, permissions, feature records | persistent records for selected features |
| Moderation records | warnings, strikes, automod settings | moderation and server safety | JSON data files |
| Invite tracking | member ID, username, inviter ID, invite code, timestamps, fake/rejoin flags | invite attribution and anti-abuse | JSON data files; history limit configurable |
| AFK | user ID, reason, timestamp | AFK status and replies | JSON data file |
| Leveling/economy/tickets | XP, balances, ticket state/config | requested bot features | JSON/module storage |
| Message text | content for automod, auto-response, AI mention/reply, pending input | deliver message-driven features | short-lived in-memory buffers/session context in reviewed paths; AI prompt sent to configured provider |
| Website request logs | IP/user agent/time may be processed | hosting/security | hosting provider controls retention |

The source package does not define a universal deletion schedule for all persistent records. Do not claim one until implemented and tested.
