import { 
  UserProfile, Account, Customer, Loan, 
  Transaction, Employee, BankBudget, Portfolio,
  FixedDeposit, CreditCard, SupportTicket, AuditLog
} from '../types';

const STORAGE_KEYS = {
  USER: 'aaravland_bank_user',
  ACCOUNTS: 'aaravland_bank_accounts',
  CUSTOMERS: 'aaravland_bank_customers',
  LOANS: 'aaravland_bank_loans',
  TRANSACTIONS: 'aaravland_bank_transactions',
  EMPLOYEES: 'aaravland_bank_employees',
  BUDGET: 'aaravland_bank_budget',
  PORTFOLIOS: 'aaravland_bank_portfolios',
  AUDIT_LOGS: 'aaravland_bank_audit_logs',
  NOTIFICATIONS: 'aaravland_bank_notifications',
  CAPITAL: 'aaravland_bank_capital',
  FIXED_DEPOSITS: 'aaravland_bank_fixed_deposits',
  CREDIT_CARDS: 'aaravland_bank_credit_cards',
  SUPPORT_TICKETS: 'aaravland_bank_support_tickets'
};

// Initial Mock Data
const INITIAL_DATA = {
  ACCOUNTS: [
    { id: 'acc_1', customerId: 'cust_1', type: 'Savings', balance: 25000, interestRate: 4.5, currency: 'USD', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'acc_2', customerId: 'cust_2', type: 'Checking', balance: 1200, interestRate: 0.5, currency: 'USD', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'acc_emp_1', customerId: 'admin_1', type: 'Checking', balance: 5000, interestRate: 1.5, currency: 'USD', status: 'Active', createdAt: new Date().toISOString() },
    { id: 'acc_emp_2', customerId: 'staff_1', type: 'Checking', balance: 3500, interestRate: 1.5, currency: 'USD', status: 'Active', createdAt: new Date().toISOString() }
  ],
  CUSTOMERS: [
    { id: 'cust_1', name: 'John Doe', email: 'john@example.com', phone: '555-0101', address: '123 Wall St', branch: 'Main', joinedAt: new Date().toISOString(), status: 'Active', kycStatus: 'Verified', creditScore: 750, occupation: 'Software Engineer', monthlyIncome: 8500, dateOfBirth: '1990-05-15' },
    { id: 'cust_2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', address: '456 Market St', branch: 'North', joinedAt: new Date().toISOString(), status: 'Active', kycStatus: 'Pending', creditScore: 680, occupation: 'Graphic Designer', monthlyIncome: 4200, dateOfBirth: '1995-10-20' }
  ],
  LOANS: [
    { id: 'loan_1', customerId: 'cust_1', customerName: 'John Doe', amount: 50000, interestRate: 4.5, termMonths: 60, status: 'Approved', disbursedAt: new Date().toISOString(), monthlyPayment: 932, remainingBalance: 48000, riskLevel: 'Low', purpose: 'Home Renovation' },
    { id: 'loan_2', customerId: 'cust_2', customerName: 'Jane Smith', amount: 15000, interestRate: 6.2, termMonths: 24, status: 'Pending', monthlyPayment: 666, remainingBalance: 15000, riskLevel: 'Medium', purpose: 'Debt Consolidation' }
  ],
  EMPLOYEES: [
    { id: 'emp_1', userId: 'admin_1', name: 'Ayaan Goyal', position: 'Chief Executive', department: 'Management', branch: 'Main', productivityScore: 98, hiredAt: new Date().toISOString(), salary: 15000 },
    { id: 'emp_2', userId: 'staff_1', name: 'Aarav Goyal', position: 'Loan Officer', department: 'Lending', branch: 'Main', productivityScore: 85, hiredAt: new Date().toISOString(), salary: 8500 }
  ],
  BUDGET: [
    { id: 'bud_1', category: 'Operations', allocated: 500000, spent: 320000, period: '2024-Q1', branch: 'Main' },
    { id: 'bud_2', category: 'Marketing', allocated: 150000, spent: 145000, period: '2024-Q1', branch: 'Main' },
    { id: 'bud_3', category: 'IT Infrastructure', allocated: 300000, spent: 280000, period: '2024-Q1', branch: 'Main' }
  ],
  CAPITAL: {
    totalAssets: 15000000, // $15M
    liquidCash: 5000000,   // $5M
    lastUpdated: new Date().toISOString()
  },
  FIXED_DEPOSITS: [
    { id: 'fd_1', customerId: 'cust_1', amount: 10000, interestRate: 6.5, termMonths: 12, startDate: new Date().toISOString(), maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), status: 'Active', autoRenew: true }
  ],
  CREDIT_CARDS: [
    { id: 'cc_1', customerId: 'cust_1', cardNumber: '4532-XXXX-XXXX-1234', cardType: 'Gold', creditLimit: 5000, currentBalance: 1200, expiryDate: '12/28', cvv: '123', status: 'Active', billingCycleDay: 15 }
  ],
  SUPPORT_TICKETS: [
    { id: 't_1', customerId: 'cust_1', subject: 'Card not working', message: 'My gold card is being declined at merchants.', category: 'Card', priority: 'High', status: 'Open', createdAt: new Date().toISOString() }
  ]
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch a custom event so other components know data changed
    window.dispatchEvent(new Event('storage-update'));
  },
  
  // Auth
  getCurrentUser: (): UserProfile | null => storage.get(STORAGE_KEYS.USER, null),
  setCurrentUser: (user: UserProfile | null) => storage.set(STORAGE_KEYS.USER, user),
  
  // Data initialization
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) storage.set(STORAGE_KEYS.ACCOUNTS, INITIAL_DATA.ACCOUNTS);
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) storage.set(STORAGE_KEYS.CUSTOMERS, INITIAL_DATA.CUSTOMERS);
    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) storage.set(STORAGE_KEYS.LOANS, INITIAL_DATA.LOANS);
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) storage.set(STORAGE_KEYS.EMPLOYEES, INITIAL_DATA.EMPLOYEES);
    if (!localStorage.getItem(STORAGE_KEYS.BUDGET)) storage.set(STORAGE_KEYS.BUDGET, INITIAL_DATA.BUDGET);
    if (!localStorage.getItem(STORAGE_KEYS.CAPITAL)) storage.set(STORAGE_KEYS.CAPITAL, INITIAL_DATA.CAPITAL);
    if (!localStorage.getItem(STORAGE_KEYS.FIXED_DEPOSITS)) storage.set(STORAGE_KEYS.FIXED_DEPOSITS, INITIAL_DATA.FIXED_DEPOSITS);
    if (!localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS)) storage.set(STORAGE_KEYS.CREDIT_CARDS, INITIAL_DATA.CREDIT_CARDS);
    if (!localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS)) storage.set(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DATA.SUPPORT_TICKETS);
  },

  // Specific Getters
  getAccounts: (): Account[] => storage.getAll<Account>(STORAGE_KEYS.ACCOUNTS),
  getCustomers: (): Customer[] => storage.getAll<Customer>(STORAGE_KEYS.CUSTOMERS),
  getLoans: (): Loan[] => storage.getAll<Loan>(STORAGE_KEYS.LOANS),
  getEmployees: (): Employee[] => storage.getAll<Employee>(STORAGE_KEYS.EMPLOYEES),
  getBudget: (): BankBudget[] => storage.getAll<BankBudget>(STORAGE_KEYS.BUDGET),
  getCapital: (): any => storage.get(STORAGE_KEYS.CAPITAL, INITIAL_DATA.CAPITAL),
  getFixedDeposits: (): any[] => storage.getAll<any>(STORAGE_KEYS.FIXED_DEPOSITS),
  getCreditCards: (): any[] => storage.getAll<any>(STORAGE_KEYS.CREDIT_CARDS),
  getSupportTickets: (): SupportTicket[] => storage.getAll<SupportTicket>(STORAGE_KEYS.SUPPORT_TICKETS),
  getTransactions: (): Transaction[] => storage.getAll<Transaction>(STORAGE_KEYS.TRANSACTIONS),
  getUsers: (): UserProfile[] => {
    // For simplicity, we'll derive users from employees or just store them separately
    // Let's just store them separately for management
    return storage.get('aaravland_bank_all_users', [
      { uid: 'admin_1', email: 'admin@aaravlandbank.com', name: 'Ayaan Goyal', role: 'Administrator', branch: 'Main', department: 'Management' },
      { uid: 'staff_1', email: 'staff@aaravlandbank.com', name: 'Aarav Goyal', role: 'CSR', branch: 'Main', department: 'Operations' }
    ]);
  },

  // Specific Updaters
  updateLoan: (loan: Loan) => storage.save(STORAGE_KEYS.LOANS, loan),
  updateCustomer: (customer: Customer) => storage.save(STORAGE_KEYS.CUSTOMERS, customer),
  updateEmployee: (employee: Employee) => storage.save(STORAGE_KEYS.EMPLOYEES, employee),
  updateAccount: (account: Account) => storage.save(STORAGE_KEYS.ACCOUNTS, account),
  updateFixedDeposit: (fd: any) => storage.save(STORAGE_KEYS.FIXED_DEPOSITS, fd),
  updateCreditCard: (cc: any) => storage.save(STORAGE_KEYS.CREDIT_CARDS, cc),
  updateSupportTicket: (ticket: SupportTicket) => storage.save(STORAGE_KEYS.SUPPORT_TICKETS, ticket),
  updateCapital: (capital: any) => storage.set(STORAGE_KEYS.CAPITAL, { ...capital, lastUpdated: new Date().toISOString() }),
  updateUser: (user: UserProfile) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index > -1) {
      users[index] = user;
      storage.set('aaravland_bank_all_users', users);
    }
  },

  // Audit Logging
  logAction: (userId: string, userName: string, action: string, details: string, severity: 'Low' | 'Medium' | 'High' = 'Low') => {
    const log = {
      id: `log_${Date.now()}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString(),
      severity
    };
    storage.save('aaravland_bank_audit_logs', log);
  },
  getAuditLogs: () => storage.getAll<any>('aaravland_bank_audit_logs'),

  // Notifications
  addNotification: (userId: string, title: string, message: string) => {
    const notification = {
      id: `notif_${Date.now()}`,
      userId,
      title,
      message,
      read: false,
      timestamp: new Date().toISOString()
    };
    storage.save('aaravland_bank_notifications', notification);
  },
  getNotifications: (userId: string) => {
    return storage.getAll<any>('aaravland_bank_notifications').filter(n => n.userId === userId);
  },
  markNotificationAsRead: (notificationId: string) => {
    const notifications = storage.getAll<any>('aaravland_bank_notifications');
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notifications[index].read = true;
      storage.set('aaravland_bank_notifications', notifications);
    }
  },

  // Generic CRUD
  getAll: <T>(key: string): T[] => storage.get(key, []),
  save: <T extends { id: string }>(key: string, item: T) => {
    const items = storage.getAll<T>(key);
    const index = items.findIndex(i => i.id === item.id);
    if (index > -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    storage.set(key, items);
  },
  delete: (key: string, id: string) => {
    const items = storage.getAll<{ id: string }>(key);
    storage.set(key, items.filter(i => i.id !== id));
  },

  // Financial Transactions
  processTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => {
    const accounts = storage.getAccounts();
    const accountIndex = accounts.findIndex(a => a.id === transaction.accountId);
    
    if (accountIndex === -1) throw new Error('Account not found');
    
    const account = accounts[accountIndex];
    const amount = transaction.amount;
    
    if (transaction.type === 'Withdrawal' && account.balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // Update balance
    if (transaction.type === 'Deposit') {
      account.balance += amount;
    } else if (transaction.type === 'Withdrawal') {
      account.balance -= amount;
    }
    
    // Save updated account
    storage.updateAccount(account);
    
    // Create transaction record
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Completed'
    };
    storage.save(STORAGE_KEYS.TRANSACTIONS, newTransaction);
    
    return newTransaction;
  },

  applyInterest: (accountId: string) => {
    const accounts = storage.getAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) throw new Error('Account not found');
    
    const account = accounts[accountIndex];
    if (account.interestRate <= 0) return;
    
    // Simulate monthly interest for demo purposes
    const monthlyRate = (account.interestRate / 100) / 12;
    const interestAmount = account.balance * monthlyRate;
    
    if (interestAmount <= 0) return;
    
    account.balance += interestAmount;
    storage.updateAccount(account);
    
    // Create transaction record for interest
    const interestTransaction: Transaction = {
      id: `tx_int_${Date.now()}`,
      accountId: account.id,
      amount: interestAmount,
      type: 'Deposit',
      description: `Monthly Interest Accrual (${account.interestRate}%)`,
      timestamp: new Date().toISOString(),
      status: 'Completed'
    };
    storage.save(STORAGE_KEYS.TRANSACTIONS, interestTransaction);
    
    return interestAmount;
  },

  paySalary: (employeeId: string) => {
    const employees = storage.getEmployees();
    const empIndex = employees.findIndex(e => e.id === employeeId);
    if (empIndex === -1) throw new Error('Employee not found');
    
    const employee = employees[empIndex];
    const capital = storage.getCapital();
    
    if (capital.liquidCash < employee.salary) {
      throw new Error('Insufficient institutional capital to pay salary');
    }
    
    // Deduct from capital
    capital.liquidCash -= employee.salary;
    storage.updateCapital(capital);
    
    // Update employee last paid
    employee.lastPaidAt = new Date().toISOString();
    storage.updateEmployee(employee);
    
    // Log action
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Salary Payment',
        `Paid salary of ${employee.salary} to ${employee.name}`,
        'Medium'
      );
    }
    
    return employee.salary;
  },

  disburseLoan: (loanId: string) => {
    const loans = storage.getLoans();
    const loanIndex = loans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) throw new Error('Loan not found');
    
    const loan = loans[loanIndex];
    if (loan.status !== 'Pending') throw new Error('Loan is not in pending status');
    
    const capital = storage.getCapital();
    if (capital.liquidCash < loan.amount) {
      throw new Error('Insufficient institutional capital to disburse loan');
    }
    
    // Deduct from capital
    capital.liquidCash -= loan.amount;
    storage.updateCapital(capital);
    
    // Update loan status
    loan.status = 'Approved';
    loan.disbursedAt = new Date().toISOString();
    storage.updateLoan(loan);
    
    // Create transaction record
    const disbursementTransaction: Transaction = {
      id: `tx_loan_${Date.now()}`,
      accountId: 'INSTITUTIONAL_RESERVE',
      amount: loan.amount,
      type: 'Withdrawal',
      description: `Loan Disbursement: ${loan.customerName} (${loan.id})`,
      timestamp: new Date().toISOString(),
      status: 'Completed'
    };
    storage.save(STORAGE_KEYS.TRANSACTIONS, disbursementTransaction);
    
    // Log action
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Loan Disbursement',
        `Disbursed ${loan.amount} to ${loan.customerName}`,
        'High'
      );
    }
    
    return loan;
  }
};

export { STORAGE_KEYS };
