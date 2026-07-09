# Ladeway: Comprehensive End-to-End Black Box Test Plan

**Document Version:** 1.0
**Target System:** Ladeway AI Conversational Intelligence Platform
**Testing Methodology:** Black Box / Manual End-to-End (E2E) Workflow

## Objective
To rigorously validate the complete lifecycle of the Ladeway platform in a production-like environment. This test plan covers tenant registration, complex AI configuration (multi-field extraction & multi-rule scoring), realistic multi-turn AI interactions, and the downstream CRM pipeline evaluation.

---

## Phase 1: System Initialization & Onboarding
**Objective:** Verify tenant creation, authentication routing, and isolated workspace generation.

**Execution Steps:**
1. Open a fresh browser session and navigate to the root application (`http://localhost:3000`).
2. Click **Get Started** to access the registration flow.
3. Complete the Signup form with the following credentials:
   - **Company Name:** `Global Freight Solutions QA`
   - **Email:** `qa.admin@globalfreight.test`
   - **Password:** `Testing123!@#`
4. Click **Sign up**.
5. **Expected Verification:** The system must automatically authenticate the user, generate a secure tenant workspace, and redirect to the Admin Console (`/dashboard/overview`).

---

## Phase 2: Complex AI Configuration (Logistics Persona)
**Objective:** Validate that the system can handle complex, multi-dimensional qualification structures and complex persona definitions.

**Execution Steps:**
1. Navigate to **Configurations** via the left sidebar and click **Create New Configuration**.
2. **Define Base Persona:**
   - **Industry Name:** `Enterprise Logistics & Freight`
   - **Persona Name:** `Sarah - Senior Logistics Coordinator`
   - **Greeting:** `Welcome to Global Freight Solutions! I'm Sarah. To help route you to the right freight specialist, could you tell me a bit about what you're looking to ship today and where it's going?`
3. Click **Create & Continue**.

### 2.1 Define Multiple Qualification Fields
In the Config Editor, add the following four distinct fields to stress-test data extraction:

1. **Field 1: Volume**
   - **Key:** `shipping_volume` | **Label:** `Monthly Volume` | **Type:** `text`
   - **Hint:** `Extract the volume or size of the freight (e.g., '10 TEU containers', '5 pallets', 'one small box').`
2. **Field 2: Frequency**
   - **Key:** `shipping_frequency` | **Label:** `Shipping Frequency` | **Type:** `text`
   - **Hint:** `Extract how often they ship (e.g., 'weekly', 'monthly', 'one-time only').`
3. **Field 3: Budget**
   - **Key:** `monthly_budget` | **Label:** `Monthly Budget` | **Type:** `text`
   - **Hint:** `Extract any mentioned budget or spend amount (e.g., '$10,000+', 'under $500').`
4. **Field 4: Destination**
   - **Key:** `destination_region` | **Label:** `Destination` | **Type:** `text`
   - **Hint:** `Extract the destination country or continent.`

### 2.2 Define Multi-Tiered Scoring Rules
Navigate to the **Scoring Rules** tab and construct a complex evaluation matrix:

- **Rule 1 (Enterprise / HOT):**
  - Field: `shipping_volume` | Condition: `Contains` | Value: `containers` | Weight: `1.0` | Tier: `HOT`
- **Rule 2 (Enterprise / HOT):**
  - Field: `monthly_budget` | Condition: `Contains` | Value: `10000` | Weight: `1.0` | Tier: `HOT`
- **Rule 3 (Mid-Market / WARM):**
  - Field: `shipping_volume` | Condition: `Contains` | Value: `pallets` | Weight: `0.5` | Tier: `WARM`
- **Rule 4 (Mid-Market / WARM):**
  - Field: `shipping_frequency` | Condition: `Contains` | Value: `weekly` | Weight: `0.5` | Tier: `WARM`
- **Rule 5 (Consumer / COLD):**
  - Field: `shipping_frequency` | Condition: `Contains` | Value: `one-time` | Weight: `0.1` | Tier: `COLD`
- **Rule 6 (Consumer / COLD):**
  - Field: `shipping_volume` | Condition: `Contains` | Value: `box` | Weight: `0.1` | Tier: `COLD`

**Save the configuration.** Ensure a success toast appears and settings persist upon page refresh.

