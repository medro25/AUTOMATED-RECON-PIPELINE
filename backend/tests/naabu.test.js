const naabu = require("../scans/naabu");

test("naabu returns empty array when there are no alive hosts", async () => {
  const result = await naabu([]);
  expect(result).toEqual([]);
});

test("naabu explains common web ports", () => {
  expect(naabu.explainPort(80)).toEqual({
    port: 80,
    service: "HTTP",
    description: "Normal website traffic",
    risk: "Usually normal for public websites; security depends on the web app."
  });
  expect(naabu.explainPort("443").service).toBe("HTTPS");
});

test("naabu explains unknown ports generically", () => {
  expect(naabu.explainPort(9999)).toEqual({
    port: 9999,
    service: "Unknown service",
    description: "A service is listening on this port",
    risk: "Investigate whether this service should be public."
  });
});

test("naabu extracts hostnames from URLs before scanning", () => {
  expect(naabu.extractHostname("http://testasp.vulnweb.com/showthread.asp?id=0")).toBe("testasp.vulnweb.com");
  expect(naabu.extractHostname({ url: "https://example.com:8443/path" })).toBe("example.com");
});

test("naabu normalizes JSON findings with identified services", () => {
  const result = naabu.normalizeNaabuFinding({
    host: "testasp.vulnweb.com:80",
    ip: "44.228.249.3",
    port: "80"
  });

  expect(result).toMatchObject({
    host: "testasp.vulnweb.com",
    ip: "44.228.249.3",
    port: 80,
    service: "HTTP",
    portInfo: {
      port: 80,
      service: "HTTP"
    }
  });
});

test("naabu parses plain host port output as a fallback", () => {
  expect(naabu.parseNaabuLine("example.com:443")).toEqual({
    host: "example.com",
    port: 443
  });
});
