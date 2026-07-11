// ============================================
// ROLE TYPES
// ============================================

export type UserRole = 'student' | 'seller_pending' | 'seller' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected';
export type SellerRequestStatus = 'pending' | 'approved' | 'rejected';

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;            // kept for legacy compat (maps to full_name in DB)
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  created_at?: string;
}

// ============================================
// SELLER REQUEST
// ============================================

export interface SellerRequest {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  status: SellerRequestStatus;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// ============================================
// CONTENT TYPES
// ============================================

export interface Course {
  id: string;
  name: string;
  created_at?: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  course_id: string;
  subject: string;
  price: number;
  pdf_url: string;
  thumbnail_url: string;
  preview_images: string[];
  status: 'active' | 'draft';
  semester?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  razorpay_payment_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
  email_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  note_id: string;
  price: number;
  note?: Note;
}

export interface Review {
  id: string;
  note_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem {
  note: Note;
  quantity: number;
}

export interface Subject {
  id: string;
  name: string;
  course_id: string;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  store_name?: string;
  bio?: string;
  upi_id?: string;
  bank_details?: any;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  note_id: string;
  created_at: string;
  note?: Note;
}

export interface Payment {
  id: string;
  order_id?: string;
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount: number;
  status: 'pending' | 'captured' | 'failed';
  created_at: string;
}

export interface Download {
  id: string;
  user_id?: string;
  note_id: string;
  ip_address?: string;
  downloaded_at: string;
  note?: Note;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

export interface Settings {
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expiry_date?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_type: string;
  properties?: any;
  created_at: string;
}
