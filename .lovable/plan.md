

## Plan: Branding Fix, Quotation Flow & Polish

### 1. Sidebar Branding — Logo Only, "RiskMarshall"

**File: `src/components/AppSidebar.tsx`**
- Remove the text block ("RiskMarshal" + "Insurance CRM") below the logo
- When expanded, show only the logo (sized larger, e.g. `h-10`)
- Update all `alt` text to "RiskMarshall" (double L)

**File: `src/pages/Login.tsx`**
- Remove the `<h1>RiskMarshal</h1>` and `<p>Insurance CRM Platform</p>` text
- Keep only the logo image, sized larger (e.g. `h-20`)
- Update alt text to "RiskMarshall"

### 2. "Send Quotation" After Policy Creation

**File: `src/pages/Policies.tsx`**
- After `handleSave` and `handleSaveExtracted` succeed, show a confirmation toast with an action button: "Send Quotation"
- Clicking it navigates to `/quotations` with query params or opens a pre-filled quotation dialog
- Alternatively, add a "Send Quotation" button in the success flow that auto-creates a quotation linked to the newly created policy (using the policy's `client_id`, `premium_amount`, and `intermediary_id`)

### 3. Comprehensive Toast Notifications

**File: `src/pages/Policies.tsx`**
- Already has most toasts. Ensure:
  - Upload success/failure toasts
  - Extraction progress toasts (step transitions)
  - Save success with "Send Quotation" action
  - Delete success/failure

### 4. Test & Verify Upload Flow

This is a testing request -- I will use browser tools to log in, navigate to Policies, upload the provided PDF, and verify the extraction animation + review form + save flow work correctly.

### Technical Details

**Files to modify:**
- `src/components/AppSidebar.tsx` — Remove text, logo-only header
- `src/pages/Login.tsx` — Remove text, logo-only branding
- `src/pages/Policies.tsx` — Add "Send Quotation" post-save flow, ensure toast notifications

No DB migration needed.

