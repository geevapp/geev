import { DELETE, PATCH } from './[id]/route';
import { POST, GET } from './route';

const testPostsAPI = async () => {
    console.log('========================================');
    console.log('      Testing POSTS API endpoints       ');
    console.log('========================================\n');

    const BASE_URL = 'http://localhost:3000/api/posts';
    let createdPostId: string | null = null;

    console.log('[1] GET /api/posts  →  basic list');
    const req1 = new Request(BASE_URL);
    const res1 = await GET(req1 as any);
    const json1 = await res1.json();

    console.log('  Status       :', res1.status);
    console.log('  Success      :', json1.success);
    console.log('  Posts count  :', json1.data?.posts?.length ?? '—');
    console.log('  Pagination   :', json1.data?.page, 'of', json1.data?.total ?? '—');
    console.log('  First title  :', json1.data?.posts?.[0]?.title || '(no posts)');
    console.log('----------------------------------------\n');

    console.log('[2] GET /api/posts  →  giveaway + crypto + small page');
    const req2 = new Request(
        `${BASE_URL}?page=1&limit=3&type=giveaway&category=crypto`
    );
    const res2 = await GET(req2 as any);
    const json2 = await res2.json();

    console.log('  Status       :', res2.status);
    console.log('  Posts found  :', json2.data?.posts?.length ?? '—');
    console.log('----------------------------------------\n');

    console.log('[3] POST /api/posts  →  create new giveaway');
    const newPostPayload = {
        title: 'API Test Giveaway – Like & Win Test Tokens',
        description:
            'This post was created automatically from the test script. ' +
            'Like this post and drop your favorite emoji below to participate. ' +
            'Testing automation – please ignore.',
        category: 'general',
        type: 'giveaway',
        winnerCount: 2,
        endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const req3 = new Request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(newPostPayload),
    });

    const res3 = await POST(req3 as any);
    const json3 = await res3.json();

    console.log('  Status       :', res3.status);
    console.log('  Success      :', json3.success);

    if (json3.success && json3.data?.id) {
        createdPostId = json3.data.id;
        console.log('  Created ID   :', createdPostId);
        console.log('  Title        :', json3.data.title);
    } else {
        console.log('  Error        :', json3.error);
    }
    console.log('----------------------------------------\n');

    if (createdPostId) {
        console.log('[4] GET /api/posts/[id]  →  fetch created post');
        const req4 = new Request(`${BASE_URL}/${createdPostId}`);
        const res4 = await GET(req4 as any);
        const json4 = await res4.json();

        console.log('  Status       :', res4.status);
        console.log('  Success      :', json4.success);
        console.log('  Title        :', json4.data?.title);
        console.log('  _count.entries :', json4.data?._count?.entries ?? '—');
        console.log('----------------------------------------\n');
    } else {
        console.log('[4] SKIPPED → no post created\n');
    }

    if (createdPostId) {
        console.log('[5] PATCH /api/posts/[id]  →  update title');
        const patchData = {
            title: 'UPDATED TITLE - ' + new Date().toISOString(),
            description: 'Updated via test script',
        };
        const patchRequest = new Request(`${BASE_URL}/${createdPostId}`, {
            method: 'PATCH',
            body: JSON.stringify(patchData),
        });
        const res5 = await PATCH(
            patchRequest as any,
            {
                params: Promise.resolve({ id: createdPostId })
            }
        );
        console.log('----------------------------------------\n');
    } else {
        console.log('[5] SKIPPED → no post created\n');
    }

    if (createdPostId) {
        console.log('[6] DELETE /api/posts/[id]  →  cleanup');
        const deleteRequest = new Request(`${BASE_URL}/${createdPostId}`, {
            method: 'DELETE',
        });

        const res6 = await DELETE(
            deleteRequest as any,
            {
                params: Promise.resolve({ id: createdPostId })
            }
        );
        const json6 = await res6.json();

        console.log('  Status       :', res6.status);
        console.log('  Success      :', json6.success);
        console.log('  Message      :', json6.data?.deleted ? 'Deleted' : json6.error);
        console.log('----------------------------------------\n');
    } else {
        console.log('[6] SKIPPED → no post created\n');
    }

    console.log('\n');
    console.log('====================================');
    console.log('         Tests completed             ');
    console.log('====================================');
}

if (require.main === module) {
    testPostsAPI().catch((err) => {
        console.error('\nTest suite failed:', err);
        process.exit(1);
    });
}