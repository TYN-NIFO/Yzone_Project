import { pool } from '../../../config/db';
import { MOUUpload, CreateMOURequest, UpdateMOUStatusRequest } from '../types/mou.types';

export class MOUService {
  static async createMOU(
    tenantId: string,
    uploadedBy: string,
    mouData: CreateMOURequest,
    fileData: { fileName: string; fileUrl: string; fileSize?: number; fileType?: string }
  ): Promise<MOUUpload> {
    const query = `
      INSERT INTO mou_uploads (
        tenant_id, uploaded_by, title, description, file_name, file_url, 
        file_size, file_type, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      tenantId,
      uploadedBy,
      mouData.title,
      mouData.description || null,
      fileData.fileName,
      fileData.fileUrl,
      fileData.fileSize || null,
      fileData.fileType || null,
      mouData.expiry_date ? new Date(mouData.expiry_date) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getMOUsByTenant(tenantId: string): Promise<MOUUpload[]> {
    const query = `
      SELECT m.*, u.name as uploaded_by_name, a.name as approved_by_name
      FROM mou_uploads m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN users a ON m.approved_by = a.id
      WHERE m.tenant_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }

  static async getMOUById(mouId: string, tenantId: string): Promise<MOUUpload | null> {
    const query = `
      SELECT m.*, u.name as uploaded_by_name, a.name as approved_by_name
      FROM mou_uploads m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN users a ON m.approved_by = a.id
      WHERE m.id = $1 AND m.tenant_id = $2 AND m.deleted_at IS NULL
    `;

    const result = await pool.query(query, [mouId, tenantId]);
    return result.rows[0] || null;
  }

  static async updateMOUStatus(
    mouId: string,
    tenantId: string,
    approvedBy: string,
    statusData: UpdateMOUStatusRequest
  ): Promise<MOUUpload | null> {
    const query = `
      UPDATE mou_uploads 
      SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP,
          rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND tenant_id = $5 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [
      statusData.status,
      approvedBy,
      statusData.rejection_reason || null,
      mouId,
      tenantId
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteMOU(mouId: string, tenantId: string): Promise<boolean> {
    const query = `
      UPDATE mou_uploads 
      SET deleted_at = CURRENT_TIMESTAMP, is_active = false
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [mouId, tenantId]);
    return (result.rowCount || 0) > 0;
  }

  static async getMOUStats(tenantId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_mous,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_mous,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_mous,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_mous,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_mous
      FROM mou_uploads 
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [tenantId]);
    return result.rows[0];
  }
}