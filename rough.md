# 🚀 PingWing by Marketing Dime - Complete Development Context
## System Prompt for Next Chat Session

**Last Updated:** Nov 18, 2025 12:25 AM IST  
**Status:** MVP Development - Messages Working! ✅  
**Repository:** wa-mktgdime (GitHub)  

---

## 📋 PROJECT OVERVIEW

### Brand Identity
- **Platform Name:** PingWing by Marketing Dime
- **URL:** wa.mktgdime.com
- **Purpose:** Multi-tenant WhatsApp Business API SaaS platform
- **Target Users:** Marketing agencies, SMBs, automotive dealerships
- **Branding:** PingWing logo + Marketing Dime color scheme

### Current Architecture
- **Frontend:** Next.js 16 (Turbopack), React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes (serverless on Vercel)
- **Database:** Upstash Redis (key-value store, no SQL)
- **Authentication:** Temporarily disabled (will use Meta Embedded Signup post-MVP)
- **Deployment:** Vercel
- **WhatsApp Integration:** Meta Business API (System User Token)

---

## ✅ COMPLETED FEATURES

### 1. Landing Page (`/`)
- Hero section with CRM pitch
- Feature highlights (10K+ messages, 500+ businesses, 99.9% uptime)
- Call-to-action buttons
- Professional dark theme with gradient

### 2. Dashboard Layout (`/dashboard`)
- Mobile-first responsive design
- Bottom navigation (mobile) + sidebar (desktop)
- Navigation items: Home, Contacts, Messages, Inbox, Settings
- User greeting & demo indicator
- Fully functional routing

### 3. Contacts Page (`/dashboard/contacts`)
**Features:**
- ✅ View all contacts (from Redis)
- ✅ Add single contact (form modal)
- ✅ Import contacts from CSV
- ✅ Search contacts by name/phone
- ✅ Delete contacts
- ✅ Display contact count
- ✅ Tags support

**API Endpoints:**
- `GET /api/contacts` - Fetch all contacts
- `POST /api/contacts` - Add new contact
- `DELETE /api/contacts?id={id}` - Delete contact
- `POST /api/contacts/import` - Import CSV

**Redis Schema:**
```
Key: contacts:{businessId}
Value: [
  {
    id: string,
    name: string,
    phone: string (with country code),
    email: string (optional),
    tags: string[],
    createdAt: ISO timestamp
  }
]
```

### 4. Messages Page (`/dashboard/messages`)
**Features:**
- ✅ Load contacts from Redis
- ✅ Multi-select contacts with checkboxes
- ✅ Select All / Deselect All toggle
- ✅ Real-time selection count
- ✅ Message composer with character count
- ✅ Message preview
- ✅ Send to multiple contacts sequentially
- ✅ Progress tracking (X/Y sent)
- ✅ Success toast notification
- ✅ Stats cards (Total, Selected, Sent Today)

**API Endpoints:**
- `POST /api/whatsapp/send` - Send WhatsApp message

**Working Verification:**
✅ Successfully sends messages via Meta API v22.0
✅ Receives proper message IDs in response
✅ Phone number validation & formatting

---

## ❓ CRITICAL DECISIONS NEEDED (From Latest Session)

### 1. Inbox & Motoyard Conflict
**Question:** Motoyard already has an inbox for replying/viewing messages. Will this conflict?

**Current Status:** NEEDS CLARIFICATION
- **Option A:** Separate dedicated PingWing inbox (recommended for BSP demo)
- **Option B:** Extend Motoyard inbox with PingWing integration
- **Decision:** Waiting on your input

### 2. Team Collaboration & User Management
**Question:** Will users be able to share inbox with teams?

**Current Status:** NOT YET IMPLEMENTED
- **Tasks:**
  - Create user roles (Admin, Agent, Viewer)
  - Implement user management system
  - Add inbox sharing/permissions
  - Team member management
- **Timeline:** Post-MVP (after BSP approval)
- **Storage:** Will use Redis + database for user relationships

### 3. URL & Branding
**Decision Made:**
- ✅ URL: `wa.mktgdime.com` (primary) 
- ✅ Branding: PingWing by Marketing Dime
- ✅ Logo: Use PingWing branding assets
- ✅ Colors: Keep Marketing Dime color scheme

---

## 🔧 CURRENT CONFIGURATION

### Environment Variables (.env.local)
```
# Redis
UPSTASH_REDIS_REST_URL="https://flexible-coyote-25296.upstash.io"
UPSTASH_REDIS_REST_TOKEN="[token]"

# WhatsApp Business API (Working)
META_ACCESS_TOKEN="EAAQ...ZD" (System User Token)
WHATSAPP_PHONE_NUMBER_ID="777418242131073"
WHATSAPP_BUSINESS_ACCOUNT_ID="1080466230659385"

# Next.js
NEXTAUTH_SECRET="[secret]"
NEXTAUTH_URL="http://localhost:3000"
```

### WhatsApp Setup
- **Phone Number:** +91 8269575004 (MOTOYARD account)
- **WABA ID:** 1080466230659385
- **Phone Number ID:** 777418242131073
- **API Version:** v22.0
- **Test Message Success:** ✅ Verified working

---

## 📊 REDIS DATA STRUCTURES

