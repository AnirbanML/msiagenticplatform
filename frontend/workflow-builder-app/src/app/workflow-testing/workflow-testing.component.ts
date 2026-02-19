import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

// Interfaces
interface Loan {
  id: number;
  loanNumber: string;
  borrowers: Borrower[];
  loanAmount: number;
  status: 'active' | 'pending' | 'closed';
  propertyAddress: string;
}

interface Borrower {
  id: number;
  name: string;
  email: string;
  isCoApplicant: boolean;
}

interface WorkflowSummary {
  id: number;
  workflowName: string;
  flowType: string;
  version: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: number;
  workflowName: string;
  loanId: number;
  borrowerId?: number;
  testType: 'loan' | 'borrower';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalDuration: number;
  steps: ExecutionStep[];
  analytics: ExecutionAnalytics;
  consoleLogs: string[];
  // Execution-level accuracy
  executionAccuracy?: 'correct' | 'incorrect' | 'unverified';
  verifiedAt?: string;
}

interface ExecutionStep {
  stepNumber: number;
  stepName: string;
  node: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputData: any;
  outputData?: any;
  error?: string;
  tokens: { input: number; output: number };
  cost: number;
  isExpanded?: boolean;
  // Accuracy tracking
  accuracyStatus?: 'correct' | 'incorrect' | 'unverified';
  verifiedAt?: string;
  verifiedBy?: string;
}

interface ExecutionAnalytics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalDuration: number;
  stepBreakdown: StepAnalytics[];
}

interface StepAnalytics {
  stepNumber: number;
  stepName: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
}

interface AccuracyMetrics {
  totalRuns: number;
  correctRuns: number;
  incorrectRuns: number;
  unverifiedRuns: number;
  accuracyRate: number;
  stepAccuracy: {
    totalSteps: number;
    correctSteps: number;
    incorrectSteps: number;
    stepAccuracyRate: number;
  };
  stepBreakdown: StepAccuracyBreakdown[];
  uniqueLoans: number;
  uniqueBorrowers: number;
}

interface StepAccuracyBreakdown {
  stepNumber: number;
  stepName: string;
  correctCount: number;
  incorrectCount: number;
  totalRuns: number;
  accuracyRate: number;
}

interface PerformanceAverages {
  avgTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgCost: number;
  avgDuration: number;
  totalRuns: number;
}

interface ExecutionHistory {
  executions: WorkflowExecution[];
  accuracyMetrics: AccuracyMetrics;
  performanceAverages: PerformanceAverages;
}

interface LoanDocument {
  id: string;
  name: string;
  type: 'paystub' | 'w2' | 'bank_statement' | '1040' | 'other';
  url: string;
  borrowerId?: number;
  uploadedAt: string;
  pageCount?: number;
}

@Component({
  selector: 'app-workflow-testing',
  templateUrl: './workflow-testing.component.html',
  standalone: false,
  styleUrls: ['./workflow-testing.component.css']
})
export class WorkflowTestingComponent implements OnInit, OnDestroy {
  private apiBaseUrl = 'http://localhost:8000/api/v1';

  // Workflow selection
  workflows: WorkflowSummary[] = [];
  selectedWorkflowId: number | null = null;
  showWorkflowDropdown = false;

  // Current workflow being tested
  currentWorkflowName: string = '';
  currentWorkflowCategory: string = '';
  currentWorkflowRunType: string = '';

  // Loan selection
  loans: Loan[] = [];
  filteredLoans: Loan[] = [];
  searchQuery: string = '';
  selectedLoanId: number | null = null;
  selectedLoan: Loan | null = null;
  showLoanDropdown: boolean = false;

  // Test configuration
  testType: 'loan' | 'borrower' = 'loan';
  selectedBorrowerId: number | null = null;
  showBorrowerDropdown = false;

  // Execution tracking
  currentExecution: WorkflowExecution | null = null;

  // UI state
  isExecuting: boolean = false;
  isDarkTheme: boolean = true;
  showEditModal: boolean = false;
  editingStepNumber: number | null = null;
  editedOutput: string = '';
  moveToProduction: boolean = false;

  // Execution history and metrics
  executionHistory: WorkflowExecution[] = [];
  accuracyMetrics: AccuracyMetrics = {
    totalRuns: 0,
    correctRuns: 0,
    incorrectRuns: 0,
    unverifiedRuns: 0,
    accuracyRate: 0,
    stepAccuracy: {
      totalSteps: 0,
      correctSteps: 0,
      incorrectSteps: 0,
      stepAccuracyRate: 0
    },
    stepBreakdown: [],
    uniqueLoans: 0,
    uniqueBorrowers: 0
  };
  performanceAverages: PerformanceAverages = {
    avgTokens: 0,
    avgInputTokens: 0,
    avgOutputTokens: 0,
    avgCost: 0,
    avgDuration: 0,
    totalRuns: 0
  };

