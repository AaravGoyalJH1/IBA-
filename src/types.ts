export type UserRole = 'CSR' | 'Loan Officer' | 'Branch Manager' | 'Administrator';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  branch: string;
  department: string;
  photoURL?: string;
}

export interface Account {
  id: string;
  customerId: string;
  type: 'Savings' | 'Checking' | 'Business';
  balance: number;
  interestRate: number; // Annual interest rate in percentage
  currency: string;
  status: 'Active' | 'Frozen' | 'Closed';
  createdAt: any;
  lastInterestApplied?: string;
}

export interface FixedDeposit {
  id: string;
  customerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  status: 'Active' | 'Matured' | 'Withdrawn';
  autoRenew: boolean;
}

export interface CreditCard {
  id: string;
  customerId: string;
  cardNumber: string;
  cardType: 'Classic' | 'Gold' | 'Platinum' | 'Infinite';
  creditLimit: number;
  currentBalance: number;
  expiryDate: string;
  cvv: string;
  status: 'Active' | 'Blocked' | 'Expired';
  billingCycleDay: number;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  message: string;
  category: 'Account' | 'Loan' | 'Card' | 'Technical' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  assignedTo?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  branch: string;
  joinedAt: any;
  status: 'Active' | 'Inactive';
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  creditScore: number; // 300-850
  occupation: string;
  monthlyIncome: number;
  dateOfBirth: string;
  idProofUrl?: string;
  addressProofUrl?: string;
}

export interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Defaulted' | 'Paid';
  disbursedAt?: any;
  monthlyPayment: number;
  remainingBalance: number;
  isEmployeeLoan?: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  collateral?: string;
  purpose: string;
}

export interface StockHolding {
  symbol: string;
  shares: number;
  averagePrice: number;
}

export interface Portfolio {
  id: string;
  ownerId: string; // 'BANK' or customerId
  holdings: StockHolding[];
  lastUpdated: any;
}

export interface Transaction {
  id: string;
  accountId: string;
  toAccountId?: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Loan Payment' | 'Stock Purchase' | 'Stock Sale';
  description: string;
  timestamp: any;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface BankBudget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  period: string; // e.g., '2024-Q1'
  branch: string;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  position: string;
  department: string;
  branch: string;
  productivityScore: number; // 0-100
  hiredAt: any;
  salary: number; // Monthly salary
  lastPaidAt?: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: { date: string; price: number }[];
  news: { title: string; summary: string; url: string; date: string }[];
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface BankCapital {
  totalAssets: number;
  liquidCash: number;
  lastUpdated: string;
}
