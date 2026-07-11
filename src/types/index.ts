// ============================================
// ROLE TYPES
// ============================================

export type UserRole = 'student' | 'seller_pending' | 'seller' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'suspended';
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
  seller_id?: string;
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
  user_email?: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  is_reported: boolean;
  helpful_count?: number;
  unhelpful_count?: number;
  user_vote?: 'helpful' | 'unhelpful' | null;
  created_at: string;
  updated_at?: string;
  note_title?: string;
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
  user_email?: string; // helper
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
  min_purchase?: number;
  max_discount?: number;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_type: string;
  properties?: any;
  created_at: string;
}

// ============================================
// MARKETPLACE EXPANSION TYPES
// ============================================

export interface SellerPayout {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_email?: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_details?: any;
  upi_id?: string;
  transaction_id?: string;
  payout_date?: string;
  created_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  used_at: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  user_id: string;
  vote_type: 'helpful' | 'unhelpful';
  created_at: string;
}

export interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  user_role?: string;
  comment: string;
  is_reported: boolean;
  created_at: string;
  updated_at?: string;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  user_role?: string;
  reply: string;
  is_reported: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RecentlyViewedItem {
  id: string;
  user_id: string;
  note_id: string;
  viewed_at: string;
  note?: Note;
}

export interface SeoMetadata {
  path: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  canonical_url?: string;
  json_ld?: any;
  updated_at?: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body_html: string;
  brevo_template_id?: number;
  updated_at?: string;
}

export interface ProductTag {
  id: string;
  note_id: string;
  tag: string;
}

export interface ProductView {
  id: string;
  note_id: string;
  user_id?: string;
  viewed_at: string;
}

export interface AnalyticsDaily {
  date: string;
  revenue: number;
  orders: number;
  downloads: number;
  signups: number;
}

export interface AnalyticsMonthly {
  month: string;
  revenue: number;
  orders: number;
  downloads: number;
  signups: number;
}

export interface StorageReport {
  id: string;
  pdf_count: number;
  image_count: number;
  preview_count: number;
  storage_used_bytes: number;
  calculated_at: string;
}
