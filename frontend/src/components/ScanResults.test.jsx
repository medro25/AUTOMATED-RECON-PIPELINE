import { render, screen } from '@testing-library/react';
import ScanResults from './ScanResults';

test('renders identified open port details near the summary', () => {
  render(
    <ScanResults
      results={{
        domain: 'testasp.vulnweb.com',
        subdomains: [],
        alive: [],
        ports: [
          {
            host: 'testasp.vulnweb.com',
            ip: '44.228.249.3',
            port: 80,
            service: 'HTTP',
            portInfo: {
              port: 80,
              service: 'HTTP',
              description: 'Normal website traffic',
              risk: 'Usually normal for public websites; security depends on the web app.'
            }
          }
        ],
        vulns: [],
        metadata: {}
      }}
    />
  );

  expect(screen.getByText(/open port details/i)).toBeInTheDocument();
  expect(screen.getByText('testasp.vulnweb.com')).toBeInTheDocument();
  expect(screen.getAllByText('80').length).toBeGreaterThan(0);
  expect(screen.getAllByText('HTTP').length).toBeGreaterThan(0);
});
