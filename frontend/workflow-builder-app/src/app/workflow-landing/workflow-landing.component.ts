import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Workflow {
  id?: number;
  type: string;
  version: string;
  datapointName: string;
  workflowName: string;
  description: string;
  category?: string;
  documents: {
    primaryDoc: string;
    otherdocs: string[] | null;
  };
}

interface WorkflowApiResponse {
  id: number;
  workflowName: string | null;
  description: string | null;
  category: string | null;
  doc_type: string | null;
  other_doc: string[] | null;
  version: number | null;
  flowType: string | null;
}  
  
@Component({
  selector: 'app-workflow-landing',
  templateUrl: './workflow-landing.component.html',
  standalone: false,
  styleUrls: ['./workflow-landing.component.css']
})
export class WorkflowLandingComponent implements OnInit {  
  // JSON Data  
  private workflowsData: Workflow[] = [
    {
      type: "standard",
      version: "1.0",
      datapointName: "SCH C calculation",
      workflowName: "SCH C calculation",
      description: "NA",
      documents: {
        primaryDoc: "Schedule C",
        otherdocs: null
      }
    },
    {
      type: "agentic",
      version: "1.0",
      datapointName: "SCH B calculation",
      workflowName: "SCH B calculation",
      description: "NA",
      documents: {
        primaryDoc: "Schedule B",
        otherdocs: null
      }
    },
    {
      type: "orchestrator",
      version: "1.0",
      datapointName: "self employed income calculation",
      workflowName: "self employed income calculation",
      description: "NA",
      documents: {
        primaryDoc: "Schedule D",
        otherdocs: null
      }
    }
  ];  
  
  workflows: Workflow[] = [];
  filteredWorkflows: Workflow[] = [];
  searchQuery: string = '';
  showCreateView: boolean = false;
  editingIndex: number = -1;
  isLoading: boolean = true;
  loadingWorkflowId: number | null = null;  
  
  // Form Data
  formData = {
    workflowName: '',
    description: '',
    type: '',
    category: '',
    primaryDoc: '',
    otherDocs: [] as string[]
  };
  errors = {
    workflowName: false,
    type: false,
    category: false,
    primaryDoc: false
  };  
  
