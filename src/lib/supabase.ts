import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabase = Boolean(supabaseUrl && supabaseAnonKey);

// ==========================================
// ADMIN EMAIL WHITELIST
// ==========================================

export const ADMIN_EMAILS: Record<string, 'admin' | 'super_admin'> = {
  'shreyashumedkumarborkar@gmail.com': 'super_admin',
  'sb108750@gmail.com': 'admin',
};

export function getAdminRole(email: string): 'admin' | 'super_admin' | null {
  return ADMIN_EMAILS[email.toLowerCase().trim()] || null;
}

// ==========================================
// MOCK SUPABASE CLIENT IMPLEMENTATION
// ==========================================

const initializeMockData = () => {
  if (!localStorage.getItem('stetho_courses')) {
    const mockCourses = [
      { id: 'c1', name: 'MBBS' },
      { id: 'c2', name: 'BHMS' },
      { id: 'c3', name: 'BAMS' },
      { id: 'c4', name: 'BSc Nursing' },
      { id: 'c5', name: 'B.Pharma' },
      { id: 'c6', name: 'BPT' },
      { id: 'c7', name: 'Paramedical' }
    ];
    localStorage.setItem('stetho_courses', JSON.stringify(mockCourses));
  }

  if (!localStorage.getItem('stetho_notes')) {
    const mockNotes = [
      {
        id: 'n1',
        title: 'Anatomy Upper Limb Lecture Notes',
        description: 'Comprehensive, high-yield lecture notes on Upper Limb Anatomy including bones, muscles, nerves, and clinical correlations. Curated by top medical students, includes hand-drawn diagrams and mnemonics for BHMS/MBBS students.',
        course_id: 'c1',
        subject: 'Anatomy',
        price: 299.00,
        pdf_url: 'pdfs/anatomy_upper_limb.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400',
          'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'n2',
        title: 'Physiology Cardiovascular System Study Guide',
        description: 'Master cardiac cycle, blood pressure regulation, and ECG interpretation. Includes high-quality summary tables, flowcharts, and practice questions. Essential for MBBS/BAMS first-year students.',
        course_id: 'c1',
        subject: 'Physiology',
        price: 199.00,
        pdf_url: 'pdfs/physio_cvs.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'n3',
        title: 'Organon of Medicine - BHMS High-Yield Notes',
        description: 'Detailed study notes explaining Hahnemannian principles, homoeopathic philosophy, and aphorism breakdowns. Ideal for professional examinations.',
        course_id: 'c2',
        subject: 'Organon of Medicine',
        price: 249.00,
        pdf_url: 'pdfs/organon.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'n4',
        title: 'BAMS Dravyaguna Vijnana Notes',
        description: 'Essential Ayurvedic pharmacology, classification of herbs, dravya qualities, and chemical compositions. Perfect guide for second-year BAMS exams.',
        course_id: 'c3',
        subject: 'Dravyaguna Vijnana',
        price: 349.00,
        pdf_url: 'pdfs/dravyaguna.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1611082229985-b6200f68b201?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'n5',
        title: 'Pharmacology General Principles - B.Pharma',
        description: 'Master pharmacokinetics, pharmacodynamics, drug receptors, and adverse drug reactions. Clear charts, high-yield details.',
        course_id: 'c5',
        subject: 'Pharmacology',
        price: 180.00,
        pdf_url: 'pdfs/pharmacol_general.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3b89?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'n6',
        title: 'BSc Nursing Fundamentals of Nursing Study Notes',
        description: 'Covers nursing ethics, patient assessment, hygiene, vital signs, and standard care plans. Crucial for clinical placement and exams.',
        course_id: 'c4',
        subject: 'Nursing Foundation',
        price: 150.00,
        pdf_url: 'pdfs/nursing_fundamentals.pdf',
        thumbnail_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400',
        preview_images: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('stetho_notes', JSON.stringify(mockNotes));
  } else {
    try {
      const notes = JSON.parse(localStorage.getItem('stetho_notes') || '[]');
      let updated = false;
      notes.forEach((n: any) => {
        if (!n.status) {
          n.status = 'active';
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('stetho_notes', JSON.stringify(notes));
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!localStorage.getItem('stetho_profiles')) {
    const mockProfiles = [
      {
        id: 'admin-id',
        name: 'Dr. Admin',
        full_name: 'Dr. Admin',
        email: 'admin@stethonotes.com',
        phone: '9999999999',
        role: 'super_admin',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'student-id',
        name: 'Jane Doe',
        full_name: 'Jane Doe',
        email: 'student@stethonotes.com',
        phone: '8888888888',
        role: 'student',
        status: 'active',
        created_at: new Date().toISOString()
      },
      // Mock seller_pending for testing
      {
        id: 'seller-pending-id',
        name: 'Rohan Seller',
        full_name: 'Rohan Seller',
        email: 'seller@stethonotes.com',
        phone: '7777777777',
        role: 'seller_pending',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Mock approved seller for testing
      {
        id: 'seller-approved-id',
        name: 'Priya Notes',
        full_name: 'Priya Notes',
        email: 'priya@stethonotes.com',
        phone: '6666666666',
        role: 'seller',
        status: 'approved',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('stetho_profiles', JSON.stringify(mockProfiles));
  }

  if (!localStorage.getItem('stetho_orders')) {
    const mockOrders = [
      {
        id: 'ord-mock1',
        user_id: 'student-id',
        customer_name: 'Jane Doe',
        customer_email: 'student@stethonotes.com',
        customer_phone: '8888888888',
        total_amount: 299.00,
        razorpay_payment_id: 'pay_mock111111111',
        payment_status: 'completed',
        email_status: 'sent',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ord-mock2',
        user_id: null,
        customer_name: 'Rohan Gupta',
        customer_email: 'rohan@gmail.com',
        customer_phone: '9876543210',
        total_amount: 199.00,
        razorpay_payment_id: 'pay_mock222222222',
        payment_status: 'completed',
        email_status: 'sent',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ord-mock3',
        user_id: null,
        customer_name: 'Aditi Rao',
        customer_email: 'aditi@yahoo.com',
        customer_phone: '9123456789',
        total_amount: 150.00,
        razorpay_payment_id: 'pay_mock333333333',
        payment_status: 'completed',
        email_status: 'failed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('stetho_orders', JSON.stringify(mockOrders));
  }

  if (!localStorage.getItem('stetho_order_items')) {
    const mockOrderItems = [
      { id: 'item-mock1', order_id: 'ord-mock1', note_id: 'n1', price: 299.00 },
      { id: 'item-mock2', order_id: 'ord-mock2', note_id: 'n2', price: 199.00 },
      { id: 'item-mock3', order_id: 'ord-mock3', note_id: 'n6', price: 150.00 }
    ];
    localStorage.setItem('stetho_order_items', JSON.stringify(mockOrderItems));
  }

  if (!localStorage.getItem('stetho_reviews')) {
    const mockReviews = [
      { id: 'r1', note_id: 'n1', user_id: 'student-id', user_name: 'Jane Doe', rating: 5, comment: 'Amazing diagrams! The mnemonics really helped me clear my anatomy vivas. Highly recommended!', created_at: new Date().toISOString() },
      { id: 'r2', note_id: 'n1', user_id: 'student-2', user_name: 'Rahul Sharma', rating: 4, comment: 'Very concise and clear handwriting. Missing some topics on hand joints but covers 95% of upper limb syllabus.', created_at: new Date().toISOString() }
    ];
    localStorage.setItem('stetho_reviews', JSON.stringify(mockReviews));
  }

  // Initialize mock seller_requests from seller_pending profiles
  if (!localStorage.getItem('stetho_seller_requests')) {
    const mockSellerRequests = [
      {
        id: 'sr-1',
        user_id: 'seller-pending-id',
        email: 'seller@stethonotes.com',
        full_name: 'Rohan Seller',
        status: 'pending',
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewed_at: null,
        reviewed_by: null
      }
    ];
    localStorage.setItem('stetho_seller_requests', JSON.stringify(mockSellerRequests));
  }
};

initializeMockData();

// ==========================================
// MOCK AUTH CLASS (with full RBAC support)
// ==========================================

class MockAuth {
  private listeners: Function[] = [];

  constructor() {
    // Initialize default session only if none exists
    // Don't set a default session so users see the login page
    const sess = localStorage.getItem('stetho_session');
    if (!sess) {
      // No default session — user must log in
    }
  }

  async signUp({ email, options }: any) {
    const profiles = JSON.parse(localStorage.getItem('stetho_profiles') || '[]');
    const emailPrefix = email.split('@')[0];
    const name = options?.data?.name || emailPrefix;
    const phone = options?.data?.phone || '';
    const role = options?.data?.role || 'student';
    const status = role === 'seller_pending' ? 'pending' : 'active';

    const existing = profiles.find((p: any) => p.email === email);
    if (existing) {
      return { data: null, error: { message: 'User already exists with this email.' } };
    }

    const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
    const newProfile = {
      id: newId,
      name,
      full_name: name,
      email,
      phone,
      role,
      status,
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    localStorage.setItem('stetho_profiles', JSON.stringify(profiles));

    const user = {
      id: newId,
      email,
      user_metadata: { name, full_name: name, phone, role, status }
    };
    localStorage.setItem('stetho_session', JSON.stringify({ user }));
    this.notify({ event: 'SIGNED_IN', session: { user } });

    return { data: { user, session: { user } }, error: null };
  }

  async signInWithPassword({ email }: any) {
    const profiles = JSON.parse(localStorage.getItem('stetho_profiles') || '[]');

    // Match by email
    let matchedProfile = profiles.find((p: any) => p.email === email);

    if (!matchedProfile) {
      // Fallback: derive role from email keyword for testing
      let role = 'student';
      let name = 'Student User';
      let status = 'active';

      if (email.toLowerCase().includes('admin')) {
        role = 'super_admin';
        name = 'Dr. Admin';
      } else if (email.toLowerCase().includes('seller')) {
        role = 'seller_pending';
        name = 'Seller User';
        status = 'pending';
      }

      const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
      matchedProfile = {
        id: newId,
        name,
        full_name: name,
        email,
        phone: '',
        role,
        status,
        created_at: new Date().toISOString()
      };
      profiles.push(matchedProfile);
      localStorage.setItem('stetho_profiles', JSON.stringify(profiles));
    }

    const user = {
      id: matchedProfile.id,
      email,
      user_metadata: {
        name: matchedProfile.name,
        full_name: matchedProfile.full_name || matchedProfile.name,
        phone: matchedProfile.phone,
        role: matchedProfile.role,
        status: matchedProfile.status
      }
    };

    localStorage.setItem('stetho_session', JSON.stringify({ user }));
    this.notify({ event: 'SIGNED_IN', session: { user } });

    return { data: { user, session: { user } }, error: null };
  }

  async signInWithOAuth({ options }: any) {
    // In mock mode, simulate Google OAuth by reading the pending role from state
    const role: string = options?.queryParams?.role || 'student';

    // Resolve mock user for role
    let mockEmail: string;
    let mockName: string;
    let mockId: string;
    let mockStatus: string = 'active';

    if (role === 'admin') {
      mockEmail = 'shreyashumedkumarborkar@gmail.com';
      mockName = 'Dr. Admin (Mock)';
      mockId = 'admin-id';
    } else if (role === 'seller') {
      mockEmail = 'seller@stethonotes.com';
      mockName = 'Rohan Seller';
      mockId = 'seller-pending-id';
      mockStatus = 'pending';
    } else {
      mockEmail = 'student@stethonotes.com';
      mockName = 'Jane Doe';
      mockId = 'student-id';
    }

    // Find or create the profile
    let profiles = JSON.parse(localStorage.getItem('stetho_profiles') || '[]');
    let profile = profiles.find((p: any) => p.id === mockId);
    if (!profile) {
      profile = {
        id: mockId,
        name: mockName,
        full_name: mockName,
        email: mockEmail,
        phone: '',
        role: role === 'seller' ? 'seller_pending' : role === 'admin' ? 'super_admin' : 'student',
        status: mockStatus,
        created_at: new Date().toISOString()
      };
      profiles.push(profile);
      localStorage.setItem('stetho_profiles', JSON.stringify(profiles));
    }

    const user = {
      id: profile.id,
      email: profile.email,
      user_metadata: {
        name: profile.name,
        full_name: profile.full_name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        role: profile.role,
        status: profile.status,
        pending_oauth_role: role  // signals AuthCallbackPage what was requested
      }
    };

    // Simulate the OAuth redirect by storing session and notifying
    localStorage.setItem('stetho_session', JSON.stringify({ user }));
    // Store pending role so AuthCallbackPage can read it
    localStorage.setItem('stetho_pending_oauth_role', role);

    // Simulate redirect to callback
    window.location.href = `/auth/callback?role=${role}&mock=true`;

    return { data: {}, error: null };
  }

  async signOut() {
    localStorage.removeItem('stetho_session');
    localStorage.removeItem('stetho_pending_oauth_role');
    this.notify({ event: 'SIGNED_OUT', session: null });
    return { error: null };
  }

  async getSession() {
    const sess = localStorage.getItem('stetho_session');
    return { data: { session: sess ? JSON.parse(sess) : null }, error: null };
  }

  async signInWithOtp({ email }: any) {
    // Mock: always succeeds
    console.info('[Mock OTP] Would send OTP to', email);
    return { error: null };
  }

  async verifyOtp({ email, token }: any) {
    // Mock: token 123456 always works
    if (token === '123456' || token.length === 6) {
      const profiles = JSON.parse(localStorage.getItem('stetho_profiles') || '[]');
      let profile = profiles.find((p: any) => p.email === email);

      if (!profile) {
        const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
        profile = {
          id: newId,
          name: email.split('@')[0],
          full_name: email.split('@')[0],
          email,
          phone: '',
          role: 'student',
          status: 'active',
          created_at: new Date().toISOString()
        };
        profiles.push(profile);
        localStorage.setItem('stetho_profiles', JSON.stringify(profiles));
      }

      const user = {
        id: profile.id,
        email,
        user_metadata: {
          name: profile.name,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status
        }
      };
      localStorage.setItem('stetho_session', JSON.stringify({ user }));
      this.notify({ event: 'SIGNED_IN', session: { user } });

      return { data: { user, session: { user } }, error: null };
    }
    return { data: null, error: { message: 'Invalid OTP token. Use 123456 in mock mode.' } };
  }

  onAuthStateChange(callback: Function) {
    this.listeners.push(callback);
    const sess = localStorage.getItem('stetho_session');
    callback(sess ? 'SIGNED_IN' : 'SIGNED_OUT', sess ? JSON.parse(sess) : null);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  private notify(data: any) {
    this.listeners.forEach(l => l(data.event, data.session));
  }
}

// ==========================================
// MOCK QUERY BUILDER
// ==========================================

class MockQueryBuilder {
  private tableName: string;
  private data: any[] = [];
  private filterField: string = '';
  private filterValue: any = null;
  private filterInFields: string = '';
  private filterInValues: any[] = [];
  private singleResult: boolean = false;
  private limitCount: number = 0;
  private _orderField: string = '';
  private _orderAsc: boolean = true;
  private _neqField: string = '';
  private _neqValue: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.data = JSON.parse(localStorage.getItem(`stetho_${tableName}`) || '[]');
  }

  select(_fields: string = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filterField = field;
    this.filterValue = value;
    return this;
  }

  neq(field: string, value: any) {
    this._neqField = field;
    this._neqValue = value;
    return this;
  }

  in(field: string, values: any[]) {
    this.filterInFields = field;
    this.filterInValues = values;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    this._orderField = field;
    this._orderAsc = ascending;
    return this;
  }

  // Execute SELECT
  async then(resolve: Function) {
    let filtered = [...this.data];

    // Handle course mapping for notes
    if (this.tableName === 'notes') {
      const courses = JSON.parse(localStorage.getItem('stetho_courses') || '[]');
      filtered = filtered.map(note => ({
        ...note,
        course: courses.find((c: any) => c.id === note.course_id)
      }));
    }

    if (this.filterField) {
      filtered = filtered.filter(item => item[this.filterField] === this.filterValue);
    }

    if (this._neqField) {
      filtered = filtered.filter(item => item[this._neqField] !== this._neqValue);
    }

    if (this.filterInFields && this.filterInValues.length > 0) {
      filtered = filtered.filter(item => this.filterInValues.includes(item[this.filterInFields]));
    }

    if (this._orderField) {
      filtered.sort((a, b) => {
        let valA = a[this._orderField];
        let valB = b[this._orderField];
        if (typeof valA === 'string') {
          return this._orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this._orderAsc ? valA - valB : valB - valA;
      });
    }

    if (this.singleResult) {
      const res = filtered[0] || null;
      resolve({ data: res, error: res ? null : { message: 'Not found' } });
      return;
    }

    if (this.limitCount > 0) {
      filtered = filtered.slice(0, this.limitCount);
    }

    resolve({ data: filtered, error: null });
  }

  // Insert Row
  async insert(payload: any) {
    const records = Array.isArray(payload) ? payload : [payload];
    const saved = JSON.parse(localStorage.getItem(`stetho_${this.tableName}`) || '[]');

    const added: any[] = [];
    records.forEach(r => {
      const item = {
        id: r.id || `${this.tableName.substring(0, 3)}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        ...r
      };
      saved.push(item);
      added.push(item);
    });

    localStorage.setItem(`stetho_${this.tableName}`, JSON.stringify(saved));
    return { data: Array.isArray(payload) ? added : added[0], error: null };
  }

  // Upsert Row
  async upsert(payload: any, _options?: any) {
    const records = Array.isArray(payload) ? payload : [payload];
    let saved = JSON.parse(localStorage.getItem(`stetho_${this.tableName}`) || '[]');

    records.forEach(r => {
      const idx = saved.findIndex((item: any) => item.id === r.id);
      if (idx >= 0) {
        saved[idx] = { ...saved[idx], ...r };
      } else {
        saved.push({
          id: r.id || `${this.tableName.substring(0, 3)}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...r
        });
      }
    });

    localStorage.setItem(`stetho_${this.tableName}`, JSON.stringify(saved));
    return { data: Array.isArray(payload) ? records : records[0], error: null };
  }

  // Update Row
  async update(payload: any) {
    let saved = JSON.parse(localStorage.getItem(`stetho_${this.tableName}`) || '[]');
    let updatedItem: any = null;

    saved = saved.map((item: any) => {
      if (this.filterField && item[this.filterField] === this.filterValue) {
        updatedItem = { ...item, ...payload };
        return updatedItem;
      }
      return item;
    });

    localStorage.setItem(`stetho_${this.tableName}`, JSON.stringify(saved));
    return { data: updatedItem, error: updatedItem ? null : { message: 'No item matched' } };
  }

  // Delete Row
  async delete() {
    let saved = JSON.parse(localStorage.getItem(`stetho_${this.tableName}`) || '[]');
    const countBefore = saved.length;

    if (this.filterField) {
      saved = saved.filter((item: any) => item[this.filterField] !== this.filterValue);
    }

    localStorage.setItem(`stetho_${this.tableName}`, JSON.stringify(saved));
    return { data: null, error: saved.length < countBefore ? null : { message: 'No item deleted' } };
  }
}

// ==========================================
// MOCK STORAGE CLASS
// ==========================================

class MockStorage {
  from(bucketName: string) {
    return {
      async upload(path: string, _file: File, options?: any) {
        if (options?.onUploadProgress) {
          const total = _file.size || 1000000;
          for (let p = 1; p <= 5; p++) {
            await new Promise(r => setTimeout(r, 100));
            options.onUploadProgress({
              loaded: Math.round((p / 5) * total),
              total: total
            });
          }
        } else {
          await new Promise(r => setTimeout(r, 450));
        }
        const simulatedUrl = `https://stethonotes-storage.mock/${bucketName}/${path}`;
        return { data: { path, fullPath: simulatedUrl }, error: null };
      },
      async createSignedUrl(path: string, expirySeconds: number) {
        const expires = Math.floor(Date.now() / 1000) + expirySeconds;
        const signedUrl = `https://stethonotes-storage.mock/${bucketName}/${path}?token=mock_signed_token&expires=${expires}`;
        return { data: { signedUrl }, error: null };
      }
    };
  }
}

// ==========================================
// COMBINED MOCK CLIENT
// ==========================================

const mockSupabase = {
  auth: new MockAuth(),
  from: (tableName: string) => new MockQueryBuilder(tableName),
  storage: new MockStorage()
};

// ==========================================
// EXPORT
// ==========================================

export const supabase = isLiveSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockSupabase as any);

// ==========================================
// BREVO EMAIL SIMULATION (for order emails)
// ==========================================

export const triggerBrevoEmailSimulation = async (orderId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const orders = JSON.parse(localStorage.getItem('stetho_orders') || '[]');
  const idx = orders.findIndex((o: any) => o.id === orderId);

  if (idx !== -1) {
    const isSuccess = Math.random() > 0.1;
    orders[idx].email_status = isSuccess ? 'sent' : 'failed';
    localStorage.setItem('stetho_orders', JSON.stringify(orders));
    return isSuccess;
  }
  return false;
};
