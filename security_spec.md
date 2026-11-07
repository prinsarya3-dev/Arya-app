# Dyad Messenger Security Specification

## 1. Data Invariants

1. **Strict Two-User Access Gate**:
   - Access to `/messages/{messageId}` and `/chat_config/{configId}` is granted strictly and exclusively to the two registered UIDs or whitelisted emails.
   - Any third authenticated user attempting read or write must receive `PERMISSION_DENIED`.

2. **Immutable Identity**:
   - Message `senderUid` must strictly match `request.auth.uid`.
   - User 1 cannot forge messages claiming to be User 2, and vice versa.

3. **Temporal Integrity & Mandatory 5-Day TTL**:
   - `createdAt` on create must equal `request.time`.
   - `expireAt` must be set to `request.time + duration.value(5, 'd')`.
   - Expired messages cannot be resurrected or modified.

4. **Slot Locking**:
   - Once User 2 claims their slot or User 2 UID is saved in `chat_config/dyad`, neither `user1Uid` nor `user2Uid` can be overwritten by unauthorized parties.

5. **Size & Input Constraints**:
   - Message text must be non-empty and at most 2,000 characters.
   - Display name must be at most 64 characters.
   - Emoji reactions must be at most 16 characters.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Ghost User Write)**: An authenticated user with UID `attacker_uid` (not matching user1Uid or user2Uid) attempts to create a message in `/messages`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Sender Spoofing)**: User 1 (`user1Uid`) attempts to write a message with `senderUid: "user2Uid"`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Oversized Message / Denial of Wallet)**: User 1 writes a message containing a 100KB string payload (exceeding 2,000 chars). Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Client Timestamp Tampering)**: User 1 submits a message with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Eternal Expiry Bypass)**: User 1 submits `expireAt: "2099-01-01T00:00:00Z"` trying to circumvent the 5-day expiration constraint. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Shadow Key Injection)**: User 1 submits a message with extra keys like `{ adminSecret: true, deleted: false }`. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Unauthenticated Read)**: An unauthenticated visitor queries `/messages`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Third User Config Hijack)**: An attacker attempts to overwrite `/chat_config/dyad` with their own `user1Uid`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (User 2 Slot Overwrite)**: A third user attempts to overwrite an already claimed `user2Uid` in `/chat_config/dyad`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Unauthorized Message Update)**: User 2 attempts to change the `text` of User 1's sent message. Expected: `PERMISSION_DENIED` (only reaction or readBy can be modified by the recipient).
11. **Payload 11 (Path Traversal / Malformed Document ID)**: An attacker requests document with ID `../../secrets` (violating `isValidId`). Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Self-Assigned Admin Role)**: An attacker tries to write to `/admins` or self-assign escalated privileges. Expected: `PERMISSION_DENIED`.
