# SuperPrompt - User Stories

## Implementation Notes (Current)

### UI Implementation Changes

1. **Preview Display**:
   - 150 characters maximum with "..." truncation
   - Data is trimmed at source, not UI-clamped

2. **Search & Filters**:
   - Bottom search bar (fixed at bottom of screen)
   - 3 rows: Applied filters, Search+dropdowns, Category chips
   - URL-based search params for shareable links
   - Categories in uppercase with horizontal scroll

3. **Card Theme**:
   - All cards use consistent theme based on theme mode
   - Light mode: all light cards
   - Dark mode: all dark cards

4. **Navigation**:
   - Sticky circular black navbar at top
   - Responsive logo (different sizes for mobile/desktop)

---

## Prioritized User Stories (INVEST Criteria)

---

### P0 - Must Have (MVP Core)

---

**US-1: Browse Prompts Without Login**

*As a visitor, I want to browse and discover prompts without logging in, so that I can evaluate the platform before committing.*

- **Independent**: Yes - works without auth system
- **Negotiable**: Partial preview scope adjustable
- **Valuable**: Drives initial conversion
- **Estimable**: ~3 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Visitor can view homepage with prompt library loaded |
| 2 | Functionality | Partial preview (max 150 chars with "...") displays for each prompt |
| 3 | Functionality | Full prompt content is hidden/obscured for non-logged-in users |
| 4 | Functionality | Category navigation (Starter/Builder/Pro/Super Prompt) is accessible |
| 5 | Functionality | Search bar visible (bottom search bar) but prompts remain partially previewed |
| 6 | Performance | Page loads within 2 seconds |
| 7 | Performance | Lazy loading works for 50+ prompts on single page |
| 8 | User Interaction | "Log in to unlock" prompt appears on full prompt attempt |
| 9 | User Interaction | Clear visual distinction between preview and locked content |
| 10 | Error Handling | Graceful fallback if category data fails to load |
| 11 | Cross-browser | Works on Chrome, Firefox, Safari, Edge (latest 2 versions) |
| 12 | Usability | WCAG 2.1 AA compliant for color contrast |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a visitor on the platform homepage
- WHEN they browse the prompt library
- THEN they can view categorized prompts with partial previews (first 2-3 lines)
- AND cannot access full prompt content
- AND can navigate between categories (Starter/Builder/Pro/Super Prompt)

---

**US-2: User Registration & Authentication**

*As a new user, I want to register and log in, so that I can unlock full prompts and personalize my experience.*

- **Independent**: Yes - standalone auth module
- **Negotiable**: OAuth methods adjustable
- **Valuable**: Enables monetization
- **Estimable**: ~5 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Email/password registration form validates input |
| 2 | Functionality | OAuth providers (Google, GitHub) available for signup |
| 3 | Functionality | Confirmation email sent within 5 minutes of registration |
| 4 | Functionality | Email confirmation link valid for 24 hours |
| 5 | Functionality | User can log in with validated credentials |
| 6 | Functionality | Session persists across browser refreshes |
| 7 | Functionality | "Remember me" option extends session to 30 days |
| 8 | Security | Passwords meet minimum 8 characters + number requirement |
| 9 | Security | Account locks for 15 minutes after 5 failed login attempts |
| 10 | Security | All auth traffic uses HTTPS |
| 11 | Error Handling | Clear error messages for invalid email format |
| 12 | Error Handling | Error message for "email already registered" |
| 13 | Performance | Login response within 1 second |
| 14 | Usability | Form field validation provides inline feedback |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a new user on the registration page
- WHEN they create an account with email/password OR OAuth
- THEN their account is created and they are logged in
- AND they receive a confirmation email
- AND they can access the logged-in state across sessions

---

**US-3: Unlock Prompts via Reward Ads**

*As a free user, I want to unlock prompts by watching ads, so that I can access premium content without paying.*

