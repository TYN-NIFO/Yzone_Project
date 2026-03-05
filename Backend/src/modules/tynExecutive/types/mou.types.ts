export interface MOUUpload {
  id: string;
  tenant_id: string;
  uploaded_by: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  expiry_date?: Date;
  version: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMOURequest {
  title: string;
  description?: string;
  expiry_date?: string;
}

export interface UpdateMOUStatusRequest {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}