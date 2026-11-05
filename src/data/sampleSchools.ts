import { SchoolRecord, UserSession } from '../types/school';

export const DEMO_ACCOUNTS: Record<string, UserSession> = {
  superadmin: {
    id: 'usr-super-01',
    name: 'Rajeshwar Hegde',
    email: 'superadmin@nattonskillx.in',
    demoPassword: 'password123',
    role: 'SUPER_ADMIN',
    designation: 'Chief Operations Officer (Super Admin)',
    zone: 'All India & State Jurisdictions',
    monthlyTarget: 100,
    weeklyTarget: 25,
    avatarInitials: 'RH',
  },
  admin: {
    id: 'usr-admin-01',
    name: 'State Operations Admin',
    email: 'nattonskillxjunior@gmail.com',
    demoPassword: 'nattonskillxjunior@123',
    role: 'ADMIN',
    designation: 'State Field Operations Lead (Admin)',
    zone: 'Karnataka & All-India Operational Hub',
    monthlyTarget: 40,
    weeklyTarget: 10,
    avatarInitials: 'NJ',
  },
  user: {
    id: 'usr-field-01',
    name: 'Rohan Verma',
    email: 'rohan.field@nattonskillx.in',
    demoPassword: 'password123',
    role: 'USER',
    designation: 'Field Outreach Executive (User)',
    zone: 'Hubli-Dharwad & Central Corridor',
    monthlyTarget: 24,
    weeklyTarget: 6,
    avatarInitials: 'RV',
  },
  user2: {
    id: 'usr-field-02',
    name: 'Priya Nair',
    email: 'priya.field@nattonskillx.in',
    demoPassword: 'password123',
    role: 'USER',
    designation: 'Field Outreach Executive (User)',
    zone: 'Hubli North Corridor & Vidyanagar',
    monthlyTarget: 20,
    weeklyTarget: 5,
    avatarInitials: 'PN',
  },
};

// STRICTLY DYNAMIC ONLY: No dummy data preloaded
export const INITIAL_SCHOOLS: SchoolRecord[] = [];
