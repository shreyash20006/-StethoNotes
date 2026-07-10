export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  role: 'student' | 'admin';
  created_at?: string;
}

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
