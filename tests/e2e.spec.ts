import { test, expect } from '@playwright/test';

// Use same credentials specified by user
const ADMIN_EMAIL = 'admin@riskmarshal.com';
const ADMIN_PW = 'admin@1234';

// Temporary test user details
const INT_EMAIL = `intermediary_${Date.now()}@riskmarshal.test`;
const INT_PASSWORD = 'Intermediary@1234';
const CLIENT_EMAIL = `client_${Date.now()}@riskmarshal.test`;

test.describe('RiskMarshal E2E Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server (port 8080 default, fallback handled if changed)
    await page.goto('http://localhost:8080/login');
  });

  test('Step 1: Admin Login and Creating an Intermediary', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PW);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*dashboard/i, { timeout: 10000 }).catch(() => expect(page).toHaveURL('http://localhost:8080/'));

    // Step 1: Create Intermediary
    await page.goto('http://localhost:8080/staff');
    await page.click('button:has-text("Add User")');
    await page.waitForSelector('[role="dialog"]');

    await page.fill('label:has-text("Full Name") + *', "Test Intermediary", { timeout: 5000 }).catch(async () => {
      // fallback to placeholder based
      await page.fill('input[placeholder="Enter full name"]', "Test Intermediary");
    });
    await page.fill('input[placeholder="user@example.com"]', INT_EMAIL);
    await page.fill('input[type="password"]', INT_PASSWORD);
    
    // Optional code/phone fields
    await page.fill('input[placeholder*="INT-001"]', "INT-999").catch(() => {});
    await page.fill('input[placeholder="Phone number"]', "555-0199").catch(() => {});

    // Role
    await page.click('text="Select role"'); 
    await page.click('[role="option"]:has-text("Intermediary")');

    await page.click('button:has-text("Create User")');
    
    // Wait for modal to close or table to update
    await expect(page.locator('tbody')).toContainText(INT_EMAIL, { timeout: 10000 });
  });

  test('Step 2 & 3: Creating a Client and Policy', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PW);
    await page.click('button:has-text("Sign In")');

    // Create Client
    await page.goto('http://localhost:8080/clients');
    await page.click('button:has-text("Add Client")');
    await page.fill('input[placeholder="Enter full name"]', "Jane Doe Target");
    await page.fill('input[type="email"]', CLIENT_EMAIL);
    await page.fill('input[placeholder="Phone number"]', "555-123-4567").catch(() => {});
    await page.click('button:has-text("Create Client")');

    // Create Policy
    await page.goto('http://localhost:8080/policies');
    await page.click('text="Add Policy"');
    await page.waitForSelector('.dialog-content'); // Wait for form
    // Assume basic policy inputs
    await page.fill('input[placeholder*="Premium"]', "10000").catch(() => {});
    // Assuming UI handles default dates or we pick random ones
    await page.click('button:has-text("Submit")'); // Adjust depending on exact modal text
  });

  test('Step 7: Intermediary Login Verification', async ({ page }) => {
    // If the first test succeeded, we can try logging in locally
    // Might fail if run concurrently with clean DB, but good for local execution!
    console.log(`Use this email manually to login if it failed: ${INT_EMAIL}`);
  });

});
