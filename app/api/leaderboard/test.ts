/**
 * Test file for the leaderboard API endpoint
 * Run this with: npx tsx app/api/leaderboard/test.ts
 */

import { GET } from './route';

async function testLeaderboardAPI() {
  console.log('Testing Leaderboard API...\n');

  // Test 1: Basic request
  console.log('Test 1: Basic request');
  const request1 = new Request('http://localhost:3000/api/leaderboard');
  const response1 = await GET(request1 as any);
  const data1 = await response1.json();
  console.log('Response:', JSON.stringify(data1, null, 2));
  console.log('Status:', response1.status);
  console.log('✅ Basic request test completed\n');

  // Test 2: With period filter
  console.log('Test 2: With period filter (weekly)');
  const request2 = new Request('http://localhost:3000/api/leaderboard?period=weekly');
  const response2 = await GET(request2 as any);
  const data2 = await response2.json();
  console.log('Response:', JSON.stringify(data2, null, 2));
  console.log('✅ Period filter test completed\n');

  // Test 3: With pagination
  console.log('Test 3: With pagination');
  const request3 = new Request('http://localhost:3000/api/leaderboard?page=1&limit=2');
  const response3 = await GET(request3 as any);
  const data3 = await response3.json();
  console.log('Response:', JSON.stringify(data3, null, 2));
  console.log('✅ Pagination test completed\n');

  console.log('All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testLeaderboardAPI().catch(console.error);
}