- **Independent**: Yes - ad integration module
- **Negotiable**: Ad format adjustable
- **Valuable**: Core revenue driver
- **Estimable**: ~4 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | "Unlock with Ad" button appears on locked premium prompts |
| 2 | Functionality | Ad plays to completion before unlock |
| 3 | Functionality | Full prompt unlocks immediately after ad completion |
| 4 | Functionality | User can copy prompt text after unlock |
| 5 | Functionality | Unlock persists for current session |
| 6 | Functionality | Unlock tracks ad completion for revenue attribution |
| 7 | Performance | Ad loads within 1 second |
| 8 | Performance | Prompt unlocks within 2 seconds after ad completion |
| 9 | User Interaction | Clear progress indicator during ad loading |
| 10 | User Interaction | "Skip" option not available (reward-based) |
| 11 | User Interaction | Ad clearly labeled as "Unlock with Ad" |
| 12 | Error Handling | If ad fails, retry option presented |
| 13 | Error Handling | If ad network unavailable, fallback to subscription prompt |
| 14 | Compliance | Ad content follows AdSense/AdMob policies |
| 15 | Cross-browser | Ad renders consistently across all supported browsers |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a logged-in user viewing a locked premium prompt
- WHEN they click "Unlock with Ad" and complete the ad
- THEN the prompt is fully unlocked for this user
- AND they can copy the full prompt text
- AND ad completion is tracked for revenue
- AND the unlock persists for their session

---

**US-4: Subscription Access**

*As a subscriber, I want unlimited access to all prompts without ads, so that I have a premium ad-free experience.*

- **Independent**: Yes - payment + entitlements module
- **Negotiable**: Plan tiers adjustable
- **Valuable**: Premium monetization
- **Estimable**: ~5 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Monthly subscription plan available |
| 2 | Functionality | Yearly subscription plan available (discounted) |
| 3 | Functionality | Payment gateway processes credit card |
| 4 | Functionality | OAuth payment options (Apple Pay, Google Pay) available |
| 5 | Functionality | Subscription activated immediately after payment |
| 6 | Functionality | All prompts accessible without ads for subscribers |
| 7 | Functionality | Subscription status persists across sessions |
| 8 | Functionality | Renewal reminders sent 7 days before expiration |
| 9 | Functionality | Subscription auto-renews unless cancelled |
| 10 | Functionality | Cancel subscription accessible in user settings |
| 11 | Functionality | Refund policy honored (30-day money-back) |
| 12 | Security | Payment data follows PCI-DSS compliance |
| 13 | Security | No payment info stored locally |
| 14 | Performance | Payment processing completes within 10 seconds |
| 15 | Error Handling | Failed payment shows clear error with retry option |
| 16 | Error Handling | Graceful handling if subscription verification fails |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a user on the subscription page
- WHEN they select a plan (monthly/yearly) and complete payment
- THEN they receive unlimited access to all prompts
- AND no ads are displayed to them
- AND their subscription status persists across sessions
- AND renewal reminders are sent before expiration

---

**US-5: Prompt Categorization Display**

*As a user, I want prompts categorized into clear tiers, so that I can find the right skill level for my needs.*

- **Independent**: Yes - data model + UI
- **Negotiable**: Tier names adjustable
- **Valuable**: Core navigation
- **Estimable**: ~2 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Each prompt displays category badge (Starter/Builder/Pro/Super Prompt) |
| 2 | Functionality | Multi-version prompts show tabbed interface for each level |
| 3 | Functionality | Single-version prompts display single badge |
| 4 | Functionality | Category badges use distinct colors per tier |
| 5 | Functionality | Badge displays alongside prompt title in listings |
| 6 | User Interaction | Tab switching updates content without page reload |
| 7 | User Interaction | Active tab visually highlighted |
| 8 | Performance | Tab content loads within 500ms |
| 9 | Cross-browser | Tab functionality works across all supported browsers |
| 10 | Usability | Badges readable at 14px font size minimum |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a user browsing the prompt library
- WHEN they view any prompt
- THEN it displays its category badge (Starter/Builder/Pro/Super Prompt)
- AND multi-version prompts show tabs for each level
- AND single-version prompts show a single badge

---

**US-6: Daily AI Grading System**

*As a platform, I want prompts graded every 24 hours via AI + user feedback, so that quality is maintained dynamically.*

