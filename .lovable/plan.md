## Implementation Plan

This is a large set of changes spanning 5 areas. Here is the breakdown:

---

### 1. Light/Dark Mode Toggle

**What**: Add a theme provider with localStorage persistence and a toggle button in the header.

- **Create `src/contexts/ThemeContext.tsx**` — Provider that manages `dark`/`light` class on `<html>`, persists to localStorage
- **Add light mode CSS variables** in `src/index.css` — Define `:root` (light) and `.dark` (dark) color schemes. Current dark values move under `.dark`
- **Add toggle button** in `DashboardLayout.tsx` header (Sun/Moon icon) and on Login page
- Light mode palette: white backgrounds, slate text, navy-blue accents matching the brand

### 2. Logo Integration

**What**: Copy the uploaded logo into `src/assets/logo_rmbg.png` and use it in the sidebar and login page.

- **Sidebar (`AppSidebar.tsx`)**: Replace the Shield icon with the logo image. Apply `dark:brightness-110` for dark mode visibility
- **Login page (`Login.tsx`)**: Replace Shield icon + text with the logo image
- Size the logo appropriately for collapsed (icon-only) vs expanded sidebar states

### 3. Lead Management Pipeline (Real Database CRUD)

**What**: Replace mock data in `Leads.tsx` with full Supabase CRUD + status pipeline + lead-to-client conversion.

- **Leads.tsx rewrite**:
  - Fetch from `leads` table with search/filter by status
  - Add Lead dialog (name, email, phone, source, insurance_type_interest, message)
  - Edit Lead dialog
  - View Lead detail dialog (read-only)
  - Delete with confirmation dialog
  - **Status transition dropdown** — Admin can change status (New → Contacted → In Discussion → Converted / Lost)
  - **Assign to intermediary** — Admin can assign leads via a dropdown of profiles
  - **Convert to Client button** — When status is "Converted", show a button that pre-fills the Add Client dialog with lead data, creates the client, and marks the lead as converted

### 4. Policies Page (Real Database CRUD + Document Upload)

**What**: Replace mock data in `Policies.tsx` with full Supabase CRUD + file upload to storage + OCR via Edge Function.

- **Policies.tsx rewrite**:
  - Fetch from `policies` table joined with `clients` and `insurers` names
  - Search by policy number, client name; filter by status, type
  - **Add Policy dialog** — Select client (dropdown), select insurer (dropdown), policy number, type, premium, coverage, start/end dates
  - **Upload Policy Document** — File input uploads to `policy-documents` bucket, stores URL in `original_document_url`
  - **Edit Policy dialog** — Update fields
  - **View Policy detail dialog** — Read-only view with all fields, document download link, OCR data display
  - **Delete policy** — Confirmation dialog (requires DB migration to add DELETE RLS policy)
- **OCR Edge Function** (`supabase/functions/extract-policy-data/index.ts`):
  - Takes a document URL, fetches the file from storage, sends to Gemini API for OCR extraction
  - Returns structured JSON (policy number, client name, insurer, dates, premium, etc.)
  - Stores extracted data in `ocr_extracted_data` JSONB column
- **DB Migration**: Add DELETE policy for policies table

### 5. CRUD Modals Across All Pages

**What**: Ensure all entity pages (Clients, Leads, Policies) have proper Add/Edit/View/Delete modals.

- **Clients.tsx** — Already has Add/Edit. Add a **View detail dialog** (read-only modal showing all fields). Replace `confirm()` delete with a proper **Delete confirmation dialog**.
- **Leads.tsx** — All 4 modals as described above
- **Policies.tsx** — All 4 modals as described above

---

### Technical Details

**Files to create:**

- `src/contexts/ThemeContext.tsx` — Theme provider
- `src/assets/logo_rmbg.png` — Logo file (copy from upload)
- `supabase/functions/extract-policy-data/index.ts` — OCR edge function

**Files to modify:**

- `src/index.css` — Light + dark CSS variables
- `src/main.tsx` — Wrap with ThemeProvider
- `src/components/DashboardLayout.tsx` — Add theme toggle
- `src/components/AppSidebar.tsx` — Use logo image
- `src/pages/Login.tsx` — Use logo, add theme toggle
- `src/pages/Leads.tsx` — Full rewrite with Supabase CRUD
- `src/pages/Policies.tsx` — Full rewrite with Supabase CRUD
- `src/pages/Clients.tsx` — Add View dialog, improve Delete dialog

**DB Migration:**

- Add DELETE RLS policy on `policies` table for intermediaries and admins
    
  Use single email and password for super admin/admin i.e.,
  - [email: admin@riskmarshal.com](mailto:admin@riskmarshal.com)
  - password: admin1234
    Also make sure the admin will create the credentials for other members, the other user or intemeditery/saff member can't sign up but only sign in