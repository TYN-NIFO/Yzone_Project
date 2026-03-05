export interface TrackerFeedback {
  id: string;
  tracker_entry_id: string;
  facilitator_id: string;
  tenant_id: string;
  feedback: string;
  rating: number;
  suggestions?: string;
  is_approved?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTrackerFeedbackRequest {
  tracker_entry_id: string;
  feedback: string;
  rating: number;
  suggestions?: string;
  is_approved?: boolean;
}

export interface TrackerEntryWithFeedback {
  id: string;
  student_id: string;
  student_name: string;
  entry_date: Date;
  tasks_completed: string;
  learning_summary: string;
  hours_spent: number;
  challenges?: string;
  proof_file_url?: string;
  submitted_at: Date;
  feedback?: TrackerFeedback;
}