/**
 * Test script for Entry API endpoints
 * Run this to verify all entry API functionality works as expected
 */

async function testAPI() {
  const BASE_URL = 'http://localhost:3000/api';
  const TEST_USER_ID = 'user-1';
  const TEST_POST_ID = 'post-1';
  
  console.log('🧪 Testing Entry API Endpoints...\n');

  // Test 1: Submit Entry (POST /posts/{id}/entries)
  console.log('1. Testing POST /posts/{id}/entries');
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
      body: JSON.stringify({
        content: 'This is a test entry submission! I hope to win this amazing giveaway.',
        proofUrl: 'https://example.com/test-proof.jpg',
      }),
    });

    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Submit Duplicate Entry (should fail)
  console.log('2. Testing duplicate entry submission (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
      body: JSON.stringify({
        content: 'Another entry - this should fail',
      }),
    });

    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Get Post Entries (GET /posts/{id}/entries)
  console.log('3. Testing GET /posts/{id}/entries');
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`, {
      headers: {
        'x-user-id': TEST_USER_ID,
      },
    });

    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Found', data.data?.length || 0, 'entries');
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Get User Entries (GET /users/{id}/entries)
  console.log('4. Testing GET /users/{id}/entries');
  try {
    const response = await fetch(`${BASE_URL}/users/${TEST_USER_ID}/entries`, {
      headers: {
        'x-user-id': TEST_USER_ID,
      },
    });

    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ User has', data.data?.totalEntries || 0, 'entries');
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 5: Get Single Entry (GET /entries/{id})
  console.log('5. Testing GET /entries/{id}');
  try {
    // First, get an entry ID from the post entries
    const entriesResponse = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`, {
      headers: { 'x-user-id': TEST_USER_ID },
    });
    const entriesData = await entriesResponse.json();
    const entryId = entriesData.data?.[0]?.id;

    if (entryId) {
      const response = await fetch(`${BASE_URL}/entries/${entryId}`);
      const data = await response.json();
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️ No entries found to test');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 6: Delete Entry (DELETE /entries/{id})
  console.log('6. Testing DELETE /entries/{id}');
  try {
    // First, submit a new entry to delete
    const submitResponse = await fetch(`${BASE_URL}/posts/post-2/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
      body: JSON.stringify({
        content: 'This entry will be deleted',
      }),
    });

    const submitData = await submitResponse.json();
    const entryId = submitData.data?.id;

    if (entryId) {
      // Now delete it
      const response = await fetch(`${BASE_URL}/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': TEST_USER_ID,
        },
      });

      const data = await response.json();
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️ Failed to create entry for deletion test');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 7: Error Cases
  console.log('7. Testing Error Cases');

  // Test 7a: Unauthorized access
  console.log('7a. Testing unauthorized access');
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`);
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 7b: Invalid content length
  console.log('7b. Testing invalid content length');
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
      body: JSON.stringify({
        content: 'Short', // Less than 10 characters
      }),
    });

    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🎉 All tests completed!');
}

// Run the tests
testAPI().catch(console.error);
