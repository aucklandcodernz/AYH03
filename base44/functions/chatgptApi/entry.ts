import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * ChatGPT Custom GPT API Gateway
 * Authenticates via X-API-Key header (CHATGPT_API_KEY secret).
 * Operates as service role — full platform access.
 * Exposes: list, get, create, update, delete across all allowed HR entities.
 */

const ALLOWED_ENTITIES = new Set([
    'Employee', 'OnboardingTask', 'Timesheet', 'Incident', 'Roster',
    'RiskRegister', 'HazardRegister', 'Meeting', 'SOPDocument',
    'PerformanceGoal', 'PerformanceReview', 'DisciplinaryCase',
    'Training', 'LeaveRequest', 'Organization'
]);

Deno.serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
            }
        });
    }

    // Auth: validate API key
    const apiKey = req.headers.get('X-API-Key');
    const expectedKey = Deno.env.get('CHATGPT_API_KEY');
    if (!apiKey || apiKey !== expectedKey) {
        return Response.json({ error: 'Unauthorized: invalid or missing X-API-Key' }, {
            status: 401,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { entity, op, id, data, query } = body;

    // Validate entity
    if (!entity || !ALLOWED_ENTITIES.has(entity)) {
        return Response.json({ error: `Unknown or disallowed entity: '${entity}'. Allowed: ${[...ALLOWED_ENTITIES].join(', ')}` }, {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Validate op
    const validOps = ['list', 'get', 'create', 'update', 'delete'];
    if (!op || !validOps.includes(op)) {
        return Response.json({ error: `Invalid op: '${op}'. Valid ops: ${validOps.join(', ')}` }, {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }

    const store = base44.asServiceRole.entities[entity];
    const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

    if (op === 'list') {
        const result = await store.filter(query || {});
        return Response.json({ entity, count: result.length, records: result }, { headers: corsHeaders });
    }

    if (op === 'get') {
        if (!id) return Response.json({ error: 'id is required for get' }, { status: 400, headers: corsHeaders });
        const records = await store.filter({ id });
        if (!records || records.length === 0) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
        return Response.json({ entity, record: records[0] }, { headers: corsHeaders });
    }

    if (op === 'create') {
        if (!data) return Response.json({ error: 'data is required for create' }, { status: 400, headers: corsHeaders });
        const created = await store.create(data);
        return Response.json({ entity, record: created }, { headers: corsHeaders });
    }

    if (op === 'update') {
        if (!id) return Response.json({ error: 'id is required for update' }, { status: 400, headers: corsHeaders });
        if (!data) return Response.json({ error: 'data is required for update' }, { status: 400, headers: corsHeaders });
        const updated = await store.update(id, data);
        return Response.json({ entity, record: updated }, { headers: corsHeaders });
    }

    if (op === 'delete') {
        if (!id) return Response.json({ error: 'id is required for delete' }, { status: 400, headers: corsHeaders });
        await store.delete(id);
        return Response.json({ entity, success: true, deleted_id: id }, { headers: corsHeaders });
    }
});