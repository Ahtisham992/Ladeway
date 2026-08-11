# Ladeway — Manual End-to-End Test Plan

**Tailored for Logicstics International Moving & Freight**

**Document Version:** 1.0  
**Company:** Logicstics · 2929 Arch Street, Suite 1700, Philadelphia, PA 19104  
**Interviewer:** Neal Elbaum, CEO  
**Prepared by:** Muhammad Ahtisham  
**Testing Environment:** Live deployed application  

---

## Overview

This document walks through the complete Ladeway platform lifecycle as it applies specifically to Logicstics — an international moving and freight forwarding company. Every test case, persona, field, and scoring rule in this document reflects real Logicstics business scenarios: residential international moves, commercial freight shipments, and vehicle transport.

The goal is to demonstrate that Ladeway captures the same information a Logicstics sales rep would gather on a phone call — automatically, through natural conversation, 24 hours a day.

## What We Are Testing

| Layer | What it proves |
| :--- | :--- |
| **AI Conversation** | Alexandra qualifies customers naturally, one question at a time |
| **Field Extraction** | Structured data pulled from free-form conversation |
| **Lead Scoring** | HOT / WARM / COLD tiering based on Logicstics-specific rules |
| **Sales Dashboard** | Reps see qualified leads instantly with full context |
| **Config Console** | Non-technical admin can update Alexandra without a developer |
| **Multi-Tenancy** | Logicstics data is completely isolated from other tenants |

## Pre-Test Setup

Before running any tests, confirm the following:

- [x] Backend running on Railway (or `localhost:3001`)
- [x] Frontend running on Vercel (or `localhost:3000`)
- [x] Logicstics tenant seeded in database
- [x] Alexandra (Logistics config) is active
- [x] Admin credentials ready: `admin@logicstics.com`
- [x] Open two browser windows:
    - **Window 1** — Customer view (Incognito)
    - **Window 2** — Admin dashboard (normal)

---

## The Logicstics AI Configuration (Alexandra)

This is the seeded configuration Alexandra uses. Understand this before testing. If you are starting fresh, build this configuration in the **Config Editor** first.

### Persona:
- **Name:** Alexandra
- **Role:** Logistics Coordinator at Logicstics
- **Tone:** Professional
- **Greeting:** "Hi there! I'm Alexandra with Logicstics. I can help you get an accurate quote for your move. To start, are you moving a home or an office?"

### Qualification Fields Alexandra Gathers:
*(Make sure to check "Required for Qualification" for the required fields)*

| Field Key | Label | Required | What Alexandra is asking |
| :--- | :--- | :--- | :--- |
| `move_type` | Move Type | Yes | Residential, commercial, or specialty cargo |
| `origin` | Origin City | Yes | Where the shipment starts |
| `destination` | Destination Country | Yes | Where it is going |
| `timeline` | Preferred Timeline | Yes | When they need to move |
| `cargo` | Cargo Description | Yes | What is being moved (furniture, equipment, vehicle) |
| `name` | Customer Name | No | Customer's full name |
| `email` | Email Address | No | Contact email |
| `phone` | Phone Number | No | Contact phone |

### Scoring Rules:
Configure these rules in the **Scoring Rules** tab to grade incoming logistics leads:

- **Rule 1 (HOT):** `move_type` | Contains any of | `commercial, office` | Weight: 1.0
- **Rule 2 (HOT):** `cargo` | Contains any of | `equipment, vehicles, machinery` | Weight: 1.0
- **Rule 3 (WARM):** `move_type` | Contains any of | `residential, home` | Weight: 0.5
- **Rule 4 (WARM):** `destination` | Contains any of | `UK, Europe, Australia` | Weight: 0.5
- **Rule 5 (COLD):** `cargo` | Contains any of | `single box, few items, suitcase` | Weight: 0.1
- **Rule 6 (COLD):** `timeline` | Contains any of | `just browsing, next year, no rush` | Weight: 0.1

