## Riskmarshal — Phase 1 MVP Plan

### Design System

- **Theme**: Professional dark navy/blue palette — navy sidebar, dark card backgrounds, blue accent colors, white text
- **Layout**: Sidebar navigation (collapsible) + main content area
- **Typography**: Clean, corporate — Inter/system fonts

### Authentication & Roles

- Supabase Auth with email/password login
- `user_roles` table with roles: `super_admin`, `intermediary`, `staff`
- `profiles` table with name, role reference, `parent_intermediary_id` for staff
- RLS policies scoping data by role
- Login page with redirect based on role
- Password reset flow

### Database Schema (Supabase/PostgreSQL)

- **profiles**: id, name, email, role, parent_intermediary_id, is_active
- **insurers**: id, name, logo_url, contact_details, is_active
- **intermediary_insurers**: intermediary_id, insurer_id (junction table)
- **clients**: id, name, email, phone, address, dob, intermediary_id
- **policies**: id, policy_number, client_id, intermediary_id, insurer_id, policy_type, premium_amount, coverage_amount, start_date, end_date, status, renewal_status, renewed_from_policy_id, original_document_url, ocr_extracted_data
- **quotations**: id, policy_id, client_id, intermediary_id, sent_via, sent_at, payment_status, alert_count
- **leads**: id, name, email, phone, source, insurance_type_interest, message, status, assigned_intermediary_id
- **commissions**: id, intermediary_id, policy_id, insurer_id, premium_amount, commission_rate, commission_amount, status
- RLS on all tables scoping intermediary data

### Pages & Navigation (Sidebar)

**Shared sidebar** with role-conditional items:

- Dashboard (home)
- Clients
- Policies (Active Policies)
- Quotations
- Renewals
- Leads
- Insurers (admin only)
- Commissions (admin only)
- Reports (admin only — Phase 2, placeholder)
- Settings / User Management (admin only)

### Dashboard — Admin View

- **Overview cards**: Total active policies, total clients, pending payments, total revenue, total leads
- **Upcoming Renewals widget**: Policies expiring in 30 days, color-coded urgency (red ≤7d, orange ≤15d, yellow ≤30d)
- **Commission summary** per intermediary
- **Revenue chart** (monthly bar chart)
- **Intermediary performance breakdown** table
- **Renewal Health snapshot**: renewal rate vs lapse rate

### Dashboard — Intermediary View

- **Overview cards**: My active policies, my clients, my pending payments, my leads
- **Quick actions**: Add client, Upload policy, View pending payments
- **My Upcoming Renewals widget** with color-coded urgency bands

### Client Management

- List/table with search & filter (name, email, phone, policy status)
- Add/Edit client form
- Client detail page: associated policies, quotations, renewal history

### Policy Management

- Upload policy document (file upload to Supabase Storage)
- OCR extraction via Supabase Edge Function calling Gemini API
- Review/edit/confirm extracted data form
- Active policies table with search, filters, urgency color indicators
- Policy detail page with renewal chain history
- "Initiate Renewal" quick action

### Quotation Management

- Generate quotation from policy data
- Send via email (Edge Function)
- Quotation list with payment status tracking
- Manual payment status update (Pending → Paid/Expired/Cancelled)

### Renewal Pipeline

- Dedicated renewals tab with status filters (Upcoming, Reminder Sent, Renewed, Lapsed)
- Mark as Renewed → prompt for new policy upload
- Admin sees all; intermediary sees own

### Lead Management

- Lead list with status pipeline (New → Contacted → In Discussion → Converted → Lost)
- Admin assigns leads to intermediaries
- Lead-to-Client conversion (pre-fills client form)

### Insurer Management (Admin)

- CRUD for insurer companies
- Associate/disassociate intermediaries with insurers

### User Management (Admin)

- Create/edit/deactivate intermediary and staff accounts

### Payment Alerts & Renewal Reminders

- Edge Functions with Supabase `pg_cron` for:
  - Payment alerts (twice daily for pending quotations)
  - Renewal reminders (daily, multi-stage: 60/30/15/7 days)
- Email delivery via Edge Function (Resend or similar)
  &nbsp;
  **I have few more things to mention.** 
  - Providing you the resend API key 
    ```dotenv
    "re_JTe2JUbP_La7U5H7YbQF7M2XFYnQo9XAm"
    ```
    Gemini API key 
    ```dotenv
    "AIzaSyA_YIF4YvukXvoVmt8r_TiiXq-XmfPcUOY"
    ```
    Imagekit env variables 
    ```dotenv
    IMAGEKIT_PUBLIC_KEY=public_IrR/zdnuZ4nUd7e2Lna2HfyJEmc=
    IMAGEKIT_PRIVATE_KEY=private_u7w5ZOqbBNxluqphVTh2S58O7Dc=
    IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/pkxblau1v
    ```
    use these to configure on supabase.