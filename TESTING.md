# End-to-End Testing Plan: RiskMarshal Workflow

## Prerequisites
- **Admin Account**: `admin@riskmarshal.com`
- **Tooling**: Playwright/Manual UI Testing.
- **Disposable Email Service**: Use a temp mail service to receive Quotations and Renewal Reminders.

## Execution Steps

### 1. Create Intermediary
- Navigate to **Administration -> Staff**.
- Add a new user with the role set to **Intermediary**.
- **Details to input**:
  - Full Name: `Test Intermediary`
  - Email: `intermediary@riskmarshal.test`
  - Password: `Intermediary@1234`
  - Intermediary Code: `INT-999`
  - Contact Info: `555-0199`
- **Insurer Associations**: Link them to an active insurer and set a commission rate.

### 2. Create Client
- Navigate to **Clients -> Add Client**.
- **Details to input**:
  - Full Name: `Jane Doe Target`
  - Email: temp mail address
  - Fill out remaining demographic fields.

### 3. Create Policy
- Navigate to **Policies -> Add Policy**.
- Select `Jane Doe Target` as the **Client**.
- Select `Test Intermediary` as the **Intermediary**.
- Choose the appropriate Insurer.
- Enter standard coverage dates and a Base Premium.

### 4. Send Quotation & Verify Delivery
- Trigger the **"Send Quotation"** action.
- Verify delivery in the temp email inbox.

### 5. Test Policy Renewal Reminder
- Simulate a renewal by adjusting `end_date` or manually invoking the function.
- Verify delivery of the renewal reminder.

### 6. Verify Intermediary Commission
- Navigate to **Commissions**.
- Verify commission entry for `Test Intermediary` matches the premium at the correct %.

### 7. Intermediary Login Verification
- Log out of Admin account.
- Log in using `intermediary@riskmarshal.test` / `Intermediary@1234`.
- Validate the localized dashboard view.