import { Component, OnInit, HostListener, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Step {
  id: number;
  name: string;
  node: string;
  prerequisite: string;
  prompt: string;
  note: string;
  datapoints: number[];
  pydanticClasses: PydanticClass[];
  pydanticObject: { className: string };
  codeBlock: string;
  x?: number;
  y?: number;
  connectedTo?: number; // ID of the step this connects to
}

interface Connector {
  fromStepId: number;
  toStepId: number;
  path: string;
  midX: number;
  midY: number;
}

interface PydanticClass {
  name: string;
  code: string;
}

interface Datapoint {
  pid: number;
  name: string;
}

interface Document {
  id: number;
  name: string;
  selected: boolean;
}

@Component({
  selector: 'app-workflow-builder',
  templateUrl: './workflow-builder.component.html',
  standalone: false,
  styleUrls: ['./workflow-builder.component.css']
})
export class WorkflowBuilderComponent implements OnInit {
  steps: Step[] = [];
  selectedStepId: number | null = null;
  currentDatapoints: number[] = [];
  currentPydanticClasses: PydanticClass[] = [];
  currentPydanticObjectClass: string = '';
  deletedSteps: Step[] = [];

  // Form data
  stepName: string = '';
  nodeType: string = 'text extraction';
  prerequisite: string = '';
  promptEditor: string = '';
  importantNote: string = '';
  codeBlock: string = '';

  // UI state
  zoom: number = 0.6;
  zoomMin: number = 0.5;
  zoomMax: number = 2;
  zoomStep: number = 0.1;
  isEditorOpen: boolean = false;
  isPromptCollapsed: boolean = false;
  isWorkflowSettingsOpen: boolean = false;
  isNavRightCollapsed: boolean = false;
  showSaveDropdown: boolean = false;

  // Workflow Settings
  workflowDescription: string = '';
  workflowType: string = '';
  category: string = '';
  primaryDocument: string = '';
  otherDocumentsInput: string = '';
  selectedOtherDocuments: string[] = [];

  // Workflow Settings Dropdowns
  showPrimaryDocDropdown: boolean = false;
  showOtherDocsDropdown: boolean = false;
  showWorkflowTypeDropdown: boolean = false;
  showCategoryDropdown: boolean = false;
  primaryDocSearch: string = '';
  otherDocSearch: string = '';

  // Dropdown options
  workflowTypeOptions: string[] = ['agentic', 'orchestrator'];
  categoryOptions: string[] = ['income', 'liability', 'asset', 'credit'];

  // Modal editor state
  isModalEditorOpen: boolean = false;
  modalEditorContent: string = '';
  modalEditorField: string = '';
  modalEditorLabel: string = '';
  modalEditorClassIndex: number = -1;

  // Prompt
  promptInput: string = '';
  promptHistory: string[] = [];
  isGenerating: boolean = false;

  // Datapoints
  datapointSearch: string = '';
  isDatapointDropdownOpen: boolean = false;
  datapoints: Datapoint[] = [
    { pid: 2, name: 'Schedule C income calculation' },
    { pid: 1, name: 'Schedule B income calculation' },
    { pid: 3, name: 'Schedule E income calculation' },
    { pid: 5, name: 'Paystub income calculation' },
    { pid: 6, name: 'W2 income calculation' }
  ];

  datapointAliases: { [key: string]: string } = {
    'sch c': 'Schedule C income calculation',
    'sch b': 'Schedule B income calculation',
    'sch e': 'Schedule E income calculation',
    'paystub': 'Paystub income calculation',
    'w2': 'W2 income calculation'
  };

  // Documents
  docSearch: string = '';
  newDocInput: string = '';
  documents: Document[] = [
    { id: 1, name: 'Aadhaar Card', selected: false },
    { id: 2, name: 'PAN Card', selected: false },
    { id: 3, name: 'Bank Statement', selected: false },
    { id: 4, name: 'Passport', selected: false }
  ];

  // Flow config
  flowType: string = 'prompt';
  jsonOutput: string = '';

  // Node types
  nodeTypes: string[] = [
    'text extraction',
    'image extraction',
    'analysis',
    'document eligibility check',
    'insights executor',
    'output generator'
  ];

  workflowName: string = '';
  isDarkTheme: boolean = false;
  workflowVersion: string = 'v1.0';
  workflowId: number | null = null;

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeTheme();

    // Check if navigation state contains workflow data
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (this.router as any).lastSuccessfulNavigation?.extras?.state;

    if (state && state['workflowData']) {
      const workflowData = state['workflowData'];
      console.log('Received workflow data:', workflowData);

      // Load workflow details
      if (workflowData.workflowDetails) {
        const details = workflowData.workflowDetails;
        this.workflowId = details.id || null;
        this.workflowName = details.workflowName || 'Workflow';
        this.workflowVersion = 'v' + (details.version || '1.0');
        this.workflowDescription = details.description || '';
        this.workflowType = details.flowType || '';
        this.category = details.category || '';
        this.primaryDocument = details.doc_type || '';

        // Set other documents as comma-separated string and array
        if (details.other_doc && Array.isArray(details.other_doc)) {
          this.selectedOtherDocuments = [...details.other_doc];
          this.otherDocumentsInput = details.other_doc.join(', ');
        } else if (typeof details.other_doc === 'string') {
          this.otherDocumentsInput = details.other_doc;
          this.selectedOtherDocuments = details.other_doc.split(',').map((d: string) => d.trim()).filter((d: string) => d);
        } else {
          this.otherDocumentsInput = '';
          this.selectedOtherDocuments = [];
        }

        // Load workflow from JSON if present
        if (details.workflow) {
          this.loadWorkflowFromJson(details.workflow);
        }
      }

      // Load document list
      if (workflowData.documentList && workflowData.documentList.length > 0) {
        this.documents = workflowData.documentList.map((doc: string, index: number) => ({
          id: index + 1,
          name: doc,
          selected: false
        }));
        console.log('Loaded documents:', this.documents.length);
      }

      // Load datapoint list
      if (workflowData.datapointList && workflowData.datapointList.length > 0) {
        this.datapoints = workflowData.datapointList.map((dp: any) => ({
          pid: dp.id,
          name: dp.datapointName
        }));
        console.log('Loaded datapoints:', this.datapoints.length);
      }
    } else {
      // Fallback to query params for backward compatibility
      this.route.queryParams.subscribe(params => {
        this.workflowName = params['workflow'] || 'Workflow';
        this.workflowVersion = params['version'] || 'v1.0';
      });
    }
  }

  loadWorkflowFromJson(workflowJson: any) {
    try {
      let workflow;

      // Handle JSONB format (already parsed object) or legacy string format
      if (!workflowJson) {
        console.log('No workflow data provided');
        return;
      }

      if (typeof workflowJson === 'string') {
        console.log('Parsing workflow from JSON string');
        workflow = JSON.parse(workflowJson);
      } else if (typeof workflowJson === 'object') {
        console.log('Loading workflow from JSONB object');
        workflow = workflowJson;
      } else {
        console.error('Invalid workflow format:', typeof workflowJson);
        return;
      }

      console.log('Loading workflow with', Array.isArray(workflow) ? workflow.length : 0, 'steps');

      // Clear existing steps
      this.steps = [];
      this.deletedSteps = [];

      // Load steps from workflow (JSONB format is array of steps)
      if (workflow && Array.isArray(workflow)) {
        workflow.forEach((step: any, index: number) => {
          // Check if x and y coordinates exist and are valid numbers
          const hasValidCoordinates =
            (step.x !== undefined && step.x !== null) &&
            (step.y !== undefined && step.y !== null);

          const newStep: Step = {
            id: step.id || (index + 1),
            name: step.name || `Step ${index + 1}`,
            node: step.node || 'text extraction',
            prerequisite: step.prerequisite || '',
            prompt: step.prompt || '',
            note: step.note || '',
            datapoints: step.datapoints || [],
            pydanticClasses: step.pydanticClasses || [],
            pydanticObject: step.pydanticObject || { className: '' },
            codeBlock: step.codeBlock || '',
            x: hasValidCoordinates ? step.x : 680,
            y: hasValidCoordinates ? step.y : 0 + (index * 180),
            connectedTo: step.connectedTo
          };
          this.steps.push(newStep);
        });

        console.log('Successfully loaded', this.steps.length, 'steps from workflow');
      } else {
        console.warn('Workflow is not an array:', workflow);
      }
    } catch (error) {
      console.error('Error loading workflow from JSON:', error);
    }
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

  // Zoom functions
  get zoomLabel(): string {
    return Math.round(this.zoom * 100) + '%';
  }

  zoomIn() {
    this.zoom = Math.min(this.zoomMax, this.zoom + this.zoomStep);
  }

  zoomOut() {
    this.zoom = Math.max(this.zoomMin, this.zoom - this.zoomStep);
  }

  // Editor functions
  openEditor() {
    this.isEditorOpen = true;
  }

  closeEditor() {
    this.isEditorOpen = false;
  }

  // Handle code input with IDE-like features
  handleCodeInput(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;

    // Handle Tab key - insert 4 spaces
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 4 spaces at cursor position
      textarea.value = value.substring(0, start) + '    ' + value.substring(end);

      // Move cursor after the inserted spaces
      textarea.selectionStart = textarea.selectionEnd = start + 4;

      // Trigger change detection
      textarea.dispatchEvent(new Event('input'));
    }

    // Handle Enter key - auto-indent based on previous line
    if (event.key === 'Enter') {
      event.preventDefault();
      const start = textarea.selectionStart;
      const value = textarea.value;

      // Find the start of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);

      // Count leading spaces/tabs
      const indentMatch = currentLine.match(/^[\s]*/);
      const currentIndent = indentMatch ? indentMatch[0] : '';

      // Check if line ends with colon (for Python blocks like if, def, class, etc.)
      const trimmedLine = currentLine.trim();
      const needsExtraIndent = trimmedLine.endsWith(':');

      // Create new line with same indentation (plus extra if after colon)
      const newIndent = needsExtraIndent ? currentIndent + '    ' : currentIndent;
      const newText = '\n' + newIndent;

      // Insert new line with indentation
      textarea.value = value.substring(0, start) + newText + value.substring(start);

      // Move cursor to end of new indent
      textarea.selectionStart = textarea.selectionEnd = start + newText.length;

      // Trigger change detection
      textarea.dispatchEvent(new Event('input'));
    }
  }

  // Prompt panel
  togglePromptPanel() {
    this.isPromptCollapsed = !this.isPromptCollapsed;
  }

  // Nav right panel
  toggleNavRight() {
    this.isNavRightCollapsed = !this.isNavRightCollapsed;
  }

  // Section visibility
  get isInsightsNode(): boolean {
    return this.nodeType === 'insights executor';
  }

  get isOutputGenNode(): boolean {
    return this.nodeType === 'output generator';
  }

  // Datapoint functions
  getDatapointByPid(pid: number): Datapoint | undefined {
    return this.datapoints.find(dp => dp.pid === pid);
  }

  normalizeDatapointName(name: string): string {
    if (!name) return '';
    const trimmed = String(name).trim();
    const aliasKey = trimmed.toLowerCase();
    return this.datapointAliases[aliasKey] || trimmed;
  }

  coerceDatapointIds(raw: any[]): number[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string') {
        const canonical = this.normalizeDatapointName(item);
        const found = this.datapoints.find(d => d.name === canonical);
        return found ? found.pid : null;
      }
      if (typeof item === 'object' && item) {
        if (item.pid != null) return item.pid;
        if (item.id != null) return item.id;
        if (item.dataPointName) {
          const canonical = this.normalizeDatapointName(item.dataPointName);
          const found = this.datapoints.find(d => d.name === canonical);
          return found ? found.pid : null;
        }
      }
      return null;
    }).filter((pid): pid is number => pid !== null);
  }

  get filteredDatapoints(): Datapoint[] {
    const term = this.datapointSearch.toLowerCase();
    return this.datapoints.filter(dp => dp.name.toLowerCase().includes(term));
  }

  isDatapointSelected(pid: number): boolean {
    return this.currentDatapoints.includes(pid);
  }

  toggleDatapoint(pid: number) {
    if (this.currentDatapoints.includes(pid)) {
      this.currentDatapoints = this.currentDatapoints.filter(n => n !== pid);
    } else {
      this.currentDatapoints.push(pid);
    }
  }

  removeDatapoint(pid: number) {
    this.currentDatapoints = this.currentDatapoints.filter(n => n !== pid);
  }

  toggleDatapointDropdown() {
    this.isDatapointDropdownOpen = !this.isDatapointDropdownOpen;
  }

  // Pydantic class functions
  addPydanticClass() {
    this.currentPydanticClasses.push({ name: '', code: '' });
  }

  removePydanticClass(index: number) {
    this.currentPydanticClasses.splice(index, 1);
    if (this.currentPydanticClasses.length === 0) {
      this.currentPydanticClasses.push({ name: '', code: '' });
    }
  }

  get pydanticClassNames(): string[] {
    return this.currentPydanticClasses
      .map(c => (c.name || '').trim())
      .filter(Boolean);
  }

  // Step functions
  formatStepName(name: string): string {
    const maxLen = 20;
    return name.length > maxLen ? name.slice(0, maxLen) + '.....' : name;
  }

  selectStep(id: number) {
    const step = this.steps.find(s => s.id === id);
    if (!step) return;

    this.selectedStepId = id;
    this.stepName = step.name;
    this.nodeType = step.node;
    this.prerequisite = step.prerequisite || '';
    this.promptEditor = step.prompt;
    this.importantNote = step.note;

    this.currentPydanticClasses = Array.isArray(step.pydanticClasses) ? step.pydanticClasses : [];
    this.currentPydanticObjectClass = step.pydanticObject?.className || '';
    this.codeBlock = step.codeBlock || '';

    this.currentDatapoints = this.coerceDatapointIds(step.datapoints || []);
    this.datapointSearch = '';

    this.openEditor();
  }

  addStep() {
    const id = this.steps.length + 1;
    // Position new steps in a staggered pattern
    const x = 50 + (this.steps.length * 30);
    const y = 50 + (this.steps.length * 150);

    this.steps.push({
      id,
      name: `Step ${id}`,
      node: 'text extraction',
      prerequisite: '',
      prompt: '',
      note: '',
      datapoints: [],
      pydanticClasses: [],
      pydanticObject: { className: '' },
      codeBlock: '',
      x,
      y
    });
    this.selectStep(id);
  }

  saveStep() {
    const step = this.steps.find(s => s.id === this.selectedStepId);
    if (!step) return;

    step.name = this.stepName.slice(0, 50);
    step.node = this.nodeType;
    step.prerequisite = this.prerequisite;
    step.prompt = this.promptEditor;
    step.note = this.importantNote;

    step.pydanticClasses = this.currentPydanticClasses
      .map(c => ({ name: (c.name || '').trim(), code: c.code || '' }))
      .filter(c => c.name);

    step.pydanticObject = { className: this.currentPydanticObjectClass };
    step.codeBlock = this.codeBlock;
    step.datapoints = [...this.currentDatapoints];
  }

  deleteStep(id: number) {
    const idx = this.steps.findIndex(s => s.id === id);
    if (idx === -1) return;

    // Save the step for redo functionality (with its current position)
    const deletedStep = { ...this.steps[idx], _deletedAtIndex: idx } as any;
    this.deletedSteps.push(deletedStep);

    // Remove the step
    this.steps.splice(idx, 1);

    // Resequence all step IDs to maintain order
    this.resequenceSteps();

    if (this.steps.length === 0) {
      this.clearEditor();
      return;
    }

    const newIdx = Math.min(idx, this.steps.length - 1);
    this.selectStep(this.steps[newIdx].id);
  }

  redoStep() {
    if (this.deletedSteps.length === 0) return;

    // Get the last deleted step
    const stepToRestore = this.deletedSteps.pop();
    if (!stepToRestore) return;

    const originalIndex = (stepToRestore as any)._deletedAtIndex || this.steps.length;
    delete (stepToRestore as any)._deletedAtIndex;

    // Insert the step at its original position (or at the end if out of bounds)
    const insertIndex = Math.min(originalIndex, this.steps.length);
    this.steps.splice(insertIndex, 0, stepToRestore);

    // Resequence all step IDs to maintain order
    this.resequenceSteps();

    // Select the restored step
    this.selectStep(stepToRestore.id);
  }

  canRedo(): boolean {
    return this.deletedSteps.length > 0;
  }

  onButtonMouseDown(event: MouseEvent, stepId: number) {
    console.log('!!! BUTTON MOUSEDOWN DETECTED !!!', stepId);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Call insertStepAfter directly since click events don't fire reliably in transformed canvas
    console.log('Calling insertStepAfter from mousedown');
    this.insertStepAfter(stepId);
  }

  onAddStepClick(stepId: number, event: MouseEvent) {
    console.log('=== onAddStepClick CALLED ===');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.insertStepAfter(stepId);
  }

  insertStepAfter(id: number) {
    console.log('insertStepAfter called with id:', id);
    const idx = this.steps.findIndex(s => s.id === id);
    console.log('Found index:', idx);

    if (idx === -1) {
      console.log('Step not found');
      return;
    }

    const previousStep = this.steps[idx];
    const nextStep = this.steps[idx + 1];
    console.log('Previous step:', previousStep);
    console.log('Next step:', nextStep);

    // Position new step between the two steps vertically
    const x = previousStep.x || 680;
    let y;
    if (nextStep) {
      // Place halfway between previous and next step
      y = ((previousStep.y || 0) + (nextStep.y || 0)) / 2;
    } else {
      // If no next step, place below previous
      y = (previousStep.y || 0) + 180;
    }

    // Create new step with temporary ID (will be set by resequencing)
    const newStep: Step = {
      id: 0, // Temporary ID, will be set during resequencing
      name: `Step 0`, // Temporary name with number so it gets updated
      node: 'text extraction',
      prerequisite: '',
      prompt: '',
      note: '',
      datapoints: [],
      pydanticClasses: [],
      pydanticObject: { className: '' },
      codeBlock: '',
      x,
      y
    };

    console.log('Creating new step:', newStep);

    // Insert step after the current one
    this.steps.splice(idx + 1, 0, newStep);
    console.log('Steps after insert:', this.steps.length);

    // Resequence all steps to maintain proper order
    this.resequenceSteps();
    console.log('After resequence:', this.steps);

    // Select the newly inserted step (it will be at idx + 1 with id = idx + 2)
    this.selectStep(this.steps[idx + 1].id);
    console.log('Selected new step with id:', this.steps[idx + 1].id);
  }

  // Resequence step IDs to maintain incremental order
  resequenceSteps() {
    this.steps.forEach((step, index) => {
      const newId = index + 1;

      // Only update the name if it follows the default "Step N" pattern
      if (/^Step \d+$/.test(step.name)) {
        step.name = `Step ${newId}`;
      }

      step.id = newId;
    });
  }

  // Drag and Drop functionality for free positioning
  draggedStepId: number | null = null;
  isDragging: boolean = false;
  dragOffset = { x: 0, y: 0 };

  // Canvas panning
  isPanMode: boolean = false;
  isPanning: boolean = false;
  panOffset = { x: 0, y: 0 };
  canvasTranslate = { x: 0, y: 0 };
  lastPanPosition = { x: 0, y: 0 };

  onCanvasDoubleClick(event: MouseEvent) {
    // Enable pan mode
    this.isPanMode = !this.isPanMode;
    event.preventDefault();
  }

  onCanvasMouseDown(event: MouseEvent) {
    // Don't handle if clicking on add step button
    const target = event.target as HTMLElement;
    if (target.closest('.connector-add-btn-floating')) {
      return;
    }

    if (this.isPanMode) {
      this.isPanning = true;
      this.lastPanPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  onMouseDown(event: MouseEvent, stepId: number) {
    // Don't start drag if in pan mode
    if (this.isPanMode) {
      return;
    }

    // Don't start drag if clicking on buttons or interactive elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.closest('.connector-add-btn-floating')) {
      return;
    }

    this.draggedStepId = stepId;
    this.isDragging = true;

    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      const stepElement = (event.currentTarget as HTMLElement);
      const rect = stepElement.getBoundingClientRect();
      const canvas = stepElement.closest('.workflow-canvas') as HTMLElement;
      const canvasRect = canvas?.getBoundingClientRect();

      if (canvasRect) {
        this.dragOffset.x = event.clientX - rect.left;
        this.dragOffset.y = event.clientY - rect.top;
      }
    }

    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    // Handle canvas panning
    if (this.isPanning && this.isPanMode) {
      const deltaX = event.clientX - this.lastPanPosition.x;
      const deltaY = event.clientY - this.lastPanPosition.y;

      this.canvasTranslate.x += deltaX;
      this.canvasTranslate.y += deltaY;

      this.lastPanPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      return;
    }

    // Handle step dragging
    if (!this.isDragging || this.draggedStepId === null) return;

    const step = this.steps.find(s => s.id === this.draggedStepId);
    if (step) {
      const canvas = document.querySelector('.workflow-canvas') as HTMLElement;
      const canvasRect = canvas?.getBoundingClientRect();

      if (canvasRect) {
        // Calculate position relative to canvas
        const x = (event.clientX - canvasRect.left - this.dragOffset.x) / this.zoom;
        const y = (event.clientY - canvasRect.top - this.dragOffset.y) / this.zoom;

        step.x = Math.max(0, x);
        step.y = Math.max(0, y);
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.draggedStepId = null;
    this.isPanning = false;
  }

  // Get canvas transform with pan and zoom
  get canvasTransform(): string {
    return `translate(${this.canvasTranslate.x}px, ${this.canvasTranslate.y}px) scale(${this.zoom})`;
  }

  // Calculate dynamic connectors
  get connectors(): Connector[] {
    const connectors: Connector[] = [];
    const stepWidth = 300;
    const stepHeight = 90;

    for (let i = 0; i < this.steps.length - 1; i++) {
      const fromStep = this.steps[i];
      const toStep = this.steps[i + 1];

      if (fromStep && toStep) {
        const fromX = (fromStep.x || 0) + stepWidth / 2;
        const fromY = (fromStep.y || 0) + stepHeight;
        const toX = (toStep.x || 0) + stepWidth / 2;
        const toY = toStep.y || 0;

        // Calculate control points for curved line
        const midY = (fromY + toY) / 2;

        // Create smooth curve path
        const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

        const connector = {
          fromStepId: fromStep.id,
          toStepId: toStep.id,
          path: path,
          midX: (fromX + toX) / 2,
          midY: (fromY + toY) / 2
        };

        connectors.push(connector);
      }
    }

    return connectors;
  }

  // Get button positions accounting for zoom and pan (for rendering outside transform)
  getButtonPosition(midX: number, midY: number): {x: number, y: number} {
    const viewportPadding = 32;
    const buttonSize = 25; // Base button size
    const scaledButtonHalfSize = (buttonSize * this.zoom) / 2;
    return {
      x: (midX * this.zoom) + this.canvasTranslate.x + viewportPadding - scaledButtonHalfSize,
      y: (midY * this.zoom) + this.canvasTranslate.y + viewportPadding - scaledButtonHalfSize
    };
  }

  // Get transformed button positions (accounting for zoom and pan)
  get transformedConnectorButtons(): Array<{fromStepId: number, screenX: number, screenY: number}> {
    const viewportPadding = 32; // canvas-viewport has 32px padding
    return this.connectors.map(connector => ({
      fromStepId: connector.fromStepId,
      screenX: (connector.midX * this.zoom) + this.canvasTranslate.x + viewportPadding - 12.5,
      screenY: (connector.midY * this.zoom) + this.canvasTranslate.y + viewportPadding - 12.5
    }));
  }

  clearEditor() {
    this.selectedStepId = null;
    this.stepName = '';
    this.nodeType = 'text extraction';
    this.prerequisite = '';
    this.promptEditor = '';
    this.importantNote = '';
    this.currentPydanticObjectClass = '';
    this.codeBlock = '';
    this.currentDatapoints = [];
    this.currentPydanticClasses = [];
    this.datapointSearch = '';
    this.closeEditor();
  }

  // Document functions
  get filteredDocuments(): Document[] {
    const term = this.docSearch.toLowerCase();
    return this.documents.filter(d => d.name.toLowerCase().includes(term));
  }

  get selectedDocuments(): Document[] {
    return this.documents.filter(d => d.selected && d.name.trim());
  }

  toggleDocument(doc: Document) {
    doc.selected = !doc.selected;
  }

  removeDocument(doc: Document) {
    doc.selected = false;
  }

  addDocument() {
    const name = this.newDocInput.trim();
    if (!name) return;

    this.documents.push({ id: Date.now(), name, selected: true });
    this.newDocInput = '';
  }

  // Document dropdown filters
  get filteredPrimaryDocuments() {
    if (!this.primaryDocSearch) return this.documents;
    return this.documents.filter(doc =>
      doc.name.toLowerCase().includes(this.primaryDocSearch.toLowerCase())
    );
  }

  get filteredOtherDocuments() {
    if (!this.otherDocSearch) return this.documents;
    return this.documents.filter(doc =>
      doc.name.toLowerCase().includes(this.otherDocSearch.toLowerCase())
    );
  }

  // Document dropdown methods
  selectPrimaryDocument(docName: string) {
    this.primaryDocument = docName;
    this.showPrimaryDocDropdown = false;
    this.primaryDocSearch = '';
  }

  isOtherDocumentSelected(docName: string): boolean {
    return this.selectedOtherDocuments.includes(docName);
  }

  toggleOtherDocument(docName: string) {
    const index = this.selectedOtherDocuments.indexOf(docName);
    if (index > -1) {
      this.selectedOtherDocuments.splice(index, 1);
    } else {
      this.selectedOtherDocuments.push(docName);
    }
    this.updateOtherDocumentsInput();
  }

  removeOtherDocument(docName: string) {
    const index = this.selectedOtherDocuments.indexOf(docName);
    if (index > -1) {
      this.selectedOtherDocuments.splice(index, 1);
      this.updateOtherDocumentsInput();
    }
  }

  updateOtherDocumentsInput() {
    this.otherDocumentsInput = this.selectedOtherDocuments.join(', ');
  }

  // Workflow Type dropdown methods
  selectWorkflowType(type: string) {
    this.workflowType = type;
    this.showWorkflowTypeDropdown = false;
  }

  // Category dropdown methods
  selectCategory(category: string) {
    this.category = category;
    this.showCategoryDropdown = false;
  }

  // Workflow Settings functions
  saveWorkflowSettings() {
    // Update workflow settings
    console.log('Workflow settings saved:', {
      name: this.workflowName,
      description: this.workflowDescription,
      type: this.workflowType,
      primaryDocument: this.primaryDocument,
      otherDocuments: this.otherDocumentsInput
    });

    // Close the settings panel
    this.isWorkflowSettingsOpen = false;
  }

  // Export functions
  hasExecuteInsightsNode(): boolean {
    return this.steps.some(step => {
      const node = String(step.node || '').toLowerCase();
      return node === 'execute insights' || node === 'insights executor';
    });
  }

  getExportType(): string {
    return this.hasExecuteInsightsNode() ? 'orchestrator' : 'prompt';
  }

  buildExportWorkflow(): any[] {
    return this.steps.map(step => {
      const copy: any = { ...step };

      if (step.node === 'insights executor') {
        const ids = this.coerceDatapointIds(step.datapoints);
        copy.datapoints = ids.map(pid => {
          const dp = this.getDatapointByPid(pid);
          return {
            pid: dp ? dp.pid : pid,
            dataPointName: dp ? dp.name : String(pid)
          };
        });
      } else {
        delete copy.datapoints;
      }

      if (step.node === 'output generator') {
        copy.pydanticClasses = step.pydanticClasses || [];
        copy.pydanticObject = step.pydanticObject || { className: '' };
        copy.codeBlock = step.codeBlock || '';
      } else {
        delete copy.pydanticClasses;
        delete copy.pydanticObject;
        delete copy.codeBlock;
      }

      return copy;
    });
  }

  exportJson() {
    const output = {
      documents: this.selectedDocuments.map(d => d.name),
      workflow: this.buildExportWorkflow()
    };
    this.jsonOutput = JSON.stringify(output, null, 2);
  }

  saveWorkflow() {
    if (!this.workflowId) {
      alert('Error: No workflow ID found. Cannot save workflow.');
      this.showSaveDropdown = false;
      return;
    }

    const payload = {
      workflowName: this.workflowName,
      description: this.workflowDescription,
      category: this.category,
      doc_type: this.primaryDocument,
      other_doc: this.selectedOtherDocuments,
      flowType: this.workflowType,
      workflow: this.buildExportWorkflow()
    };

    this.http.put(`${this.apiUrl}/workflows/${this.workflowId}/save`, payload)
      .subscribe({
        next: (response: any) => {
          alert('Workflow saved successfully!');
          console.log('Save response:', response);
          this.showSaveDropdown = false;
        },
        error: (error) => {
          console.error('Error saving workflow:', error);
          alert(`Error saving workflow: ${error.error?.detail || error.message}`);
          this.showSaveDropdown = false;
        }
      });
  }

  saveAsNewVersion() {
    if (!this.workflowId) {
      alert('Error: No workflow ID found. Cannot save workflow.');
      this.showSaveDropdown = false;
      return;
    }

    const payload = {
      workflowName: this.workflowName,
      description: this.workflowDescription,
      category: this.category,
      doc_type: this.primaryDocument,
      other_doc: this.selectedOtherDocuments,
      flowType: this.workflowType,
      workflow: this.buildExportWorkflow()
    };

    this.http.put(`${this.apiUrl}/workflows/${this.workflowId}/save-version`, payload)
      .subscribe({
        next: (response: any) => {
          alert(`Workflow saved as version ${response.versionNumber} successfully!`);
          console.log('Save version response:', response);
          this.showSaveDropdown = false;
        },
        error: (error) => {
          console.error('Error saving workflow as version:', error);
          alert(`Error saving workflow as version: ${error.error?.detail || error.message}`);
          this.showSaveDropdown = false;
        }
      });
  }

  toggleSaveDropdown() {
    this.showSaveDropdown = !this.showSaveDropdown;
  }

  validateFlow() {
    const errors: string[] = [];

    // Check if there are any steps
    if (this.steps.length === 0) {
      errors.push('Workflow has no steps.');
    }

    // Rule 1: Output generator node should always come as the last step
    const outputGenSteps = this.steps.filter(step => step.node === 'output generator');
    if (outputGenSteps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep.node !== 'output generator') {
        errors.push('Output generator node must be the last step in the workflow.');
      }
      // Check if there are any output generator nodes that are not at the end
      this.steps.forEach((step, index) => {
        if (step.node === 'output generator' && index !== this.steps.length - 1) {
          errors.push(`Step ${index + 1}: Output generator can only be at the last position.`);
        }
      });
    }

    // Validate each step
    this.steps.forEach((step, index) => {
      const stepNum = index + 1;

      // Check required fields
      if (!step.name || step.name.trim() === '') {
        errors.push(`Step ${stepNum}: Name is required.`);
      }

      if (!step.node || step.node.trim() === '') {
        errors.push(`Step ${stepNum}: Node type is required.`);
      }

      if (!step.prompt || step.prompt.trim() === '') {
        errors.push(`Step ${stepNum}: Prompt is required.`);
      }

      // Check if output generator has pydantic classes
      if (step.node === 'output generator') {
        if (!step.pydanticClasses || step.pydanticClasses.length === 0) {
          errors.push(`Step ${stepNum}: Output generator requires at least one Pydantic class.`);
        } else {
          // Validate each pydantic class
          step.pydanticClasses.forEach((pc, pcIndex) => {
            const className = pc.name ? pc.name.trim() : '';
            const classCode = pc.code ? pc.code.trim() : '';

            if (!className) {
              errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Class name is required.`);
            }
            if (!classCode) {
              errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Class code is required.`);
            }

            if (className && classCode) {
              // Rule 4: Class name cannot start with any number or special character (except . and _)
              const firstChar = className.charAt(0);
              if (/[0-9]/.test(firstChar)) {
                errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Class name "${className}" cannot start with a number.`);
              } else if (!/[a-zA-Z._]/.test(firstChar)) {
                errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Class name "${className}" cannot start with special character "${firstChar}". Only letters, dot (.) and underscore (_) are allowed.`);
              }

              // Rule 3: No one can declare 2 classes in class code
              const classMatches = classCode.match(/class\s+\w+/g);
              if (classMatches && classMatches.length > 1) {
                errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Only one class definition is allowed per Pydantic class block. Found ${classMatches.length} class definitions.`);
              }

              // Rule 2: Class name given should match the class defined in code block
              if (classMatches && classMatches.length === 1) {
                const definedClassName = classMatches[0].replace(/class\s+/, '');
                if (definedClassName !== className) {
                  errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: Class name "${className}" does not match the class definition "${definedClassName}" in the code.`);
                }
              } else if (!classMatches || classMatches.length === 0) {
                errors.push(`Step ${stepNum}, Pydantic Class ${pcIndex + 1}: No class definition found in the code for class name "${className}".`);
              }
            }
          });
        }
      }
    });

    // Show results
    if (errors.length === 0) {
      alert('✓ Workflow validation passed! No errors found.');
    } else {
      const errorMessage = 'Workflow validation failed:\n\n' + errors.join('\n');
      alert(errorMessage);
    }
  }

  // Generate from prompt
  async generateFromPrompt() {
    const raw = this.promptInput.trim();
    if (!raw) return;

    this.isGenerating = true;

    try {
      const res = await fetch('http://127.0.0.1:8000/generateFlow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ userPrompt: raw })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'API Error');
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      const workflow = Array.isArray(data)
        ? data
        : (data.workflow || data.steps || []);

      this.steps = [];
      workflow.forEach((s: any, i: number) => {
        const classes = Array.isArray(s.pydanticClasses) ? s.pydanticClasses
          : Array.isArray(s.pydantic_classes) ? s.pydantic_classes : [];
        const pObj = s.pydanticObject || s.pydantic_object || { className: '' };

        this.steps.push({
          id: i + 1,
          name: s.name || s.step_name || `Step ${i + 1}`,
          node: s.node || 'text extraction',
          prerequisite: s.prerequisite || '',
          prompt: s.prompt || '',
          note: s.note || '',
          datapoints: this.coerceDatapointIds(s.datapoints || s.required_datapoints || []),
          pydanticClasses: classes.map((c: any) => ({
            name: c.name || c.className || '',
            code: c.code || c.classCode || ''
          })).filter((c: PydanticClass) => c.name),
          pydanticObject: {
            className: pObj.className || pObj.class || ''
          },
          codeBlock: s.codeBlock || s.code_block || ''
        });
      });

      if (data.type) this.flowType = data.type;

      if (this.steps.length) this.selectStep(this.steps[0].id);
      this.addHistory(raw);

    } catch (err: any) {
      console.error(err);
      alert('Failed to generate flow: ' + err.message);
    } finally {
      this.isGenerating = false;
    }
  }

  addHistory(text: string) {
    this.promptHistory.unshift(text);
    this.promptHistory = this.promptHistory.slice(0, 3);
  }

  loadFromHistory(text: string) {
    this.promptInput = text;
  }

  clearPrompt() {
    this.promptInput = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.datapoint-dropdown-container');
    const saveDropdownWrapper = target.closest('.save-dropdown-wrapper');

    if (!dropdownContainer && this.isDatapointDropdownOpen) {
      this.isDatapointDropdownOpen = false;
    }

    if (!saveDropdownWrapper && this.showSaveDropdown) {
      this.showSaveDropdown = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Modal Editor functions
  openModalEditor(field: string, label: string, classIndex: number = -1) {
    this.modalEditorField = field;
    this.modalEditorLabel = label;
    this.modalEditorClassIndex = classIndex;

    // Set the content based on the field
    if (classIndex >= 0) {
      // For pydantic class fields
      if (field === 'pydanticClassName') {
        this.modalEditorContent = this.currentPydanticClasses[classIndex]?.name || '';
      } else if (field === 'pydanticClassCode') {
        this.modalEditorContent = this.currentPydanticClasses[classIndex]?.code || '';
      }
    } else {
      // For regular fields
      switch (field) {
        case 'stepName':
          this.modalEditorContent = this.stepName;
          break;
        case 'prerequisite':
          this.modalEditorContent = this.prerequisite;
          break;
        case 'promptEditor':
          this.modalEditorContent = this.promptEditor;
          break;
        case 'importantNote':
          this.modalEditorContent = this.importantNote;
          break;
        case 'codeBlock':
          this.modalEditorContent = this.codeBlock;
          break;
        default:
          this.modalEditorContent = '';
      }
    }

    this.isModalEditorOpen = true;
  }

  closeModalEditor() {
    this.isModalEditorOpen = false;
    this.modalEditorContent = '';
    this.modalEditorField = '';
    this.modalEditorLabel = '';
    this.modalEditorClassIndex = -1;
  }

  isCodeField(): boolean {
    return this.modalEditorField === 'pydanticClassCode' || this.modalEditorField === 'codeBlock';
  }

  saveModalEditor() {
    if (this.modalEditorClassIndex >= 0) {
      // For pydantic class fields
      if (this.modalEditorField === 'pydanticClassName') {
        this.currentPydanticClasses[this.modalEditorClassIndex].name = this.modalEditorContent;
      } else if (this.modalEditorField === 'pydanticClassCode') {
        this.currentPydanticClasses[this.modalEditorClassIndex].code = this.modalEditorContent;
      }
    } else {
      // For regular fields
      switch (this.modalEditorField) {
        case 'stepName':
          this.stepName = this.modalEditorContent;
          break;
        case 'prerequisite':
          this.prerequisite = this.modalEditorContent;
          break;
        case 'promptEditor':
          this.promptEditor = this.modalEditorContent;
          break;
        case 'importantNote':
          this.importantNote = this.modalEditorContent;
          break;
        case 'codeBlock':
          this.codeBlock = this.modalEditorContent;
          break;
      }
    }

    this.closeModalEditor();
  }
}
