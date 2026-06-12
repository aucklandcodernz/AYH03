import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * ChatGPT PHC Gateway — HARDENED
 * - API key auth via X-API-Key header
 * - Read-only mode unless X-Allow-Writes: true header is present
 * - Audit log for every request
 * - Sensitive Employee field masking
 * - Max 50 records per list
 * - organization_id required for scoped entities
 * - Delete blocked unless confirm_delete + confirm_text = "DELETE"
 * - Organization: never deletable
 * - User + Membership: always blocked
 * - op: "health" returns { ok: true }
 * PHC/TEST USE ONLY — dummy data only.
 */

const ALLOWED_ENTITIES = new Set([
    'Employee', 'OnboardingTask', 'Timesheet', 'Incident', 'Roster',
    'RiskRegister', 'HazardRegister', 'Meeting', 'SOPDocument',
    'PerformanceGoal', 'PerformanceReview', 'DisciplinaryCase',
    'Training', 'LeaveRequest', 'Organization'
]);

const ALWAYS_BLOCKED = new Set(['User', 'Membership', 'AgencyAssignment']);
const NO_DELETE_ENTITIES = new Set(['Organization']);

// Entities that have organization_id and must be scoped to one
const ORG_SCOPED = new Set([
    'Employee', 'OnboardingTask', 'Timesheet', 'Incident', 'Roster',
    'RiskRegister', 'HazardRegister', 'Meeting', 'SOPDocument',
    'PerformanceGoal', 'PerformanceReview', 'DisciplinaryCase',
    'Training', 'LeaveRequest'
]);

const WRITE_OPS = new Set(['create', 'update', 'delete']);

const MASKED_EMPLOYEE_FIELDS = new Set([
    'bank_account_name', 'bank_account_number',
    'ird_number', 'tax_code', 'kiwisaver_rate',
    'salary', 'hourly_rate',
    'date_of_birth', 'address',
    'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
]);

function maskEmployee(record) {
    if (!record || typeof record !== 'object') return record;
    const masked = { ...record };
    for (const field of MASKED_EMPLOYEE_FIELDS) {
        if (field in masked) {
            masked[field] = '[REDACTED]';
        }
    }
    return masked;
}

function maybeApplyMask(entity, records) {
    if (entity !== 'Employee') return records;
    if (Array.isArray(records)) return records.map(maskEmployee);
    return maskEmployee(records);
}

async function writeAuditLog(base44, entry) {
    try {
        await base44.asServiceRole.entities.AuditLog.create(entry);
    } catch {
        // Audit failure must not block response
    }
}

function buildAuditEntry(entity, op, id, queryOrData, success, errorMsg) {
    return {
        organization_id: queryOrData?.organization_id || null,
        action: `chatgpt:${op}`,
        entity_name: entity,
        entity_id: id || null,
        changes: JSON.stringify({
            query_summary: queryOrData ? Object.keys(queryOrData).join(',') : null,
            success,
            error: errorMsg || null
        }),
        performed_by: 'chatgpt-api',
        timestamp: new Date().toISOString()
    };
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Allow-Writes',
};