- **Independent**: Yes - background job
- **Negotiable**: Grading algorithm adjustable
- **Valuable**: Core differentiator
- **Estimable**: ~6 days
- **Small**: Contains multiple components but testable
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Grading job runs automatically every 24 hours |
| 2 | Functionality | Each prompt evaluated by AI model |
| 3 | Functionality | User ratings factored into grading calculation |
| 4 | Functionality | Category tier updates if criteria met |
| 5 | Functionality | Grading timestamp recorded for each prompt |
| 6 | Functionality | Admin can manually override top prompt grades |
| 7 | Functionality | Grading history maintained for audit |
| 8 | Performance | Grading job processes 1000 prompts/hour minimum |
| 9 | Performance | Dashboard reflects updated grades within 1 hour |
| 10 | Reliability | Job execution 99.9% successful |
| 11 | Reliability | Failed jobs auto-retry up to 3 times |
| 12 | Error Handling | Failed grading logged with error details |
| 13 | Error Handling | Admin notification if job fails 3 consecutive times |
| 14 | Security | AI model access secured via API key |
| 15 | Compliance | Grading algorithm explainable if audited |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a prompt in the system
- WHEN 24 hours have passed since last grading
- THEN the system runs AI evaluation
- AND updates the category tier if criteria met
- AND displays updated rating to users
- AND grading runs automatically without manual trigger

---

### P1 - Should Have (Core Experience)

---

**US-7: Search & Filtering**

*As a user, I want to search and filter prompts by category and keywords, so that I can quickly find relevant prompts.*

- **Independent**: Yes - search module
- **Negotiable**: Filter options adjustable
- **Valuable**: UX enhancement
- **Estimable**: ~3 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Keyword search matches prompt title and content |
| 2 | Functionality | Filter by category (Starter/Builder/Pro/Super Prompt) |
| 3 | Functionality | Filter by rating (1-5 stars) |
| 4 | Functionality | Filter by date added |
| 5 | Functionality | Multiple filters combinable (AND logic) |
| 6 | Functionality | Results update in real-time as filters applied |
| 7 | Functionality | Empty state shown when no results match |
| 8 | Functionality | Search results maintain pagination |
| 9 | Performance | Search results return within 500ms |
| 10 | Performance | Debounced search (300ms) to reduce API calls |
| 11 | User Interaction | Clear filter chips show active filters |
| 12 | User Interaction | "Clear all filters" option available |
| 13 | Error Handling | Graceful handling of special characters in search |
| 14 | Cross-browser | Search functionality works across browsers |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a user with a specific need
- WHEN they enter keywords in search OR apply category/rating filters
- THEN only matching prompts are displayed
- AND results update in real-time

---

**US-8: User Feedback & Rating**

*As a user, I want to rate prompts, so that I can contribute to the grading system and help others.*

- **Independent**: Yes - feedback module
- **Negotiable**: Rating scale adjustable
- **Valuable**: Improves grading accuracy
- **Estimable**: ~2 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | 1-5 star rating system on unlocked prompts |
| 2 | Functionality | Optional text comment field |
| 3 | Functionality | Rating submission records timestamp |
| 4 | Functionality | Rating contributes to AI grading cycle |
| 5 | Functionality | User's own rating visible to them |
| 6 | Functionality | Average rating displayed to all users |
| 7 | Functionality | Rating count displayed alongside average |
| 8 | Functionality | User can update their rating |
| 9 | Functionality | User can delete their rating |
| 10 | Performance | Rating submission completes within 1 second |
| 11 | Performance | Updated ratings reflect within 5 seconds |
| 12 | Error Handling | Prevent duplicate ratings from same user |
| 13 | Error Handling | Handle submission during grading job execution |
| 14 | Security | Ratings anonymized in public display |
| 15 | Security | Rate limiting on rating submissions |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a user who has unlocked a prompt
- WHEN they rate it (1-5 stars) and optionally comment
- THEN their rating is recorded
- AND contributes to the next AI grading cycle
- AND visible to other users

---

**US-9: Prompt Versioning**

*As a user, I want to access multiple versions of a prompt at different skill levels, so that I can upgrade as I improve.*

- **Independent**: Yes - data model change
- **Negotiable**: Version limits adjustable
- **Valuable**: Retention feature
- **Estimable**: ~4 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Multi-version prompts display tabs: Starter, Builder, Pro, Super Prompt |
| 2 | Functionality | Each version has independent content |
| 3 | Functionality | Each version has independent rating |
| 4 | Functionality | Each version has independent grading history |
| 5 | Functionality | Single-version prompts show badge only (no tabs) |
| 6 | Functionality | Version tabs display availability status |
| 7 | Functionality | User can switch between versions seamlessly |
| 8 | User Interaction | Active version tab visually highlighted |
| 9 | Performance | Version content loads within 500ms |
| 10 | Cross-device | Tabs accessible on mobile (horizontal scroll if needed) |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a prompt with multiple versions
- WHEN the user selects a version tab (Starter/Builder/Pro/Super Prompt)
- THEN the correct version content is displayed
- AND each version has independent ratings

