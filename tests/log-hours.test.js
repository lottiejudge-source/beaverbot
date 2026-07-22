const { test, expect } = require("@playwright/test");

const logEntries = require("../data.json");
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

test("Log 'On The Job' Hours", async ({ page }) => {
  test.setTimeout(120000); // Increased timeout to accommodate multiple frame submissions

  await page.goto("https://smartassessor.co.uk/Account");
  await page.getByRole("textbox", { name: "Username" }).fill(USERNAME);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);

  // Fix 1: Wait for post-login navigation to finish cleanly
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "Log In" }).click(),
  ]);

  // Fix 2: Fallback element match in case the course isn't strictly role="link"
  const devopsCourse = page
    .getByRole("link", { name: /DEVOPS ENGINEER/i })
    .or(page.getByText(/DEVOPS ENGINEER/i));

  await devopsCourse.waitFor({ state: "visible", timeout: 15000 });
  await devopsCourse.click();

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