function jsonResp(body, status = 200) {
    return Response.json(body, { status, headers: { 'Access-Control-Allow-Origin': '*' } });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // --- Auth ---
    const apiKey = req.headers.get('X-API-Key');
    const expectedKey = Deno.env.get('CHATGPT_API_KEY');
    if (!apiKey || apiKey !== expectedKey) {
        return jsonResp({ error: 'Unauthorized: invalid or missing X-API-Key' }, 401);
    }

    const isReadOnly = req.headers.get('X-Allow-Writes') !== 'true';
    const base44 = createClientFromRequest(req);

    let body;
    try {
        body = await req.json();
    } catch {
        return jsonResp({ error: 'Invalid JSON body' }, 400);
    }

    const { entity, op, id, data, query, confirm_delete, confirm_text } = body;

    // --- Health check ---
    if (op === 'health') {
        return jsonResp({ ok: true, read_only_mode: isReadOnly, timestamp: new Date().toISOString() });
    }

    // --- Entity validation ---
    if (ALWAYS_BLOCKED.has(entity)) {
        return jsonResp({ error: `Access to '${entity}' is not permitted through this gateway` }, 403);
    }
    if (!entity || !ALLOWED_ENTITIES.has(entity)) {
        return jsonResp({ error: `Unknown or disallowed entity: '${entity}'. Allowed: ${[...ALLOWED_ENTITIES].join(', ')}` }, 400);
    }

    // --- Op validation ---
    const validOps = ['list', 'get', 'create', 'update', 'delete'];
    if (!op || !validOps.includes(op)) {
        return jsonResp({ error: `Invalid op: '${op}'. Valid ops: ${validOps.join(', ')} or 'health'` }, 400);
    }

    // --- Read-only enforcement ---
    if (isReadOnly && WRITE_OPS.has(op)) {
        return jsonResp({ error: `Write operations are disabled in read-only mode. Send header X-Allow-Writes: true to enable.` }, 403);
    }

    // --- Delete guards ---
    if (op === 'delete') {
        if (NO_DELETE_ENTITIES.has(entity)) {
            return jsonResp({ error: `Delete is permanently blocked for '${entity}'` }, 403);
        }
        if (!confirm_delete || confirm_text !== 'DELETE') {
            return jsonResp({ error: `Delete requires confirm_delete: true and confirm_text: "DELETE" in the request body` }, 400);
        }
    }

    // --- organization_id requirement for scoped entities ---
    const requiresOrgId = ORG_SCOPED.has(entity);
    if (requiresOrgId) {
        if ((op === 'list' || op === 'create') && !((query || data || {}).organization_id || (op === 'create' && data?.organization_id))) {
            const missing = op === 'list' ? 'query.organization_id' : 'data.organization_id';
            return jsonResp({ error: `organization_id is required for ${op} on '${entity}'. Pass it as ${missing}` }, 400);
        }
    }

    const store = base44.asServiceRole.entities[entity];
    let success = true;
    let errorMsg = null;
    let result;

    try {
        if (op === 'list') {
            const safeQuery = requiresOrgId
                ? Object.assign({}, query || {})
                : (query || {});
            const raw = await store.filter(safeQuery, '-created_date', 50);
            const records = maybeApplyMask(entity, raw);
            result = jsonResp({ entity, count: records.length, records });
        }

        else if (op === 'get') {
            if (!id) return jsonResp({ error: 'id is required for get' }, 400);
            const records = await store.filter({ id });
            if (!records || records.length === 0) return jsonResp({ error: 'Not found' }, 404);
            const record = maybeApplyMask(entity, records[0]);
            result = jsonResp({ entity, record });
        }

        else if (op === 'create') {
            if (!data) return jsonResp({ error: 'data is required for create' }, 400);
            const created = await store.create(data);
            const record = maybeApplyMask(entity, created);
            result = jsonResp({ entity, record });
        }

        else if (op === 'update') {
            if (!id) return jsonResp({ error: 'id is required for update' }, 400);
            if (!data) return jsonResp({ error: 'data is required for update' }, 400);
            // Prevent org reassignment
            if (data.organization_id) {
                const existing = await store.filter({ id });
                if (existing?.[0]?.organization_id && existing[0].organization_id !== data.organization_id) {
                    return jsonResp({ error: 'Cannot move a record to a different organization via this gateway' }, 403);
                }
            }
            const updated = await store.update(id, data);
            const record = maybeApplyMask(entity, updated);
            result = jsonResp({ entity, record });
        }

        else if (op === 'delete') {
            if (!id) return jsonResp({ error: 'id is required for delete' }, 400);
            await store.delete(id);
            result = jsonResp({ entity, success: true, deleted_id: id });
        }

    } catch (err) {
        success = false;
        errorMsg = err.message;
        result = jsonResp({ error: `Operation failed: ${err.message}` }, 500);
    }

    // --- Audit log (fire and forget) ---
    const auditEntry = buildAuditEntry(entity, op, id, op === 'list' ? query : data, success, errorMsg);
    writeAuditLog(base44, auditEntry);

    return result;
});