---

**US-10: Creator Submission**

*As a creator, I want to submit prompts for the platform, so that I can contribute to the ecosystem and gain visibility.*

- **Independent**: Yes - submission module
- **Negotiable**: Validation rules adjustable
- **Valuable**: Content expansion
- **Estimable**: ~4 days
- **Small**: Single feature
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Submission form with prompt content field |
| 2 | Functionality | Category selection dropdown |
| 3 | Functionality | Description/title field |
| 4 | Functionality | Submission saved with "pending" status |
| 5 | Functionality | Submission visible in creator dashboard |
| 6 | Functionality | Creator can edit pending submissions |
| 7 | Functionality | Creator can delete pending submissions |
| 8 | Functionality | Submission validates minimum content length (50 chars) |
| 9 | Functionality | Submission validates required fields |
| 10 | Functionality | Confirmation message on successful submission |
| 11 | User Interaction | Clear step-by-step submission wizard |
| 12 | Error Handling | Error message for validation failures |
| 13 | Performance | Submission saves within 1 second |
| 14 | Security | XSS filtering on submission content |
| 15 | Security | Rate limiting on submissions (10/hour) |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a logged-in creator on the submission page
- WHEN they fill in prompt content, category, and description
- THEN the submission is created with "pending" status
- AND visible in their dashboard

---

### P2 - Could Have (Enhanced Experience)

---

**US-11: Admin Moderation**

*As an admin, I want to review and approve/reject creator submissions, so that quality is maintained.*

- **Independent**: Yes - admin module
- **Negotiable**: Workflow adjustable
- **Valuable**: Quality control
- **Estimable**: ~3 days
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Admin sees pending submissions queue |
| 2 | Functionality | Admin can approve submission (moves to published) |
| 3 | Functionality | Admin can reject submission with reason |
| 4 | Functionality | Admin can request changes (returns to pending) |
| 5 | Functionality | Bulk approval available (10+ at once) |
| 6 | Functionality | Creator notified of approval/rejection via email |
| 7 | Functionality | Admin can view submission history |
| 8 | Functionality | Admin can filter by status (pending/approved/rejected) |
| 9 | Performance | Queue loads within 2 seconds |
| 10 | Performance | Bulk operations complete within 5 seconds |
| 11 | User Interaction | Clear approve/reject buttons on each submission |
| 12 | User Interaction | Rejection requires reason input |
| 13 | Security | Admin role restricted to authorized users |
| 14 | Security | Audit log of all moderation actions |
| 15 | Compliance | Moderation decisions timestamped and logged |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a pending submission in the queue
- WHEN an admin reviews and approves/rejects it
- THEN the status is updated accordingly
- AND the creator is notified

---

**US-12: Analytics Dashboard**

*As a business stakeholder, I want to view key metrics, so that I can make informed decisions.*

- **Independent**: Yes - analytics module
- **Negotiable**: Metrics adjustable
- **Valuable**: Business insights
- **Estimable**: ~4 days
- **Testable**: Yes

**Acceptance Criteria:**

| # | Category | Criteria |
|---|----------|----------|
| 1 | Functionality | Display DAU (Daily Active Users) metric |
| 2 | Functionality | Display unlock rate (ad unlocks/total attempts) |
| 3 | Functionality | Display conversion rate (free to subscriber) |
| 4 | Functionality | Display rating distribution chart |
| 5 | Functionality | Display engagement metrics (avg time on page) |
| 6 | Functionality | Date range filter (7d, 30d, 90d, custom) |
| 7 | Functionality | Export data to CSV |
| 8 | Functionality | Auto-refresh every 5 minutes |
| 9 | Functionality | Role-based access (admin only) |
| 10 | Performance | Dashboard loads within 3 seconds |
| 11 | Performance | Chart rendering within 1 second |
| 12 | User Interaction | Visual charts (line, bar, pie) for metrics |
| 13 | User Interaction | Tooltip on hover for detailed values |
| 14 | Error Handling | Graceful handling if analytics service unavailable |
| 15 | Security | Dashboard accessible only to authorized roles |

**GIVEN-WHEN-THEN Scenarios:**

- GIVEN a stakeholder on the analytics page
- WHEN they view the dashboard
- THEN key metrics are displayed (DAU, unlock rate, conversion, ratings)
- AND data is filterable by date range