---

## Phase 3: Conversational AI Stress Testing
**Objective:** Conduct rigorous, multi-turn dialogues to ensure the AI acts contextually, dynamically extracts multiple fields, and routes logic correctly.

*Note: Open the **Live Chat Demo** link (`/chat/[configId]`) in an Incognito window for these tests to ensure fresh session state.*

### Test Case 3A: The "HOT" Enterprise Lead
**Context:** A large manufacturer needing high-volume international shipping.
**Execution Script:**
- **AI:** *[Sends standard greeting]*
- **User:** "Hi Sarah, we are a manufacturing firm based in Ohio. We need to set up a new supply chain route to Germany."
- **AI:** *[Should acknowledge Germany (Destination) and ask about volume/frequency]*
- **User:** "We manufacture heavy industrial parts. We're looking at moving roughly 15 containers."
- **AI:** *[Should acknowledge containers (Volume) and ask about frequency/budget]*
- **User:** "This would be a monthly operation. Our logistics budget for this specific route is around $15,000 to $20,000."
- **AI:** *[Should wrap up the qualification seamlessly]*
- **User:** "Thanks, please have sales contact me at enterprise@ohio-mfg.com."
**Action:** Reset the chat.

### Test Case 3B: The "WARM" Mid-Market Lead
**Context:** A growing e-commerce brand looking for domestic distribution.
**Execution Script:**
- **AI:** *[Sends standard greeting]*
- **User:** "Hello. We run an online furniture store and need a new shipping partner for North America."
- **AI:** *[Should ask for specifics on volume or frequency]*
- **User:** "We don't ship full containers. Usually, it's LTL (Less Than Truckload). We send out about 12 pallets of flat-packed furniture."
- **AI:** *[Should ask about frequency or budget]*
- **User:** "We ship these pallets out weekly to our distribution hubs. Budget is flexible depending on transit times."
- **User:** "My email is logistics@furnituredirect.com."
**Action:** Reset the chat.

### Test Case 3C: The "COLD" Consumer Lead
**Context:** An individual trying to ship a personal item.
**Execution Script:**
- **AI:** *[Sends standard greeting]*
- **User:** "Hey, I need to send a gift to my grandson."
- **AI:** *[Should politely ask what they are shipping and where]*
- **User:** "It's just going to Canada. It's a single cardboard box, maybe weighs 5 pounds."
- **AI:** *[Should ask about frequency]*
- **User:** "Oh, it's just a one-time thing for his birthday. I don't have a big budget, hoping to keep it under $50."
- **User:** "Email is grandpa.joe@email.com."
**Action:** Close the window.

---

## Phase 4: CRM Pipeline & Extraction Verification
**Objective:** Verify that the backend analytics engine successfully processed the raw chat transcripts, triggered the regex/semantic scoring conditions, and populated the Lead Pipeline accurately.

**Execution Steps:**
1. Return to the Admin Console and navigate to **Leads**.
2. **Verify HOT Pipeline Column:**
   - Locate the lead from `enterprise@ohio-mfg.com`.
   - Click to open the Lead Detail Panel.
   - **Assertions:** 
     - Score should be **HOT**.
     - `shipping_volume` must contain '15 containers'.
     - `monthly_budget` must contain '$15,000'.
     - `destination_region` must contain 'Germany'.
3. **Verify WARM Pipeline Column:**
   - Locate the lead from `logistics@furnituredirect.com`.
   - Click to open the Lead Detail Panel.
   - **Assertions:**
     - Score should be **WARM**.
     - `shipping_volume` must contain '12 pallets'.
     - `shipping_frequency` must contain 'weekly'.
     - `destination_region` must contain 'North America'.
4. **Verify COLD Pipeline Column:**
   - Locate the lead from `grandpa.joe@email.com`.
   - Click to open the Lead Detail Panel.
   - **Assertions:**
     - Score should be **COLD**.
     - `shipping_volume` must contain 'cardboard box'.
     - `shipping_frequency` must contain 'one-time'.

**Sign-off:** If all fields are extracted correctly across multi-turn dialogues and the tiering logic routes each lead to the exact pipeline column designated, the system's core conversational intelligence and CRM engine are functioning at 100% capacity.