### Current Storage
```
// Contacts
contacts:{businessId} → Array of contact objects

// Future (Post-MVP)
users:{businessId} → User management
messages:{businessId}:{contactId} → Message history
inbox:{businessId} → Conversation threads
webhooks:{businessId} → Webhook events
```

---

## 🎯 META INTEGRATION DETAILS

### Current (Development)
- Using test phone number: +91 8269575004
- System User Token with MOTOYARD WABA access
- Manual setup (not Embedded Signup)

### Production (Post-MVP - Embedded Signup)
Each new customer will:
1. Click "Connect WhatsApp" on PingWing
2. Meta Embedded Signup popup opens
3. Customer logs in with their Facebook account
4. Selects/creates their WABA
5. Meta returns: `{ waba_id, phone_number_id, access_token }`
6. PingWing stores token per business in Redis
7. No manual System User creation needed!

---

## 📱 REQUIRED FOR META BSP DEMO

### ✅ Already Working
1. ✅ Onboarding flow (landing page)
2. ✅ Contact management (add, import, view)
3. ✅ Sending messages (bulk messaging feature)
4. ✅ Real WhatsApp delivery confirmation

### ⏳ Still Need to Build
1. **Inbox Page** (CRITICAL) - Receive & reply to messages
2. **Webhook Handler** - Receive incoming messages from Meta
3. **Dashboard Home** - Stats overview
4. **Message History** - Store conversation threads

### Recording Demo Workflow
- New contact added ✅
- Message sent to contact ✅
- **Message received in inbox** ⏳
- **Reply sent back** ⏳
- Full conversation visible ⏳

---

## 🏗️ ARCHITECTURE FOR MULTI-TENANCY

### Current (Single Business - Demo Mode)
```
All data stored under: businessId = "demo_business"
```

### Production (Multi-Tenant with Embedded Signup)
```
Each business gets:
- Unique businessId from Meta token
- Separate Redis namespace
- Isolated contacts, messages, users
- Per-business webhook handling
```

---

## 📁 PROJECT STRUCTURE

```
wa-mktgdime/
├── app/
│   ├── layout.tsx (root layout - no SessionProvider)
│   ├── page.tsx (landing page)
│   ├── dashboard/
│   │   ├── layout.tsx (dashboard with navigation)
│   │   ├── page.tsx (dashboard home - TODO)
│   │   ├── contacts/
│   │   │   └── page.tsx (contacts management)
│   │   ├── messages/
│   │   │   └── page.tsx (compose & send)
│   │   ├── inbox/
│   │   │   └── page.tsx (receive & reply - TODO)
│   │   └── settings/
│   │       └── page.tsx (settings - TODO)
│   └── api/
│       ├── test-redis/
│       │   └── route.ts (Redis connection test)
│       ├── contacts/
│       │   ├── route.ts (CRUD endpoints)
│       │   └── import/
│       │       └── route.ts (CSV import)
│       └── whatsapp/
│           ├── send/
│           │   └── route.ts (send messages)
│           ├── check-numbers/
│           │   └── route.ts (list phone numbers)
│           └── webhook/
│               └── route.ts (receive webhooks - TODO)
├── components/
│   └── ui/ (shadcn/ui components)
├── .env.local (environment variables)
└── auth.ts.disabled (temporarily disabled)
```

---

## 🚨 KNOWN ISSUES & SOLUTIONS

### Issue 1: Auth Disabled
**Status:** Intentional  
**Reason:** Focus on core features first, will use Meta Embedded Signup later  
**Solution:** Direct access to /dashboard without login

### Issue 2: Single WABA Test Setup
**Status:** Working correctly  
**Details:** Using MOTOYARD WABA for development  
**Production:** Each customer brings their own WABA via Embedded Signup

### Issue 3: No Webhook Receiver Yet
**Status:** TODO (critical for inbox)  
**What's needed:** POST /api/whatsapp/webhook endpoint

---

## 📋 NEXT CHAT SESSION CHECKLIST

**Before starting next session, verify:**
- [ ] Context files attached (this file + Context.json from git)
- [ ] Environment variables loaded
- [ ] Redis connection working (`npm run dev` shows no errors)
- [ ] `/dashboard/contacts` page loads
- [ ] Can add/view contacts
- [ ] Messages page works
- [ ] Know current GitHub branch

**Starting Tasks:**
1. ⏳ Build Inbox page (receive messages)
2. ⏳ Webhook handler for incoming messages
3. ⏳ Message reply functionality
4. ⏳ Dashboard home/stats
5. ⏳ Team collaboration (optional - post-MVP)

---

## 🔗 IMPORTANT LINKS

- **Meta Console:** https://developers.facebook.com/apps/1166594718684227/
- **Redis Console:** https://console.upstash.com/
- **Vercel Dashboard:** https://vercel.com/mynk717s-projects/wa-mktgdime
- **GitHub:** [Your repo URL]

---

## 📝 QUESTIONS FOR NEXT SESSION

1. **Inbox Conflict:** Separate PingWing inbox or integrate with Motoyard?
2. **Team Features:** Should we build team sharing post-MVP or now?
3. **Priority:** Build inbox immediately or other features first?
4. **BSP Timeline:** When do we need the complete demo ready?

---