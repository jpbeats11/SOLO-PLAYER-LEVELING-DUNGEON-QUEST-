# Security Specification

## Data Invariants
1. A user can only access their own profile data.
2. The user profile document ID must match the authenticated user's UID.
3. Level and currency cannot be negative.
4. `createdAt` must be immutable.
5. `updatedAt` must be set to server time on every update.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than the auth token.
2. **Identity Theft**: Auth user A tries to read user B's profile.
3. **Identity Theft (Write)**: Auth user A tries to update user B's profile.
4. **Invalid Name**: Profile name is too long (> 100 characters).
5. **Level Injection**: Setting level to a huge number directly.
6. **Currency Injection**: Setting gold to 1,000,000,000 without playing.
7. **Bypassing Stats**: Setting STR to 9999 manually.
8. **Shadow Field Injection**: Adding `isAdmin: true` to the user profile.
9. **Orphaned Writes**: (N/A for single document profile).
10. **State Shortcut**: (N/A for single document profile).
11. **Negative Value Poisoning**: Setting gold to -100.
12. **Immutable Field Modification**: Attempting to change `createdAt`.

## The Test Runner (firestore.rules.test.ts)
(Implementation would follow here, focusing on checking 'PERMISSION_DENIED' for the above).