  // Dropdown Options
  workflowTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'agentic', label: 'Agentic' },
    { value: 'orchestrator', label: 'Orchestrator' }
  ];

  categories = [
    { value: 'income', label: 'Income' },
    { value: 'liability', label: 'Liability' },
    { value: 'asset', label: 'Asset' },
    { value: 'credit', label: 'Credit' }
  ];  
  
  primaryDocuments = [  
    'Form 1040', 'Schedule C', 'Schedule B', 'Schedule D',  
    'W-2', '1099-INT', '1099-NEC', 'K-1'  
  ];  
  
  otherDocuments = [  
    'Form 4562', 'Form 8829', 'Schedule SE', 'Form 1099-MISC',  
    'Bank Statements', 'Receipts', 'Invoices'  
  ];  
  
  showTypeDropdown = false;
  showCategoryDropdown = false;
  showPrimaryDropdown = false;
  showOtherDropdown = false;
  primarySearchQuery = '';
  otherSearchQuery = '';
  isDarkTheme = true;

  private apiBaseUrl = 'http://localhost:8000/api/v1';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.initializeTheme();
    this.loadDocuments();
    this.loadWorkflows();
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('workflow-theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
    this.applyTheme();
  }

  applyTheme() {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(this.isDarkTheme ? 'theme-dark' : 'theme-light');
  }

  toggleTheme(event?: Event) {
    event?.stopPropagation();
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('workflow-theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  loadDocuments() {
    this.http.get<string[]>(`${this.apiBaseUrl}/documents`).subscribe({
      next: (documents) => {
        this.primaryDocuments = documents;
        this.otherDocuments = documents;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        // Keep default documents if API fails
      }
    });
  }

  loadWorkflows() {
    this.isLoading = true;
    this.http.get<WorkflowApiResponse[]>(`${this.apiBaseUrl}/workflows`).subscribe({
      next: (apiWorkflows) => {
        this.workflows = apiWorkflows.map(w => ({
          id: w.id,
          type: w.flowType || 'standard',
          version: w.version?.toString() || '1.0',
          datapointName: w.workflowName || '',
          workflowName: w.workflowName || '',
          description: w.description || 'NA',
          category: w.category || 'N/A',
          documents: {
            primaryDoc: w.doc_type || '',
            otherdocs: w.other_doc || null
          }
        }));
        this.filteredWorkflows = [...this.workflows];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading workflows:', error);
        // Fallback to local data if API fails
        this.workflows = [...this.workflowsData];
        this.filteredWorkflows = [...this.workflows];
        this.isLoading = false;
      }
    });
  }  
  
  // Search functionality  
  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredWorkflows = [...this.workflows];
      return;
    }

    this.filteredWorkflows = this.workflows.filter(workflow => {
      const workflowName = workflow.workflowName.toLowerCase();
      const primaryDoc = workflow.documents.primaryDoc.toLowerCase();
      const type = workflow.type.toLowerCase();
      return workflowName.includes(query) ||
             primaryDoc.includes(query) ||
             type.includes(query);
    });
  }  
  
  // Card actions
  getBadgeClass(workflow: Workflow): string {
    return workflow.type;
  }  
  
  onEdit(index: number) {
    const actualIndex = this.workflows.indexOf(this.filteredWorkflows[index]);
    this.editingIndex = actualIndex;
    const workflow = this.workflows[actualIndex];

    this.formData.workflowName = workflow.workflowName;
    this.formData.description = workflow.description !== 'NA' ? workflow.description : '';
    this.formData.type = workflow.type;
    this.formData.category = workflow.category || '';
    this.formData.primaryDoc = workflow.documents.primaryDoc;
    this.formData.otherDocs = workflow.documents.otherdocs ? [...workflow.documents.otherdocs] : [];

    this.showCreateView = true;
  }  
  
  onDelete(index: number) {
    const actualIndex = this.workflows.indexOf(this.filteredWorkflows[index]);
    const workflow = this.workflows[actualIndex];

    if (confirm(`Are you sure you want to delete "${workflow.workflowName}"?`)) {
      if (!workflow.id) {
        // If no ID, just remove from local array
        this.workflows.splice(actualIndex, 1);
        this.filteredWorkflows = [...this.workflows];
        alert('Workflow deleted successfully!');
        return;
      }

      // Call API to delete workflow
      this.http.delete(`${this.apiBaseUrl}/workflows/${workflow.id}`).subscribe({
        next: (response) => {
          console.log('Workflow deleted successfully:', response);
          this.workflows.splice(actualIndex, 1);
          this.filteredWorkflows = [...this.workflows];
          alert('Workflow deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting workflow:', error);
          alert('Failed to delete workflow. Please try again.');
        }
      });
    }
  }  
  
  onPipeline(index: number) {
    const workflow = this.filteredWorkflows[index];

    if (!workflow.id) {
      alert('Workflow ID is missing');
      return;
    }

    // Set loading state for this workflow
    this.loadingWorkflowId = workflow.id;
    console.log('Fetching workflow details for ID:', workflow.id);

    // Call both APIs in parallel
    const workflowDetailsRequest = this.http.post<any>(`${this.apiBaseUrl}/getworkflowdetails`, { id: workflow.id });
    const documentsRequest = this.http.get<string[]>(`${this.apiBaseUrl}/documents`);

    // Use forkJoin to wait for both requests
    Promise.all([
      workflowDetailsRequest.toPromise(),
      documentsRequest.toPromise()
    ]).then(([workflowDetailsResponse, documentList]) => {
      console.log('Workflow details received:', workflowDetailsResponse);
      console.log('Documents received:', documentList);

      const workflowDetails = workflowDetailsResponse.workflowDetails;
      const datapointList = workflowDetailsResponse.datapointList;
      const flowType = workflowDetails.flowType;

      console.log('FlowType received:', flowType);

      // Check flowType (case-insensitive)
      const flowTypeLower = (flowType || '').toLowerCase();
      if (flowTypeLower === 'agentic' || flowTypeLower === 'orchestrator') {
        // Navigate to workflow builder with data
        const navigationData = {
          workflowDetails: workflowDetails,
          documentList: documentList || [],
          datapointList: datapointList || []
        };

        console.log('Navigating to workflow builder with data:', navigationData);

        this.router.navigate(['/pipeline'], {
          state: { workflowData: navigationData }
        });
        // Note: Loading state will persist until page navigation completes
      } else {
        // Show alert for standard workflow and clear loading
        console.log('FlowType not Agentic/Orchestrator, showing standard message');
        this.loadingWorkflowId = null;
        alert('Standard is on its way. Kindly wait for some time.');
      }
    }).catch(error => {
      console.error('Error fetching workflow data:', error);
      this.loadingWorkflowId = null;
      alert('Failed to load workflow details. Please try again.');
    });
  }  
  
  // Create/Edit workflow  
  openCreateView() {  
    this.resetForm();  
    this.editingIndex = -1;  
    this.showCreateView = true;  
  }  
  
  closeCreateView() {  
    this.showCreateView = false;  
    this.editingIndex = -1;  
    this.resetForm();  
  }  
  
  resetForm() {
    this.formData = {
      workflowName: '',
      description: '',
      type: '',
      category: '',
      primaryDoc: '',
      otherDocs: []
    };
    this.errors = {
      workflowName: false,
      type: false,
      category: false,
      primaryDoc: false
    };
    this.primarySearchQuery = '';
    this.otherSearchQuery = '';
  }  
  
  onWorkflowNameChange() {
    if (this.formData.workflowName.trim()) {
      this.errors.workflowName = false;
    }
  }  
  
  // Dropdown handlers
  selectType(type: string) {
    this.formData.type = type;
    this.errors.type = false;
    this.showTypeDropdown = false;
  }

  selectCategory(category: string) {
    this.formData.category = category;
    this.errors.category = false;
    this.showCategoryDropdown = false;
  }  
  
  selectPrimaryDoc(doc: string) {  
    this.formData.primaryDoc = doc;  
    this.errors.primaryDoc = false;  
    this.showPrimaryDropdown = false;  
  }  
  
  toggleOtherDoc(doc: string) {  
    const index = this.formData.otherDocs.indexOf(doc);  
    if (index > -1) {  
      this.formData.otherDocs.splice(index, 1);  
    } else {  
      this.formData.otherDocs.push(doc);  
    }  
  }  
  
  removeOtherDoc(doc: string) {  
    const index = this.formData.otherDocs.indexOf(doc);  
    if (index > -1) {  
      this.formData.otherDocs.splice(index, 1);  
    }  
  }  
  
  isOtherDocSelected(doc: string): boolean {  
    return this.formData.otherDocs.includes(doc);  
  }  
  
  get filteredPrimaryDocs() {  
    if (!this.primarySearchQuery) return this.primaryDocuments;  
    return this.primaryDocuments.filter(doc =>   
      doc.toLowerCase().includes(this.primarySearchQuery.toLowerCase())  
    );  
  }  
  
  get filteredOtherDocs() {  
    if (!this.otherSearchQuery) return this.otherDocuments;  
    return this.otherDocuments.filter(doc =>   
      doc.toLowerCase().includes(this.otherSearchQuery.toLowerCase())  
    );  
  }  
  
  getTypeLabel(): string {
    const type = this.workflowTypes.find(t => t.value === this.formData.type);
    return type ? type.label : '';
  }

  getCategoryLabel(): string {
    const category = this.categories.find(c => c.value === this.formData.category);
    return category ? category.label : '';
  }  
  
  onSave() {
    this.errors.workflowName = !this.formData.workflowName.trim();
    this.errors.type = !this.formData.type;
    this.errors.category = !this.formData.category;
    this.errors.primaryDoc = !this.formData.primaryDoc;

    if (this.errors.workflowName || this.errors.type || this.errors.category || this.errors.primaryDoc) {
      return;
    }

    if (this.editingIndex >= 0) {
      // Update existing workflow via API
      const workflowId = this.workflows[this.editingIndex].id;

      if (!workflowId) {
        alert('Cannot update workflow without ID');
        return;
      }

      const payload = {
        workflowName: this.formData.workflowName,
        description: this.formData.description || null,
        category: this.formData.category,
        doc_type: this.formData.primaryDoc,
        other_doc: this.formData.otherDocs.length > 0 ? this.formData.otherDocs : null,
        flowType: this.formData.type,
        version: 1
      };

      console.log('Updating workflow with payload:', JSON.stringify(payload, null, 2));

      this.http.put<WorkflowApiResponse>(`${this.apiBaseUrl}/workflows/${workflowId}`, payload).subscribe({
        next: (response) => {
          console.log('Workflow updated successfully:', response);
          this.closeCreateView();
          alert('Workflow updated successfully!');
          // Reload workflows from database to ensure data is in sync
          this.loadWorkflows();
        },
        error: (error) => {
          console.error('Error updating workflow:', error);
          alert('Failed to update workflow. Please try again.');
        }
      });
    } else {
      // Create new workflow via API
      const payload = {
        workflowName: this.formData.workflowName,
        description: this.formData.description || null,
        category: this.formData.category,
        doc_type: this.formData.primaryDoc,
        other_doc: this.formData.otherDocs.length > 0 ? this.formData.otherDocs : null,
        flowType: this.formData.type,
        version: 1
      };

      console.log('Creating workflow with payload:', JSON.stringify(payload, null, 2));

      this.http.post<WorkflowApiResponse>(`${this.apiBaseUrl}/createworkflow`, payload).subscribe({
        next: (response) => {
          console.log('Workflow created successfully:', response);
          this.closeCreateView();
          alert('Workflow created successfully!');
          // Reload workflows from database to ensure data is in sync
          this.loadWorkflows();
        },
        error: (error) => {
          console.error('Error creating workflow:', error);
          alert('Failed to create workflow. Please try again.');
        }
      });
    }
  }  
  
  // Click outside to close dropdowns
  closeAllDropdowns() {
    this.showTypeDropdown = false;
    this.showCategoryDropdown = false;
    this.showPrimaryDropdown = false;
    this.showOtherDropdown = false;
  }  
}  