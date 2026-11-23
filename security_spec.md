# Security Specification (`firestore.rules`)

## 1. Data Invariants
- All collections require Firebase Authentication (`request.auth != null`) and verified email (`request.auth.token.email_verified == true`), except single-document connectivity checks on `/test/{docId}` (`get` only).
- Document IDs must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters (`isValidId(id)`), except `/staffAccess/{staffEmail}` which enforces valid lowercase email IDs (`isValidEmailDocId`).
- Every user-owned write for non-admins enforces `ownerUid == request.auth.uid` on creation and immutability of `ownerUid` on update.
- Admin privilege is determined via `request.auth.token.email == 'bmtdanainsani@gmail.com'` (with `email_verified == true`) or existence of `/admins/$(request.auth.uid)` (bootstrapped atomically once via immutable `/workspaceMeta/owner` or granted to verified `super_admin` staff).
- Staff operational access for multi-device workflow collaboration is granted via `/staffAccess/$(emailLower)` managed exclusively by admins.
- `users` documents enforce PII isolation: non-admins can only read their own document and cannot escalate their `role`.
- `applications` documents lock terminal states (`approved`, `rejected`) from non-admin `status` edits while allowing post-approval disbursement/risk workflow updates by verified staff.
- `auditLogs` are append-only (`update` and `delete` strictly denied).
- `checklistConfig`, `scoringConfig`, and `settings` are readable by verified users and writable only by admins.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated `list` on `/users`.
2. Unauthenticated `create` on `/auditLogs/log-1`.
3. Spoofed email (`email == 'bmtdanainsani@gmail.com'`, `email_verified == false`) attempting `list` on `/users`.
4. Non-admin `create` on `/users/usr-evil` with `role: 'super_admin'`.
5. Non-admin `update` on `/users/usr-self` adding ghost field `isAdmin: true`.
6. Non-admin `get` on another user's `/users/usr-other` PII record.
7. Non-admin `create` on `/applications/app-1` with `ownerUid` set to another UID.
8. Non-admin `update` on `/applications/app-1` when `status == 'approved'` (terminal state lock).
9. Non-admin `update` on `/auditLogs/log-1` (append-only violation).
10. Non-admin `delete` on `/applications/app-1`.
11. Oversized document ID (`> 128` chars) on `/applications/{id}`.
12. Non-admin `create` on `/scoringConfig/scoring-config-bmt`.
