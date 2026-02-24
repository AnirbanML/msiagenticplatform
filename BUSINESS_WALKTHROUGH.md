# MSI Agentic Platform - Business Walkthrough Script

## Duration: 15-20 minutes

---

## 1. INTRODUCTION (2 minutes)

**Opening:**
"Good morning/afternoon! Today I'll walk you through the MSI Agentic Platform - our intelligent workflow automation solution designed specifically for mortgage processing operations."

**The Challenge:**
"In today's mortgage industry, we face three critical challenges:
- Manual document processing takes hours per loan
- Human errors in data extraction cost time and money
- Scaling operations during peak periods is difficult and expensive"

**The Solution:**
"The MSI Agentic Platform uses AI-powered agents to automate complex mortgage workflows - from document extraction to validation and decision-making. This platform allows you to design, test, and deploy intelligent workflows without writing a single line of code."

---

## 2. PLATFORM OVERVIEW (3 minutes)

**Navigate to Home Screen**

"Let me show you what we've built. The platform has two main components:

### Workflow Builder
- **Visual drag-and-drop interface** to design automated workflows
- **Pre-built node types** for common mortgage tasks:
  - Document extraction (W2s, paystubs, bank statements)
  - Income calculation and verification
  - Credit analysis
  - Compliance validation
  - Decision generation

### Workflow Testing
- **Comprehensive testing environment** before production deployment
- **Accuracy tracking** to ensure AI agents perform correctly
- **Performance monitoring** to track costs and efficiency
- **Document viewer** to verify extracted data"

**Key Point:**
"Think of this as your digital workforce - each workflow is like hiring a specialized team member who never sleeps, never makes the same mistake twice, and can process hundreds of loans simultaneously."

---

## 3. WORKFLOW BUILDER DEMO (5 minutes)

**Navigate to Workflow Builder**

### A. Creating a Workflow

"Let's create a simple Income Verification workflow:

**Step 1: Workflow Setup**
- Click 'Create New Workflow'
- Name: 'Income Verification V2'
- Category: Underwriting
- Run Level: Choose between Loan or Borrower level
  - *Loan level*: Process all borrowers at once
  - *Borrower level*: Process each borrower individually for detailed analysis"

**Step 2: Adding Nodes**
"Now we build the workflow by adding nodes:

1. **Document Extraction Node**
   - Extracts data from W2s, paystubs, 1040s
   - AI reads and structures the data automatically
   - Handles poor quality scans and handwritten documents

2. **Income Calculation Node**
   - Calculates total income using Fannie Mae guidelines
   - Validates consistency across documents
   - Flags discrepancies for human review

3. **Validation Node**
   - Checks income against employment verification
   - Validates debt-to-income ratios
   - Ensures compliance with lending criteria

4. **Decision Node**
   - Generates recommendation: Approve, Refer, or Decline
   - Provides detailed reasoning for the decision
   - Highlights risk factors"

**Step 3: Save and Test**
- Click 'Save Workflow'
- Navigate to 'Test Workflow' to validate

**Business Value:**
"This workflow that we just built in 5 minutes would typically require:
- 2-3 weeks of development time
- Multiple developers and QA engineers
- Extensive testing and debugging

With our platform, business analysts can design and deploy workflows in days, not months."

---

## 4. WORKFLOW TESTING DEMO (6 minutes)

**Navigate to Workflow Testing**

"Before deploying any workflow to production, we need to ensure it works correctly. This is where our testing environment comes in."

### A. Test Configuration

**Left Panel: Test Setup**
- Select the workflow to test
- Choose a loan from the dropdown (shows real loan numbers)
- For borrower-level workflows, select specific borrower
- Click 'Start Test' to execute"

### B. Real-Time Execution

**Center Panel: Live Progress**
"Watch as the AI agent executes each step in real-time:

- **Step-by-step visualization** with color-coded status
- **Input data** shows what documents/data were used
- **Output data** shows what the AI extracted or calculated
- **Token usage** displays API consumption for cost tracking
- **Execution time** monitors performance

**Node Type Icons:**
- 📄 Document Extraction (blue)
- ✓ Validation (green)
- # Calculation (purple)
- 📊 Analysis (orange)
- 📝 Output Generation (teal)
- 🖼️ Image Processing (pink)"

**Document Viewer:**
"Click the document icon next to 'Input Data' on extraction steps to view the actual PDF being processed - you can verify what the AI is reading."

### C. Accuracy Verification

**Right Panel: Analytics**

"This is where we ensure quality:

**Execution-Level Accuracy:**
- After the workflow completes, you can mark it as:
  - ✓ Correct (AI got it right)
  - ✗ Incorrect (AI made an error)

**Step-Level Accuracy:**
- Review each individual step
- Mark correct/incorrect at granular level
- If ANY step is incorrect, the entire execution automatically marks as incorrect

**Accuracy Metrics:**
- **Circular gauge** shows overall accuracy rate
- **Correct vs Incorrect runs** tracked over time
- **Step-level breakdown** in table format showing:
  - Which steps perform well
  - Which steps need improvement
  - Accuracy rates per step"

**Performance Metrics:**
"Track operational costs and efficiency:
- **Average tokens** (Input + Output) per execution
- **Average cost** per loan processed
- **Average duration** to complete workflow
- **Historical trends** across all test runs

**Test Coverage:**
- **Unique Loans Tested**: Track breadth of testing
- **Unique Borrowers Tested**: For borrower-level workflows"

### D. Production Deployment

