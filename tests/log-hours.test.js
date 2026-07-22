const { test, expect } = require("@playwright/test");

const logEntries = require("../data.json");
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

test("Log 'On The Job' Hours", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("https://smartassessor.co.uk/Account");
  await page.getByRole("textbox", { name: "Username" }).fill(USERNAME);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);

  // Click Log In
  await page.getByRole("button", { name: "Log In" }).click();

  // Dismiss the 2FA modal if it pops up
  const setupLaterBtn = page
    .getByRole("button", { name: /Set up later/i })
    .or(page.getByText(/Set up later/i));

  try {
    await setupLaterBtn.waitFor({ state: "visible", timeout: 5000 });
    await setupLaterBtn.click();
    console.log("⚠️ Dismissed 2FA setup popup.");
  } catch (error) {
    console.log("No 2FA popup detected, proceeding...");
  }

  // Navigate to DEVOPS ENGINEER course
  const devopsCourse = page.locator("text=/DEVOPS ENGINEER/i");
  await devopsCourse.first().waitFor({ state: "visible", timeout: 15000 });
  await devopsCourse.first().click();

  await page.getByRole("link", { name: "Time Log" }).click();

  for (const entry of logEntries) {
    console.log(`Processing: ${entry.date}`);

    await page.getByRole("button", { name: "Add New Timelog Entry" }).click();

    const logFrame = page.frameLocator("#formModalFrame");

    await logFrame
      .getByRole("textbox", { name: "Select Activity Date" })
      .fill(entry.date);

    await logFrame
      .getByLabel("Select Activity Type")
      .selectOption({ label: "Gaining technical experience by doing my job" });

    await logFrame
      .getByLabel("Select Course")
      .selectOption({ label: "DEVOPS ENGINEER (2021) 548" });

    await logFrame
      .getByLabel("Select Assessor")
      .selectOption({ label: "Dom Patmore" });

    await logFrame
      .getByLabel("Was it on the Job?")
      .selectOption({ label: "On the job" });

    await logFrame
      .getByRole("textbox", { name: "Time Spent on Activity" })
      .fill(entry.timeSpent);

    await logFrame
      .getByRole("textbox", { name: "Activity Start Time" })
      .fill(entry.startTime);

    await logFrame
      .getByRole("textbox", { name: "What impact has this activity" })
      .fill("N/A");

    await logFrame.getByRole("button", { name: "Add Activity" }).click();

    await page.locator("#formModalFrame").waitFor({ state: "hidden" });

    const timesheetTable = page.locator("table.timesheet");

    const expectedRow = timesheetTable
      .locator("tr")
      .filter({
        hasText: entry.date,
      })
      .filter({
        hasText: entry.timeSpent,
      });

    try {
      await expect(expectedRow).toBeVisible({ timeout: 5000 });
      console.log(`✅ ${entry.date} has been added`);
    } catch (error) {
      console.error(`Couldn't find ${entry.date}`);
      throw error;
    }
  }
});