# UAE Compliant Viral App Playbook

Date: 2026-02-23
Region: United Arab Emirates

## Objective
Build a zero-build-cost app that can spread organically, make revenue, and reduce legal/IP/political exposure.

## Recommended App
Name: UAE Savings Challenge (Arabic/English)

Concept:
- Users join 7-day or 30-day money-saving challenges.
- Users share personal progress cards to WhatsApp/Instagram/TikTok.
- No open public feed, no political discussions, no reposted news, no public comments.
- Businesses can sponsor challenge prizes through a controlled partner workflow.

Why this app:
- Strong viral loop from shareable progress cards + referrals.
- Low moderation risk versus open social posting.
- Revenue options without relying on risky UGC ads.

## Zero-Cost Build Stack
- Frontend/API: Next.js on Vercel free tier.
- Database/Auth/Storage: Supabase free tier.
- CDN/edge/rate-limits: Cloudflare free tier.
- Product analytics: PostHog free tier.
- Email: free transactional tier (as available).

## Revenue Plan
1. Premium subscription:
- Advanced insights, challenge packs, export reports.

2. Sponsored challenges:
- Fixed-fee campaign placements for licensed UAE merchants.
- Paid partnerships clearly labeled as sponsored.

3. Affiliate revenue:
- Only from approved partners and with explicit disclosure.

## Viral Growth Loop
1. User completes a daily challenge step.
2. App generates a branded share card (Arabic/English).
3. Shared card includes referral code.
4. New user joins via referral and receives welcome bonus points.
5. Referrer climbs weekly leaderboard.

## UAE Compliance Controls (Operational)
Important: This is an operational checklist, not legal advice. Obtain UAE-qualified legal review before launch.

### A) Licensing and commercial setup
- Confirm business activity permits cover app operations and digital promotion.
- Keep license, shareholder, and facility docs current.
- Keep merchant contracts in writing with clear responsibilities.

### B) Consumer and commerce rules
- Show clear pricing, refund terms, and contact channels.
- Avoid deceptive claims or hidden conditions.
- Keep a complaint-handling process with response SLAs.

### C) Ads and sponsored content
- Mark paid content as Sponsored/Ad clearly.
- For influencer marketing, require permit evidence when applicable.
- Keep campaign approval records and creatives for auditability.

### D) Data protection and privacy
- Collect only required personal data.
- Use explicit consent where required.
- Provide data access, correction, and deletion workflow.
- Define retention periods and secure deletion.
- Maintain incident response runbook for breaches.

### E) Content governance (political-risk control)
- Prohibit political campaigning, political persuasion, and sensitive geopolitical debates.
- Block religious/sectarian incitement, hate, harassment, and illegal content.
- Disallow user-generated public posts by default.
- Use pre-approved template text for all share cards.

### F) IP and trademark safety
- Use only licensed fonts, photos, icons, music, and logos.
- Do not publish third-party marks without authorization.
- Keep asset license proofs in a single evidence folder.
- Add notice-and-takedown workflow for IP complaints.

### G) Security baseline
- Enable MFA for admin tools.
- Rotate secrets and keys on schedule.
- Encrypt data in transit and at rest.
- Apply least-privilege access for admins and vendors.

### H) Tax and finance operations
- Monitor VAT/corporate tax thresholds and filing obligations.
- Keep clear revenue classification for subscriptions, sponsorships, and affiliate income.
- Reconcile payouts and maintain invoice trails.

## Product Guardrails (Must-Have)
- No user-to-user public comments.
- No public posting of user text outside controlled templates.
- No auto-import of external social content.
- Hard keyword filters + manual review queue.
- One-click report and emergency content disable switch.

## Launch Checklist (30 Days)
Week 1:
- Build MVP (auth, challenge flow, share card, referral).
- Implement privacy notice and terms pages.
- Disable open UGC features.

Week 2:
- Pilot with closed beta users.
- Test moderation and incident response.
- Start onboarding licensed merchant partners.

Week 3:
- Launch sponsored challenge module with ad disclosure.
- Activate analytics for retention and referral conversion.

Week 4:
- Public launch with creator partners.
- Run weekly compliance review (content, ads, privacy, IP logs).

## Internal Policies to Create Before Public Launch
- Terms of Use.
- Privacy Notice.
- Acceptable Use Policy.
- Advertising/Sponsorship Disclosure Policy.
- IP Takedown Policy.
- Incident Response SOP.

## Decision Summary
If your goals are viral + revenue + low legal/political/IP risk, a controlled challenge app is safer than an open social feed in the UAE context.