---

## Requirements

### Functional Requirements

#### Authentication & User Management

| ID  | Requirement            | Description                                    |
| --- | -------------------- | --------------------------------------------- |
| FR-1 | User Registration    | Email/password + OAuth signup                |
| FR-2 | User Login          | Authenticate with session persistence      |
| FR-3 | Password Reset      | Email-based recovery flow                  |
| FR-4 | Profile Management  | View/edit user profile                    |

#### Prompt Discovery

| ID  | Requirement          | Description                              |
| --- | -------------------- | --------------------------------------- |
| FR-5 | Prompt Browsing      | Browse prompts by category                |
| FR-6 | Partial Preview      | Display first 2-3 lines for non-members |
| FR-7 | Full Prompt View     | Display complete prompt text              |
| FR-8 | Search              | Keyword search across prompts           |
| FR-9 | Filtering           | Filter by category, rating, date       |

#### Access & Monetization

| ID  | Requirement        | Description                              |
| --- | ------------------ | --------------------------------------- |
| FR-10 | Ad-Based Unlock   | Unlock prompt after ad completion        |
| FR-11 | Subscription Plans | Monthly/yearly subscription options   |
| FR-12 | Subscription Status | Track active subscriptions          |
| FR-13 | Ad-Free Experience | Hide ads for subscribers           |

#### Prompt Management

| ID  | Requirement             | Description                                |
| --- | ---------------------- | ----------------------------------------- |
| FR-14 | Prompt Categorization  | 4-tier system (Starter/Builder/Pro/Super)   |
| FR-15 | Multi-Version Prompts | Tabbed UI for version access              |
| FR-16 | Single-Version Prompts | Badge display only                     |
| FR-17 | Prompt Copy          | Copy prompt to clipboard                |
| FR-18 | Prompt Redirect     | Link to external AI tools               |

#### Grading & Quality

| ID  | Requirement         | Description                                |
| --- | ------------------- | ----------------------------------------- |
| FR-19 | AI Grading Job    | Run every 24 hours automatically        |
| FR-20 | Category Updates | Dynamically update tier based on grading  |
| FR-21 | User Ratings      | 1-5 star rating system                   |
| FR-22 | Rating Display    | Show average rating + count              |

#### Creator Ecosystem

| ID  | Requirement          | Description                                |
| --- | -------------------- | ----------------------------------------- |
| FR-23 | Prompt Submission  | Submit new prompts for review              |
| FR-24 | Submission Status | Track pending/approved/rejected         |
| FR-25 | Admin Approval     | Review and approve/reject queue           |

### Non-Functional Requirements

#### Performance

| ID  | Requirement      | Target                        |
| --- | ---------------- | ---------------------------- |
| NFR-1 | Page Load Time | < 2 seconds                 |
| NFR-2 | Search Response | < 500ms                      |
| NFR-3 | Ad Load Time    | < 1 second                  |

#### Availability

| ID  | Requirement   | Target    |
| --- | ------------- | --------- |
| NFR-4 | Uptime       | 99.5%    |

#### Security

| ID  | Requirement           | Target                              |
| --- | -------------------- | ---------------------------------- |
| NFR-5 | HTTPS               | Force HTTPS                        |
| NFR-6 | Data Encryption    | Encrypt sensitive data at rest     |
| NFR-7 | Payment Security   | PCI-DSS compliant                 |

#### Scalability

| ID  | Requirement       | Target                              |
| --- | ------------------ | ---------------------------------- |
| NFR-8 | Concurrent Users | Support 10,000+ active users      |
| NFR-9 | Prompt Storage    | Handle 100,000+ prompts           |

#### Reliability

| ID  | Requirement          | Target                               |
| --- | --------------------- | ----------------------------------- |
| NFR-10 | Backup Frequency    | Daily automated backups             |
| NFR-11 | Recovery Time       | < 10 minutes                       |
| NFR-12 | Grading Reliability | 99.9% successful completions     |

---

## Priority Matrix (MOSCOW)

| Priority | User Stories |
| -------- | ------------|
| **Must Have** | US-1, US-2, US-3, US-4, US-5, US-6 |
| **Should Have** | US-7, US-8, US-9, US-10 |
| **Could Have** | US-11, US-12 |
| **Won't Have (Now)** | Enterprise integrations, offline mode, direct creator payouts |