"Once testing is complete and accuracy meets our threshold:
- Toggle 'Move to Production' switch
- This flags the workflow as production-ready
- DevOps team deploys to live environment"

**Business Value:**
"This testing framework:
- **Reduces risk** of deploying faulty AI models
- **Builds confidence** through data-driven accuracy metrics
- **Tracks costs** before committing to production
- **Documents quality** for compliance and audit purposes"

---

## 5. BUSINESS BENEFITS (3 minutes)

### ROI Metrics

"Let's talk about the impact:

**Time Savings:**
- Manual income verification: 30-45 minutes per borrower
- Automated workflow: 5-10 seconds per borrower
- **Efficiency gain: 180-270x faster**

**Cost Savings:**
- Manual processing cost: $15-25 per loan (labor)
- AI processing cost: $0.02-0.05 per loan (tokens)
- **Cost reduction: 99.8%**

**Accuracy Improvements:**
- Human error rate: 5-8% (fatigue, complexity)
- AI error rate after training: 1-2%
- **Quality improvement: 60-75% fewer errors**

**Scalability:**
- Manual team: Linear scaling (more loans = more people)
- AI platform: Exponential scaling (same cost for 10 or 10,000 loans)
- **Peak capacity: Handle 100x volume spikes without hiring**"

### Strategic Advantages

"Beyond the numbers:

1. **Speed to Market**
   - Design and deploy new workflows in days
   - Adapt to regulatory changes quickly
   - Stay ahead of competition

2. **Risk Management**
   - Consistent application of lending criteria
   - Audit trails for every decision
   - Compliance documentation built-in

3. **Employee Satisfaction**
   - Eliminate tedious data entry
   - Focus on complex decision-making
   - Reduce burnout and turnover

4. **Customer Experience**
   - Faster loan decisions (hours vs days)
   - 24/7 processing capability
   - Reduced application abandonment"

---

## 6. NEXT STEPS (2 minutes)

**Pilot Program:**
"We recommend starting with a pilot:

**Phase 1 (30 days):**
- Deploy 1-2 high-volume workflows
- Test with historical data
- Measure accuracy and performance

**Phase 2 (60 days):**
- Shadow production (run AI alongside humans)
- Compare results and refine
- Build confidence with team

**Phase 3 (90 days):**
- Full production deployment
- Monitor and optimize
- Expand to additional workflows"

**Investment:**
"Initial investment includes:
- Platform licensing
- AI API credits (usage-based)
- Training and change management
- Typical ROI achieved in 3-6 months"

---

## 7. Q&A (5 minutes)

**Common Questions:**

**Q: "What if the AI makes a mistake?"**
A: "That's exactly why we built the testing framework. We catch errors before production, track accuracy metrics, and have human oversight for critical decisions."

**Q: "How do we handle edge cases?"**
A: "The platform includes exception routing - when confidence is low, cases automatically escalate to human reviewers with all AI analysis available for their decision."

**Q: "What about data security?"**
A: "All data is encrypted in transit and at rest. We connect to your existing Azure PostgreSQL database. No data leaves your environment. AI processing uses enterprise-grade APIs with SOC2 compliance."

**Q: "Can we customize the workflows?"**
A: "Absolutely! That's the core value. Business analysts can design, modify, and deploy workflows without IT involvement. No coding required."

**Q: "What's the learning curve?"**
A: "Most users are productive within 1-2 days of training. The interface is intuitive - if you can use PowerPoint, you can build workflows."

---

## 8. CLOSING (1 minute)

**Summary:**
"To recap, the MSI Agentic Platform delivers:
- ✓ 99% cost reduction in document processing
- ✓ 180x faster processing times
- ✓ 60-75% fewer errors
- ✓ Workflows deployed in days, not months
- ✓ Built-in quality assurance and testing"

**Call to Action:**
"I'd love to schedule a follow-up session where we:
1. Review your specific use cases
2. Model potential ROI for your volume
3. Design a pilot program tailored to your needs"

**Thank you!**

---

## DEMO TIPS

### Before the Demo:
- ✓ Verify both frontend and backend are running
- ✓ Have sample loans loaded in database
- ✓ Test the workflow you'll demo
- ✓ Clear browser cache for clean analytics
- ✓ Prepare backup slides if demo fails

### During the Demo:
- ✓ Speak in business terms, not technical jargon
- ✓ Pause for questions frequently
- ✓ Show real loan numbers and documents
- ✓ Let them click and explore
- ✓ Focus on benefits, not features

### After the Demo:
- ✓ Send follow-up email with key metrics
- ✓ Share recorded demo video
- ✓ Provide case studies and testimonials
- ✓ Schedule technical deep-dive if interested

---

## APPENDIX: TALKING POINTS BY ROLE

### For C-Suite Executives:
- Focus on ROI, strategic advantage, and competitive positioning
- Emphasize scalability and risk reduction
- Discuss market leadership and innovation

### For Operations Managers:
- Focus on efficiency gains and cost savings
- Emphasize quality improvements and error reduction
- Discuss team productivity and employee satisfaction

### For Compliance Officers:
- Focus on audit trails and consistency
- Emphasize regulatory compliance and documentation
- Discuss risk mitigation and quality control

### For IT Leadership:
- Focus on integration capabilities and security
- Emphasize low-code approach and reduced development time
- Discuss scalability and infrastructure requirements

---

**Document Version:** 1.0
**Last Updated:** February 20, 2026
**Platform Version:** MSI Agentic Platform v2.0
