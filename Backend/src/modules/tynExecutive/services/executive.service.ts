import { pool } from "../../../config/db";

export const getTenants = async (tenantId?: string) => {
    if (tenantId) {
        const r = await pool.query(
            "SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL", [tenantId]
        );
        return r.rows;
    }
    const r = await pool.query("SELECT * FROM tenants WHERE deleted_at IS NULL ORDER BY created_at DESC");
    return r.rows;
};

export const getTenantById = async (id: string) => {
    const r = await pool.query(
        "SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL", [id]
    );
    return r.rows[0] || null;
};

export const createTenant = async (data: {
    college_name: string; principal_name: string; email: string;
    phone?: string; address?: string; status?: string;
}) => {
    const r = await pool.query(
        `INSERT INTO tenants (college_name, principal_name, email, phone, address, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [data.college_name, data.principal_name, data.email,
        data.phone || null, data.address || null, data.status || "ACTIVE"]
    );
    return r.rows[0];
};

export const getCohortsForTenant = async (tenantId: string) => {
    const r = await pool.query(
        "SELECT * FROM cohorts WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC",
        [tenantId]
    );
    return r.rows;
};

export const createCohort = async (data: {
    tenant_id: string; name: string; start_date?: string; end_date?: string;
}) => {
    const r = await pool.query(
        `INSERT INTO cohorts (tenant_id, name, start_date, end_date)
     VALUES ($1,$2,$3,$4) RETURNING *`,
        [data.tenant_id, data.name, data.start_date || null, data.end_date || null]
    );
    return r.rows[0];
};

export const getUsersByRole = async (role: string, tenantId: string) => {
    const r = await pool.query(
        `SELECT id, name, email, phone, role, cohort_id, created_at
     FROM users WHERE role = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [role, tenantId]
    );
    return r.rows;
};

export const assignFacilitatorToCohort = async (
    facilitatorId: string, cohortId: string, tenantId: string
) => {
    const r = await pool.query(
        `INSERT INTO facilitator_cohorts (facilitator_id, cohort_id, tenant_id)
     VALUES ($1,$2,$3)
     ON CONFLICT(facilitator_id, cohort_id) DO NOTHING
     RETURNING *`,
        [facilitatorId, cohortId, tenantId]
    );
    return r.rows[0];
};

export const getDashboardStats = async () => {
    const [tenants, cohorts, students, trackers] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL"),
        pool.query("SELECT COUNT(*) FROM cohorts WHERE deleted_at IS NULL"),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL"),
        pool.query(`SELECT 
      COUNT(*) FILTER (WHERE entry_date = CURRENT_DATE) as today_submissions,
      COUNT(DISTINCT student_id) as unique_submitters
      FROM tracker_entries WHERE entry_date >= CURRENT_DATE - INTERVAL '7 days'`),
    ]);

    const totalStudents = parseInt(students.rows[0].count);
    const todaySubmissions = parseInt(trackers.rows[0].today_submissions);
    const compliancePct = totalStudents > 0
        ? Math.round((todaySubmissions / totalStudents) * 100)
        : 0;

    return {
        totalTenants: parseInt(tenants.rows[0].count),
        totalCohorts: parseInt(cohorts.rows[0].count),
        totalStudents,
        todayTrackerSubmissions: todaySubmissions,
        trackerCompliancePct: compliancePct,
    };
};
