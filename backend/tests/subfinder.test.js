const subfinder = require("../scans/subfinder");

test("subfinder runs and returns array", async () => {
  const result = await subfinder("example.com");
  expect(Array.isArray(result)).toBe(true);
});