---

## Test Scenarios: Live Chat Simulation

Open an **Incognito Window** and navigate to your agent's Live Chat Demo page (`/chat/[configId]`). Follow these exact scripts to simulate different types of Logicstics customers.

### Test Case 1: The HOT Lead (Commercial Freight)
**Context:** A high-value corporate client looking to move heavy machinery across the country immediately.

**Script:**
- **AI (Alexandra):** *"Hi there! I'm Alexandra with Logicstics. I can help you get an accurate quote for your move. To start, are you moving a home or an office?"*
- **User:** "Hi Alexandra, we are moving our commercial manufacturing plant."
- **AI:** *(Should acknowledge commercial move and ask for origin/destination or cargo)*
- **User:** "We are moving heavy industrial machinery and factory equipment from Detroit, Michigan down to Monterrey, Mexico."
- **AI:** *(Should capture origin: Detroit, destination: Mexico, cargo: machinery, and ask for timeline)*
- **User:** "We need this equipment moved ASAP. Ideally by next week."
- **AI:** *(Should ask for contact details)*
- **User:** "My name is John Davis, email is jdavis@detroitmanufacturing.com, and phone is 555-0199."
- **AI:** *"I have everything I need to get you a quote..." (Conversation closes)*

**Verification (Admin Console -> Leads):**
- **Score:** HOT (Triggers Rule 1 and Rule 2)
- **Data Extracted:** `move_type`: commercial | `origin`: Detroit | `destination`: Mexico | `timeline`: ASAP/next week | `cargo`: heavy machinery/equipment

---

### Test Case 2: The WARM Lead (Residential International Move)
**Context:** A family relocating overseas, representing a standard high-margin residential move.

**Script:**
- **AI (Alexandra):** *"Hi there! I'm Alexandra with Logicstics. I can help you get an accurate quote for your move. To start, are you moving a home or an office?"*
- **User:** "We are moving our home."
- **AI:** *(Should ask for origin/destination)*
- **User:** "We are moving from our 4-bedroom house in Philadelphia to London, UK."
- **AI:** *(Should ask for cargo or timeline)*
- **User:** "We are taking all our household furniture, beds, and a grand piano. We plan to move in about two months."
- **AI:** *(Should ask for contact details)*
- **User:** "I can be reached at sarah.smith@email.com."
- **AI:** *"I have everything I need to get you a quote..." (Conversation closes)*

**Verification (Admin Console -> Leads):**
- **Score:** WARM (Triggers Rule 3 and Rule 4)
- **Data Extracted:** `move_type`: residential/home | `origin`: Philadelphia | `destination`: London, UK | `timeline`: in two months | `cargo`: household furniture, grand piano

---

### Test Case 3: The COLD Lead (Low Value / Single Item)
**Context:** A consumer looking to ship a single low-value item with no urgency.

**Script:**
- **AI (Alexandra):** *"Hi there! I'm Alexandra with Logicstics. I can help you get an accurate quote for your move. To start, are you moving a home or an office?"*
- **User:** "Just a residential home."
- **AI:** *(Should ask for origin/destination)*
- **User:** "I'm in Boston, and I just need to send something to Florida."
- **AI:** *(Should ask for cargo/timeline)*
- **User:** "I just have a single box of old clothes. I am just browsing for prices right now, absolutely no rush."
- **AI:** *(Should ask for contact details)*
- **User:** "mike@email.com"
- **AI:** *"I have everything I need to get you a quote..." (Conversation closes)*

**Verification (Admin Console -> Leads):**
- **Score:** COLD (Triggers Rule 5 and Rule 6)
- **Data Extracted:** `move_type`: residential | `origin`: Boston | `destination`: Florida | `timeline`: no rush / browsing | `cargo`: single box

---

**Testing Complete.** If all three scenarios extract the correct fields and route to the proper CRM columns, Ladeway's core qualification and analytics engine is fully validated for Logicstics.