  // Document viewer state
  documents: LoanDocument[] = [];
  selectedDocument: LoanDocument | null = null;
  showDocumentViewer: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.initializeTheme();
    this.loadExecutionHistory();
    this.initializeMockAverages();
    this.loadMockDocuments();

    // Initialize production toggle state from localStorage
    const savedProductionState = localStorage.getItem('workflow-testing-production');
    if (savedProductionState !== null) {
      this.moveToProduction = savedProductionState === 'true';
    }

    // Check if navigation state contains test data from workflow builder
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state.testWorkflow && state.loanDetails) {
      console.log('Received test workflow:', state.testWorkflow);
      console.log('Received loan details:', state.loanDetails);

      // Set current workflow details
      this.currentWorkflowName = state.testWorkflow.workflowName;
      this.currentWorkflowCategory = state.testWorkflow.category;
      this.currentWorkflowRunType = state.testWorkflow.runtype;

      // Set test type based on runtype
      this.testType = state.testWorkflow.runtype === 'loan' ? 'loan' : 'borrower';

      // Load real loan data from API response
      this.loadLoansFromTestData(state.loanDetails, state.testWorkflow.runtype);
    } else {
      // Load workflows and mock data if no real data provided
      this.loadWorkflows();
      this.loadMockLoans();
    }
  }

  // Load loans from the test data API response
  loadLoansFromTestData(loanDetails: any[], runtype: string) {
    if (runtype === 'loan') {
      // Loan level: map loan numbers to Loan interface
      this.loans = loanDetails.map((loan: any, index: number) => ({
        id: index + 1,
        loanNumber: loan.loanNumber,
        borrowers: [],
        loanAmount: 0,
        status: 'active' as const,
        propertyAddress: ''
      }));
    } else {
      // Borrower level: map loan numbers with borrowers, filtering out non-numeric borrower IDs
      this.loans = loanDetails.map((loan: any, index: number) => {
        // Filter borrowers to only include those with numeric IDs
        const numericBorrowers = loan.borrowerIDs.filter((borrower: any) => {
          const borrowerId = String(borrower.id);
          return /^\d+$/.test(borrowerId); // Only keep if ID is numeric
        });

        return {
          id: index + 1,
          loanNumber: loan.loanNumber,
          borrowers: numericBorrowers.map((borrower: any, bIndex: number) => ({
            id: bIndex + 1,
            name: `Borrower ${borrower.id}`,
            email: '',
            isCoApplicant: !borrower.isPrimary
          })),
          loanAmount: 0,
          status: 'active' as const,
          propertyAddress: ''
        };
      }).filter((loan: any) => loan.borrowers.length > 0); // Remove loans with no numeric borrowers
    }

    // Update filtered loans to show all loaded loans
    this.filteredLoans = [...this.loans];
    console.log('Loaded loans:', this.loans);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Theme management
  initializeTheme() {
    const savedTheme = localStorage.getItem('workflow-testing-theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
    this.applyTheme();
  }

  toggleTheme(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('workflow-testing-theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(this.isDarkTheme ? 'theme-dark' : 'theme-light');
  }

  onProductionToggle() {
    if (this.moveToProduction) {
      this.addConsoleLog('✓ Workflow marked for production deployment');
      console.log('Move to Production: ENABLED');
    } else {
      this.addConsoleLog('⊗ Production deployment flag removed');
      console.log('Move to Production: DISABLED');
    }
    // Store preference
    localStorage.setItem('workflow-testing-production', String(this.moveToProduction));
  }

  // Navigation
  goBack() {
    // Use browser's back functionality - same as pressing browser back button
    this.location.back();
  }

  // Workflow management
  loadWorkflows() {
    this.http.get<any[]>(`${this.apiBaseUrl}/workflows`)
      .subscribe({
        next: (workflows) => {
          this.workflows = workflows.map(w => ({
            id: w.id,
            workflowName: w.workflowName || 'Unnamed Workflow',
            flowType: w.flowType || 'standard',
            version: w.version || 1
          }));
          console.log('Loaded workflows:', this.workflows);
        },
        error: (error) => {
          console.error('Error loading workflows:', error);
          // Use mock data as fallback
          this.workflows = [
            { id: 1, workflowName: 'Income Verification Workflow', flowType: 'agentic', version: 1 },
            { id: 2, workflowName: 'Asset Analysis Workflow', flowType: 'orchestrator', version: 2 }
          ];
        }
      });
  }

  selectWorkflow(workflowId: number) {
    this.selectedWorkflowId = workflowId;
    this.showWorkflowDropdown = false;
  }

  getSelectedWorkflow(): WorkflowSummary | null {
    return this.workflows.find(w => w.id === this.selectedWorkflowId) || null;
  }

  // Loan management
  loadMockLoans() {
    this.loans = [
      {
        id: 1,
        loanNumber: 'LN-2024-001',
        borrowers: [
          { id: 1, name: 'John Smith', email: 'john.smith@email.com', isCoApplicant: false },
          { id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', isCoApplicant: true }
        ],
        loanAmount: 450000,
        status: 'active',
        propertyAddress: '123 Main St, San Francisco, CA 94102'
      },
      {
        id: 2,
        loanNumber: 'LN-2024-002',
        borrowers: [
          { id: 3, name: 'Michael Johnson', email: 'michael.j@email.com', isCoApplicant: false }
        ],
        loanAmount: 325000,
        status: 'pending',
        propertyAddress: '456 Oak Ave, Los Angeles, CA 90001'
      },
      {
        id: 3,
        loanNumber: 'LN-2024-003',
        borrowers: [
          { id: 4, name: 'Sarah Williams', email: 'sarah.w@email.com', isCoApplicant: false },
          { id: 5, name: 'David Williams', email: 'david.w@email.com', isCoApplicant: true }
        ],
        loanAmount: 580000,
        status: 'active',
        propertyAddress: '789 Pine Blvd, San Diego, CA 92101'
      },
      {
        id: 4,
        loanNumber: 'LN-2024-004',
        borrowers: [
          { id: 6, name: 'Robert Brown', email: 'robert.b@email.com', isCoApplicant: false }
        ],
        loanAmount: 275000,
        status: 'closed',
        propertyAddress: '321 Elm Street, Sacramento, CA 95814'
      },
      {
        id: 5,
        loanNumber: 'LN-2024-005',
        borrowers: [
          { id: 7, name: 'Emily Davis', email: 'emily.d@email.com', isCoApplicant: false },
          { id: 8, name: 'James Davis', email: 'james.d@email.com', isCoApplicant: true }
        ],
        loanAmount: 625000,
        status: 'active',
        propertyAddress: '555 Maple Drive, San Jose, CA 95110'
      }
    ];
    this.filteredLoans = [...this.loans];
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredLoans = [...this.loans];
      return;
    }
    this.filteredLoans = this.loans.filter(loan =>
      loan.loanNumber.toLowerCase().includes(query) ||
      loan.borrowers.some(b => b.name.toLowerCase().includes(query)) ||
      loan.propertyAddress.toLowerCase().includes(query)
    );
  }

  selectLoan(loanId: number) {
    this.selectedLoanId = loanId;
    this.selectedLoan = this.loans.find(l => l.id === loanId) || null;
    this.showLoanDropdown = false;
    this.searchQuery = '';
    this.filteredLoans = [...this.loans];
    // Reset borrower selection when changing loans
    this.selectedBorrowerId = null;
  }

  onLoanSelected() {
    // Called when loan radio button is selected
    if (this.selectedLoanId) {
      this.selectedLoan = this.loans.find(l => l.id === this.selectedLoanId) || null;
      this.showLoanDropdown = false;
      this.searchQuery = '';
      this.filteredLoans = [...this.loans];
    }
  }

  onBorrowerSelected(loanId: number, borrowerId: number) {
    // Called when borrower radio button is selected
    this.selectedLoanId = loanId;
    this.selectedBorrowerId = borrowerId;
    this.selectedLoan = this.loans.find(l => l.id === loanId) || null;
    this.showLoanDropdown = false;
    this.searchQuery = '';
    this.filteredLoans = [...this.loans];
  }

  getSelectedLoan(): Loan | null {
    return this.selectedLoan;
  }

  selectBorrower(borrowerId: number) {
    this.selectedBorrowerId = borrowerId;
    this.showBorrowerDropdown = false;
  }

  getSelectedBorrower(): Borrower | null {
    if (!this.selectedLoan || !this.selectedBorrowerId) return null;
    return this.selectedLoan.borrowers.find(b => b.id === this.selectedBorrowerId) || null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'closed': return 'badge-secondary';
      default: return 'badge-default';
    }
  }

  // Format loan display text for dropdown
  getLoanDisplayText(loan: Loan): string {
    if (this.testType === 'loan') {
      // Loan level: show only loan number
      return loan.loanNumber;
    } else {
      // Borrower level: show loan number with borrower IDs
      if (loan.borrowers.length === 0) {
        return loan.loanNumber;
      }
      const borrowerInfo = loan.borrowers.map(b => {
        const isPrimary = !b.isCoApplicant;
        return isPrimary ? `${b.name} (Primary)` : b.name;
      }).join(', ');
      return `${loan.loanNumber} - ${borrowerInfo}`;
    }
  }

  getSelectedLoanText(): string {
    if (!this.selectedLoan) return '';

    if (this.testType === 'loan') {
      // Loan level: just show loan number
      return this.selectedLoan.loanNumber;
    } else {
      // Borrower level: show loan number and selected borrower
      if (this.selectedBorrowerId) {
        const borrower = this.selectedLoan.borrowers.find(b => b.id === this.selectedBorrowerId);
        if (borrower) {
          const borrowerText = borrower.isCoApplicant ? borrower.name : `${borrower.name} (Primary)`;
          return `${this.selectedLoan.loanNumber} - ${borrowerText}`;
        }
      }
      return this.selectedLoan.loanNumber;
    }
  }

  // Check if we can start the test
  canStartTest(): boolean {
    if (!this.selectedLoanId) {
      return false;
    }

    // For borrower level, we must have a borrower selected
    if (this.testType === 'borrower' && !this.selectedBorrowerId) {
      return false;
    }

    return true;
  }

  // Execution management
  startExecution() {
    if (!this.selectedLoanId) {
      alert('Please select a loan before starting the test.');
      return;
    }

    if (this.testType === 'borrower' && !this.selectedBorrowerId) {
      alert('Please select a borrower for borrower-level testing.');
      return;
    }

    // Use current workflow name from navigation state, or fall back to selected workflow
    const workflowName = this.currentWorkflowName || this.getSelectedWorkflow()?.workflowName || 'Unknown Workflow';
    const workflowId = this.selectedWorkflowId || 0;

    // Create mock execution
    this.currentExecution = {
      id: 'exec-' + Date.now(),
      workflowId: workflowId,
      workflowName: workflowName,
      loanId: this.selectedLoanId,
      borrowerId: this.testType === 'borrower' && this.selectedBorrowerId ? this.selectedBorrowerId : undefined,
      testType: this.testType,
      status: 'running',
      startTime: new Date().toISOString(),
      totalDuration: 0,
      steps: this.generateMockSteps(),
      analytics: this.calculateAnalytics([]),
      consoleLogs: []
    };

    this.isExecuting = true;
    this.addConsoleLog(`Starting execution for ${this.testType} level test...`);
    this.addConsoleLog(`Workflow: ${workflowName}`);
    this.addConsoleLog(`Loan: ${this.selectedLoan?.loanNumber}`);
    this.simulateStepExecution();
  }

  generateMockSteps(): ExecutionStep[] {
    const stepTemplates = [
      { name: 'Document Extraction', node: 'text extraction' },
      { name: 'Data Validation', node: 'insights executor' },
      { name: 'Income Calculation', node: 'insights executor' },
      { name: 'Generate Output', node: 'output generator' }
    ];

    return stepTemplates.map((template, index) => ({
      stepNumber: index + 1,
      stepName: template.name,
      node: template.node,
      status: 'pending',
      inputData: { placeholder: 'Input data will be populated during execution' },
      tokens: { input: 0, output: 0 },
      cost: 0,
      isExpanded: false
    }));
  }

  simulateStepExecution() {
    const steps = this.currentExecution!.steps;

    steps.forEach((step, index) => {
      setTimeout(() => {
        step.status = 'running';
        step.startTime = new Date().toISOString();
        this.addConsoleLog(`[Step ${step.stepNumber}] Starting: ${step.stepName}`);

        setTimeout(() => {
          step.status = 'completed';
          step.endTime = new Date().toISOString();
          step.duration = 2 + Math.random() * 3; // 2-5 seconds
          step.outputData = this.generateMockOutput(step.node);
          step.tokens = {
            input: Math.floor(100 + Math.random() * 200),
            output: Math.floor(200 + Math.random() * 400)
          };
          step.cost = (step.tokens.input * 0.03 + step.tokens.output * 0.06) / 1000;

          this.addConsoleLog(`[Step ${step.stepNumber}] Completed: ${step.stepName} (${step.duration.toFixed(2)}s)`);
          this.addConsoleLog(`  Tokens: ${step.tokens.input} in / ${step.tokens.output} out | Cost: $${step.cost.toFixed(4)}`);

          // If last step, mark execution as completed
          if (index === steps.length - 1) {
            this.currentExecution!.status = 'completed';
            this.currentExecution!.endTime = new Date().toISOString();
            this.currentExecution!.totalDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0);
            this.isExecuting = false;
            this.addConsoleLog(`\nExecution completed successfully!`);
            this.addConsoleLog(`Total duration: ${this.currentExecution!.totalDuration.toFixed(2)}s`);
          }

          this.currentExecution!.analytics = this.calculateAnalytics(steps);
        }, 3000); // Complete after 3 seconds
      }, index * 3500); // Stagger steps by 3.5 seconds
    });
  }

  generateMockOutput(nodeType: string): any {
    switch (nodeType) {
      case 'text extraction':
        return {
          documentType: 'W2 Form',
          extractedFields: {
            employerName: 'Acme Corporation',
            employeeSSN: '***-**-1234',
            wages: '85,000.00',
            taxYear: '2023'
          },
          confidence: 0.95
        };
      case 'insights executor':
        return {
          insights: [
            'Total income from W2: $85,000',
            'Income verification status: Confirmed',
            'Employment stability: 5+ years'
          ],
          riskLevel: 'Low',
          recommendation: 'Approve'
        };
      case 'output generator':
        return {
          finalDecision: 'Approved',
          approvedAmount: 450000,
          interestRate: 6.5,
          termYears: 30,
          monthlyPayment: 2844.53
        };
      default:
        return { message: 'Processing completed' };
    }
  }

  calculateAnalytics(steps: ExecutionStep[]): ExecutionAnalytics {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let totalDuration = 0;

    const stepBreakdown: StepAnalytics[] = [];

    steps.forEach(step => {
      if (step.status === 'completed') {
        totalInputTokens += step.tokens.input;
        totalOutputTokens += step.tokens.output;
        totalCost += step.cost;
        totalDuration += step.duration || 0;

        stepBreakdown.push({
          stepNumber: step.stepNumber,
          stepName: step.stepName,
          tokens: step.tokens.input + step.tokens.output,
          inputTokens: step.tokens.input,
          outputTokens: step.tokens.output,
          cost: step.cost,
          duration: step.duration || 0
        });
      }
    });

    return {
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      totalDuration,
      stepBreakdown
    };
  }

  addConsoleLog(message: string) {
    if (this.currentExecution) {
      const timestamp = new Date().toLocaleTimeString();
      this.currentExecution.consoleLogs.push(`[${timestamp}] ${message}`);
    }
  }

  // Step interaction
  toggleStepExpansion(stepNumber: number) {
    const step = this.currentExecution?.steps.find(s => s.stepNumber === stepNumber);
    if (step) {
      step.isExpanded = !step.isExpanded;
    }
  }

  // Edit functionality
  openEditModal(stepNumber: number) {
    this.editingStepNumber = stepNumber;
    const step = this.currentExecution?.steps.find(s => s.stepNumber === stepNumber);
    if (step && step.outputData) {
      this.editedOutput = JSON.stringify(step.outputData, null, 2);
      this.showEditModal = true;
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingStepNumber = null;
    this.editedOutput = '';
  }

  saveEditedOutput() {
    if (this.editingStepNumber === null || !this.currentExecution) return;

    try {
      const parsedOutput = JSON.parse(this.editedOutput);
      const step = this.currentExecution.steps.find(s => s.stepNumber === this.editingStepNumber);
      if (step) {
        step.outputData = parsedOutput;
        this.addConsoleLog(`[Step ${step.stepNumber}] Output manually edited`);
        alert('Output saved successfully!');
      }
      this.closeEditModal();
    } catch (error) {
      alert('Invalid JSON format. Please check your edits.');
    }
  }

  // Rerun functionality
  rerunFromStep(stepNumber: number) {
    if (!this.currentExecution) return;

    if (!confirm(`Rerun workflow from Step ${stepNumber}? This will clear outputs from Step ${stepNumber} onwards.`)) {
      return;
    }

    // Reset steps from stepNumber onwards
    this.currentExecution.steps.forEach((step, index) => {
      if (step.stepNumber >= stepNumber) {
        step.status = 'pending';
        step.startTime = undefined;
        step.endTime = undefined;
        step.duration = undefined;
        step.outputData = undefined;
        step.tokens = { input: 0, output: 0 };
        step.cost = 0;
      }
    });

    this.currentExecution.status = 'running';
    this.isExecuting = true;
    this.addConsoleLog(`\nRerunning workflow from Step ${stepNumber}...`);

    // Simulate execution from the selected step
    const stepsToRun = this.currentExecution.steps.slice(stepNumber - 1);
    stepsToRun.forEach((step, index) => {
      setTimeout(() => {
        step.status = 'running';
        step.startTime = new Date().toISOString();
        this.addConsoleLog(`[Step ${step.stepNumber}] Starting: ${step.stepName}`);

        setTimeout(() => {
          step.status = 'completed';
          step.endTime = new Date().toISOString();
          step.duration = 2 + Math.random() * 3;
          step.outputData = this.generateMockOutput(step.node);
          step.tokens = {
            input: Math.floor(100 + Math.random() * 200),
            output: Math.floor(200 + Math.random() * 400)
          };
          step.cost = (step.tokens.input * 0.03 + step.tokens.output * 0.06) / 1000;

          this.addConsoleLog(`[Step ${step.stepNumber}] Completed: ${step.stepName} (${step.duration.toFixed(2)}s)`);

          if (index === stepsToRun.length - 1) {
            this.currentExecution!.status = 'completed';
            this.currentExecution!.endTime = new Date().toISOString();
            this.isExecuting = false;
            this.addConsoleLog(`\nRerun completed successfully!`);
          }

          this.currentExecution!.analytics = this.calculateAnalytics(this.currentExecution!.steps);
        }, 3000);
      }, index * 3500);
    });
  }

  getStepStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⟳';
      case 'completed': return '✓';
      case 'failed': return '✗';
      default: return '○';
    }
  }

  getStepStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'step-pending';
      case 'running': return 'step-running';
      case 'completed': return 'step-completed';
      case 'failed': return 'step-failed';
      default: return '';
    }
  }

  getNodeIcon(node: string): string {
    const nodeLower = node.toLowerCase();

    if (nodeLower.includes('extraction') || nodeLower.includes('extract')) {
      // Document/Text extraction
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/>
      </svg>`;
    } else if (nodeLower.includes('validation') || nodeLower.includes('validate')) {
      // Data validation
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>`;
    } else if (nodeLower.includes('calculation') || nodeLower.includes('calculate') || nodeLower.includes('compute')) {
      // Calculation/computation
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>`;
    } else if (nodeLower.includes('analysis') || nodeLower.includes('analyze') || nodeLower.includes('insights') || nodeLower.includes('executor')) {
      // Analysis/insights
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
      </svg>`;
    } else if (nodeLower.includes('output') || nodeLower.includes('generate') || nodeLower.includes('generator')) {
      // Output generation
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
      </svg>`;
    } else if (nodeLower.includes('image')) {
      // Image processing
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>`;
    } else {
      // Default/generic processor
      return `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>`;
    }
  }

  getNodeIconClass(node: string): string {
    const nodeLower = node.toLowerCase();

    if (nodeLower.includes('extraction') || nodeLower.includes('extract')) {
      return 'node-icon-extraction';
    } else if (nodeLower.includes('validation') || nodeLower.includes('validate')) {
      return 'node-icon-validation';
    } else if (nodeLower.includes('calculation') || nodeLower.includes('calculate') || nodeLower.includes('compute')) {
      return 'node-icon-calculation';
    } else if (nodeLower.includes('analysis') || nodeLower.includes('analyze') || nodeLower.includes('insights') || nodeLower.includes('executor')) {
      return 'node-icon-analysis';
    } else if (nodeLower.includes('output') || nodeLower.includes('generate') || nodeLower.includes('generator')) {
      return 'node-icon-output';
    } else if (nodeLower.includes('image')) {
      return 'node-icon-image';
    } else {
      return 'node-icon-default';
    }
  }

  isDocumentExtractionStep(node: string): boolean {
    const nodeLower = node.toLowerCase();
    return nodeLower.includes('extraction') ||
           nodeLower.includes('extract') ||
           nodeLower.includes('document') ||
           nodeLower.includes('image');
  }

  // Accuracy tracking methods
  markStepAccuracy(stepNumber: number, status: 'correct' | 'incorrect') {
    const step = this.currentExecution?.steps.find(s => s.stepNumber === stepNumber);
    if (step) {
      step.accuracyStatus = status;
      step.verifiedAt = new Date().toISOString();

      // If any step is marked incorrect, automatically mark execution as incorrect
      if (status === 'incorrect' && this.currentExecution) {
        this.currentExecution.executionAccuracy = 'incorrect';
        this.currentExecution.verifiedAt = new Date().toISOString();
        this.addConsoleLog(`Execution automatically marked as incorrect due to step ${stepNumber}`);
      }

      this.saveExecutionHistory();
      this.recalculateMetrics();
      this.addConsoleLog(`[Step ${stepNumber}] Marked as ${status}`);
    }
  }

  markExecutionAccuracy(status: 'correct' | 'incorrect') {
    if (this.currentExecution) {
      this.currentExecution.executionAccuracy = status;
      this.currentExecution.verifiedAt = new Date().toISOString();
      this.saveExecutionHistory();
      this.recalculateMetrics();
      this.addConsoleLog(`Execution marked as ${status}`);
    }
  }

  saveExecutionHistory() {
    if (this.currentExecution) {
      // Remove if already exists (update scenario)
      this.executionHistory = this.executionHistory.filter(
        e => e.id !== this.currentExecution!.id
      );
      // Add current execution
      this.executionHistory.push(JSON.parse(JSON.stringify(this.currentExecution)));
      // Persist to localStorage
      localStorage.setItem(
        'workflow-execution-history',
        JSON.stringify(this.executionHistory)
      );
    }
  }

  loadExecutionHistory() {
    const stored = localStorage.getItem('workflow-execution-history');
    if (stored) {
      try {
        this.executionHistory = JSON.parse(stored);
        this.recalculateMetrics();
      } catch (error) {
        console.error('Error loading execution history:', error);
        this.executionHistory = [];
      }
    }
  }

  recalculateMetrics() {
    // Calculate accuracy metrics
    const verified = this.executionHistory.filter(e => e.executionAccuracy);
    this.accuracyMetrics.totalRuns = this.executionHistory.length;
    this.accuracyMetrics.correctRuns = this.executionHistory.filter(
      e => e.executionAccuracy === 'correct'
    ).length;
    this.accuracyMetrics.incorrectRuns = this.executionHistory.filter(
      e => e.executionAccuracy === 'incorrect'
    ).length;
    this.accuracyMetrics.unverifiedRuns = this.executionHistory.filter(
      e => !e.executionAccuracy
    ).length;
    this.accuracyMetrics.accuracyRate = verified.length > 0
      ? (this.accuracyMetrics.correctRuns / verified.length) * 100
      : 0;

    // Calculate step-level accuracy
    const allSteps = this.executionHistory.flatMap(e => e.steps);
    const verifiedSteps = allSteps.filter(s => s.accuracyStatus);
    this.accuracyMetrics.stepAccuracy.totalSteps = allSteps.length;
    this.accuracyMetrics.stepAccuracy.correctSteps = allSteps.filter(
      s => s.accuracyStatus === 'correct'
    ).length;
    this.accuracyMetrics.stepAccuracy.incorrectSteps = allSteps.filter(
      s => s.accuracyStatus === 'incorrect'
    ).length;
    this.accuracyMetrics.stepAccuracy.stepAccuracyRate = verifiedSteps.length > 0
      ? (this.accuracyMetrics.stepAccuracy.correctSteps / verifiedSteps.length) * 100
      : 0;

    // Calculate per-step breakdown
    this.accuracyMetrics.stepBreakdown = this.calculateStepBreakdown();

    // Calculate unique loans and borrowers
    const uniqueLoanIds = new Set<number>();
    const uniqueBorrowerIds = new Set<string>();

    this.executionHistory.forEach(execution => {
      uniqueLoanIds.add(execution.loanId);
      if (execution.borrowerId) {
        uniqueBorrowerIds.add(`${execution.loanId}-${execution.borrowerId}`);
      }
    });

    this.accuracyMetrics.uniqueLoans = uniqueLoanIds.size;
    this.accuracyMetrics.uniqueBorrowers = uniqueBorrowerIds.size;

    // Calculate performance averages
    if (this.executionHistory.length > 0) {
      this.performanceAverages.totalRuns = this.executionHistory.length;
      this.performanceAverages.avgInputTokens =
        this.executionHistory.reduce((sum, e) => sum + e.analytics.totalInputTokens, 0) /
        this.executionHistory.length;
      this.performanceAverages.avgOutputTokens =
        this.executionHistory.reduce((sum, e) => sum + e.analytics.totalOutputTokens, 0) /
        this.executionHistory.length;
      this.performanceAverages.avgTokens =
        this.performanceAverages.avgInputTokens + this.performanceAverages.avgOutputTokens;
      this.performanceAverages.avgCost =
        this.executionHistory.reduce((sum, e) => sum + e.analytics.totalCost, 0) /
        this.executionHistory.length;
      this.performanceAverages.avgDuration =
        this.executionHistory.reduce((sum, e) => sum + e.analytics.totalDuration, 0) /
        this.executionHistory.length;
    }
  }

  calculateStepBreakdown(): StepAccuracyBreakdown[] {
    if (this.executionHistory.length === 0) {
      return [];
    }

    // Get unique step numbers and names from all executions
    const stepMap = new Map<number, { name: string; correct: number; incorrect: number; total: number }>();

    this.executionHistory.forEach(execution => {
      execution.steps.forEach(step => {
        if (!stepMap.has(step.stepNumber)) {
          stepMap.set(step.stepNumber, {
            name: step.stepName,
            correct: 0,
            incorrect: 0,
            total: 0
          });
        }

        const stepData = stepMap.get(step.stepNumber)!;
        stepData.total++;

        if (step.accuracyStatus === 'correct') {
          stepData.correct++;
        } else if (step.accuracyStatus === 'incorrect') {
          stepData.incorrect++;
        }
      });
    });

    // Convert map to array and calculate accuracy rates
    const breakdown: StepAccuracyBreakdown[] = [];
    stepMap.forEach((data, stepNumber) => {
      const verifiedCount = data.correct + data.incorrect;
      breakdown.push({
        stepNumber,
        stepName: data.name,
        correctCount: data.correct,
        incorrectCount: data.incorrect,
        totalRuns: data.total,
        accuracyRate: verifiedCount > 0 ? (data.correct / verifiedCount) * 100 : 0
      });
    });

    // Sort by step number
    return breakdown.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  getGaugeOffset(percentage: number): number {
    const circumference = 283; // 2 * PI * radius (45)
    return circumference - (circumference * percentage / 100);
  }

  initializeMockAverages() {
    // If no history exists, set dummy averages for demonstration
    if (this.executionHistory.length === 0) {
      this.accuracyMetrics = {
        totalRuns: 25,
        correctRuns: 22,
        incorrectRuns: 2,
        unverifiedRuns: 1,
        accuracyRate: 91.7,
        stepAccuracy: {
          totalSteps: 125,
          correctSteps: 110,
          incorrectSteps: 10,
          stepAccuracyRate: 91.7
        },
        stepBreakdown: [
          { stepNumber: 1, stepName: 'Document Extraction', correctCount: 23, incorrectCount: 1, totalRuns: 25, accuracyRate: 95.8 },
          { stepNumber: 2, stepName: 'Data Validation', correctCount: 22, incorrectCount: 2, totalRuns: 25, accuracyRate: 91.7 },
          { stepNumber: 3, stepName: 'Income Calculation', correctCount: 24, incorrectCount: 0, totalRuns: 25, accuracyRate: 100.0 },
          { stepNumber: 4, stepName: 'Generate Output', correctCount: 21, incorrectCount: 3, totalRuns: 25, accuracyRate: 87.5 }
        ],
        uniqueLoans: 12,
        uniqueBorrowers: 18
      };

      this.performanceAverages = {
        avgTokens: 3420,
        avgInputTokens: 1250,
        avgOutputTokens: 2170,
        avgCost: 0.0425,
        avgDuration: 8.3,
        totalRuns: 25
      };
    }
  }

  // Document viewer methods
  loadMockDocuments() {
    this.documents = [
      {
        id: 'doc-1',
        name: '2023_W2_Form.pdf',
        type: 'w2',
        url: 'assets/mock-docs/sample-w2.pdf',
        uploadedAt: '2024-01-15T10:30:00Z',
        pageCount: 2
      },
      {
        id: 'doc-2',
        name: 'January_2024_Paystub.pdf',
        type: 'paystub',
        url: 'assets/mock-docs/sample-paystub.pdf',
        borrowerId: 1,
        uploadedAt: '2024-02-01T14:20:00Z',
        pageCount: 1
      },
      {
        id: 'doc-3',
        name: 'Bank_Statement_Dec_2023.pdf',
        type: 'bank_statement',
        url: 'assets/mock-docs/sample-bank-statement.pdf',
        uploadedAt: '2024-01-05T09:15:00Z',
        pageCount: 8
      },
      {
        id: 'doc-4',
        name: '2022_Tax_Return_1040.pdf',
        type: '1040',
        url: 'assets/mock-docs/sample-1040.pdf',
        uploadedAt: '2023-12-20T16:45:00Z',
        pageCount: 15
      }
    ];
  }

  openDocumentViewer(document?: LoanDocument) {
    this.selectedDocument = document || this.documents[0];
    this.showDocumentViewer = true;
  }

  closeDocumentViewer() {
    this.showDocumentViewer = false;
    this.selectedDocument = null;
  }

  selectDocument(doc: LoanDocument) {
    this.selectedDocument = doc;
  }

  getDocumentsByLevel(): LoanDocument[] {
    if (this.testType === 'loan') {
      return this.documents.filter(d => !d.borrowerId);
    } else {
      return this.documents.filter(d =>
        !d.borrowerId || d.borrowerId === this.selectedBorrowerId
      );
    }
  }
}
