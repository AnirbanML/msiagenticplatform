from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from config.database import get_db
from models.document import DocumentConfig
from models.workflow import WorkflowDetail
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["workflow"])

def compose_prompt(workflow_data: List[dict]) -> str:
    """
    Compose a formatted prompt from workflow steps.

    Args:
        workflow_data: List of workflow step dictionaries

    Returns:
        Formatted prompt string combining all workflow steps
    """
    output_blocks = []

    for item in workflow_data:
        step_id = item.get("id", "")
        node = item.get("node", "")
        prerequisite = (item.get("prerequisite") or "").strip()
        prompt = (item.get("prompt") or "").strip()
        note = (item.get("note") or "").strip()

        block_lines = [
            f"## STEP {step_id}: Invoke node `{node}`"
        ]

        if prerequisite:
            block_lines.append(f"**PREREQUISITES TO EXECUTE THIS STEP**\n{prerequisite}\n**INSTRUCTIONS OF THE STEP:**")

        if prompt:
            block_lines.append(prompt)

        if note:
            block_lines.append(f"**IMPORTANT NOTE**\n{note}")

        output_blocks.append("\n".join(block_lines))

    return "\n\n".join(output_blocks)

class WorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_type: str
    steps: List[dict] = []

class CreateWorkflowRequest(BaseModel):
    workflowName: str
    description: Optional[str] = None
    category: str  # Required field: income, liability, asset, credit
    doc_type: str
    other_doc: Optional[List[str]] = None
    flowType: str
    version: Optional[int] = 1

class GetWorkflowDetailsRequest(BaseModel):
    id: int

class DatapointItem(BaseModel):
    id: int
    datapointName: str

class WorkflowDetailsResponse(BaseModel):
    workflowDetails: dict
    datapointList: List[DatapointItem]

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workflow_type: str
    status: str

@router.get("/documents", response_model=List[str])
async def get_documents():
    """
    Get all document types from gpt_doc_config table
    Returns list of unique document types
    """
    logger.info("GET /documents - Fetching document types from database")
    try:
        pool = await get_db()
        query = "SELECT DISTINCT doctype FROM common.gpt_doc_config ORDER BY doctype"
        logger.debug(f"Executing query: {query}")

        rows = await pool.fetch(query)
        logger.info(f"Query executed successfully. Retrieved {len(rows)} document types")

        documents = [row["doctype"] for row in rows]
        logger.info(f"Returning {len(documents)} documents: {documents[:5]}{'...' if len(documents) > 5 else ''}")

        return documents
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/workflows", response_model=List[WorkflowDetail])
async def get_all_workflows():
    """
    Get all workflow details from mortgage_workflow table
    Returns workflow details with id, workflowName, description, category, doc_type, other_doc, version, flowType
    """
    logger.info("GET /workflows - Fetching all workflows from database")
    try:
        pool = await get_db()
        query = """
            SELECT
                id,
                "workflowName",
                description,
                category,
                doc_type,
                other_doc,
                version,
                "flowType",
                data_point,
                runtype
            FROM common.mortgage_workflow
            ORDER BY id
        """
        logger.debug(f"Executing query: {query}")

        rows = await pool.fetch(query)
        logger.info(f"Query executed successfully. Retrieved {len(rows)} workflows")

        workflows = []
        for row in rows:
            row_dict = dict(row)
            # Handle other_doc - can be array (list) or string for backward compatibility
            if row_dict.get('other_doc'):
                if isinstance(row_dict['other_doc'], str):
                    # Old format: comma-separated string
                    other_docs_str = row_dict['other_doc']
                    row_dict['other_doc'] = [doc.strip() for doc in other_docs_str.split(',') if doc.strip()]
                    logger.debug(f"Converted other_doc from string '{other_docs_str}' to list {row_dict['other_doc']}")
                # else: already a list from database array type
            else:
                row_dict['other_doc'] = None

            # Use data_point as workflowName if workflowName is not present
            if not row_dict.get('workflowName') and row_dict.get('data_point'):
                row_dict['workflowName'] = row_dict['data_point']
                logger.debug(f"Using data_point '{row_dict['data_point']}' as workflowName")

            workflows.append(WorkflowDetail(**row_dict))

        logger.info(f"Returning {len(workflows)} workflows")

        if workflows:
            logger.debug(f"Sample workflow: {workflows[0].workflowName if workflows[0].workflowName else 'N/A'}")

        return workflows
    except Exception as e:
        logger.error(f"Error fetching workflows: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowRequest):
    """
    Create a new workflow
    """
    logger.info(f"POST /workflows - Creating new workflow: {workflow.name}")
    logger.debug(f"Workflow details: type={workflow.workflow_type}, steps={len(workflow.steps)}")

    # Implement workflow creation logic here
    response = WorkflowResponse(
        id="workflow_123",
        name=workflow.name,
        description=workflow.description,
        workflow_type=workflow.workflow_type,
        status="created"
    )

    logger.info(f"Workflow created successfully with ID: {response.id}")
    return response

@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """
    Get workflow by ID
    """
    logger.info(f"GET /workflows/{workflow_id} - Fetching workflow by ID")

    # Implement workflow retrieval logic here
    response = WorkflowResponse(
        id=workflow_id,
        name="Sample Workflow",
        description="Sample workflow description",
        workflow_type="extraction",
        status="active"
    )

    logger.info(f"Workflow retrieved successfully: {response.name}")
    return response

@router.put("/workflows/{workflow_id}", response_model=WorkflowDetail)
async def update_workflow(workflow_id: int, workflow: CreateWorkflowRequest):
    """
    Update an existing workflow by ID
    """
    logger.info(f"PUT /workflows/{workflow_id} - Updating workflow")
    logger.debug(f"Update details: name={workflow.workflowName}, type={workflow.flowType}, category={workflow.category}")

    try:
        pool = await get_db()

        # Check if workflow exists
        check_query = "SELECT id FROM common.mortgage_workflow WHERE id = $1"
        existing = await pool.fetchrow(check_query, workflow_id)

        if not existing:
            logger.warning(f"Workflow with ID {workflow_id} not found")
            raise HTTPException(status_code=404, detail=f"Workflow with ID {workflow_id} not found")

        # Update the workflow
        update_query = """
            UPDATE common.mortgage_workflow
            SET
                "workflowName" = $1,
                description = $2,
                category = $3,
                doc_type = $4,
                other_doc = $5,
                version = $6,
                "flowType" = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING id, "workflowName", description, category, doc_type, other_doc, version, "flowType"
        """

        logger.debug(f"Executing update query for workflow ID {workflow_id}")

        row = await pool.fetchrow(
            update_query,
            workflow.workflowName,
            workflow.description,
            workflow.category,
            workflow.doc_type,
            workflow.other_doc,
            workflow.version,
            workflow.flowType,
            workflow_id
        )

        logger.info(f"Workflow {workflow_id} updated successfully")

        # Convert the result to response format
        row_dict = dict(row)
        response = WorkflowDetail(**row_dict)
        logger.info(f"Returning updated workflow: {response.workflowName}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: int):
    """
    Delete workflow by ID
    """
    logger.info(f"DELETE /workflows/{workflow_id} - Deleting workflow by ID")

    try:
        pool = await get_db()

        # Check if workflow exists
        check_query = "SELECT id FROM common.mortgage_workflow WHERE id = $1"
        existing = await pool.fetchrow(check_query, workflow_id)

        if not existing:
            logger.warning(f"Workflow with ID {workflow_id} not found")
            raise HTTPException(status_code=404, detail=f"Workflow with ID {workflow_id} not found")

        # Delete the workflow
        delete_query = "DELETE FROM common.mortgage_workflow WHERE id = $1"
        await pool.execute(delete_query, workflow_id)

        logger.info(f"Workflow {workflow_id} deleted successfully")
        return {"message": "Workflow deleted successfully", "id": workflow_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/getworkflowdetails", response_model=WorkflowDetailsResponse)
async def get_workflow_details(request: GetWorkflowDetailsRequest):
    """
    Get workflow details by ID and return all datapoints
    """
    logger.info(f"POST /getworkflowdetails - Fetching workflow details for ID: {request.id}")

    try:
        pool = await get_db()

        # Get workflow details
        workflow_query = """
            SELECT
                id, category, doc_type, prompt, is_informational, data_point, is_contextual,
                output_structure, other_doc, output_category, note, is_image_analysis,
                updated_at, isconsistent, iterations, model_name, "workflowName", description,
                workflow, "flowType", version, "connectedPrompts", "parentOrchestrator", runtype
            FROM common.mortgage_workflow
            WHERE id = $1
        """

        workflow_row = await pool.fetchrow(workflow_query, request.id)

        if not workflow_row:
            logger.warning(f"Workflow with ID {request.id} not found")
            raise HTTPException(status_code=404, detail=f"Workflow with ID {request.id} not found")

        workflow_dict = dict(workflow_row)

        # Convert updated_at to string if present
        if workflow_dict.get('updated_at'):
            workflow_dict['updated_at'] = workflow_dict['updated_at'].isoformat()

        # Handle JSONB workflow field - asyncpg returns it as list/dict already
        # No need to parse, FastAPI will serialize it properly
        if workflow_dict.get('workflow') is not None:
            logger.info(f"Workflow field type: {type(workflow_dict['workflow'])}, "
                       f"contains {len(workflow_dict['workflow']) if isinstance(workflow_dict['workflow'], list) else 'N/A'} steps")

        logger.info(f"Workflow details retrieved for: {workflow_dict.get('workflowName')}")

        # Get all datapoints (where data_point is not null)
        datapoint_query = """
            SELECT DISTINCT id, data_point as "datapointName"
            FROM common.mortgage_workflow
            WHERE data_point IS NOT NULL
            ORDER BY data_point
        """

        datapoint_rows = await pool.fetch(datapoint_query)
        datapoint_list = [{"id": row["id"], "datapointName": row["datapointName"]} for row in datapoint_rows]

        logger.info(f"Retrieved {len(datapoint_list)} datapoints")

        return WorkflowDetailsResponse(
            workflowDetails=workflow_dict,
            datapointList=datapoint_list
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/createworkflow", response_model=WorkflowDetail)
async def create_new_workflow(workflow: CreateWorkflowRequest):
    """
    Create a new workflow in the mortgage_workflow table
    """
    logger.info(f"POST /createworkflow - Creating new workflow: {workflow.workflowName}")
    logger.debug(f"Workflow details: type={workflow.flowType}, doc_type={workflow.doc_type}, category={workflow.category}")

    try:
        pool = await get_db()

        # Insert the new workflow into the database
        query = """
            INSERT INTO common.mortgage_workflow
            (
                "workflowName",
                category,
                doc_type,
                other_doc,
                version,
                "flowType",
                updated_at
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
            )
            RETURNING id, "workflowName", description, category, doc_type, other_doc, version, "flowType"
        """

        logger.debug(f"Executing insert query with values: name={workflow.workflowName}, type={workflow.flowType}, other_doc={workflow.other_doc}")

        row = await pool.fetchrow(
            query,
            workflow.workflowName,
            workflow.category,
            workflow.doc_type,
            workflow.other_doc,
            workflow.version,
            workflow.flowType
        )

        logger.info(f"Workflow created successfully with ID: {row['id']}")

        # Convert the result to response format
        row_dict = dict(row)
        response = WorkflowDetail(**row_dict)
        logger.info(f"Returning created workflow: {response.workflowName}")

        return response

    except Exception as e:
        logger.error(f"Error creating workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class SaveWorkflowRequest(BaseModel):
    workflowName: str
    description: Optional[str] = None
    category: str
    doc_type: str
    other_doc: Optional[List[str]] = None
    flowType: str
    runtype: Optional[str] = 'loan'
    workflow: List[dict]
    data_point: Optional[str] = None

@router.put("/workflows/{workflow_id}/save")
async def save_workflow_normal(workflow_id: int, request: SaveWorkflowRequest):
    """
    Save workflow - overwrites existing workflow steps and settings
    """
    logger.info(f"PUT /workflows/{workflow_id}/save - Normal save for workflow")
    logger.debug(f"Save details: name={request.workflowName}, steps count={len(request.workflow)}")

    try:
        pool = await get_db()

        # Check if workflow exists
        check_query = "SELECT id FROM common.mortgage_workflow WHERE id = $1"
        existing = await pool.fetchrow(check_query, workflow_id)

        if not existing:
            logger.warning(f"Workflow with ID {workflow_id} not found")
            raise HTTPException(status_code=404, detail=f"Workflow with ID {workflow_id} not found")

        # Compose prompt from workflow steps
        composed_prompt = compose_prompt(request.workflow)
        logger.debug(f"Composed prompt length: {len(composed_prompt)} characters")

        # Update the workflow with new steps and settings
        update_query = """
            UPDATE common.mortgage_workflow
            SET
                "workflowName" = $1,
                description = $2,
                category = $3,
                doc_type = $4,
                other_doc = $5,
                "flowType" = $6,
                runtype = $7,
                workflow = $8,
                prompt = $9,
                data_point = $10,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING id, "workflowName", description, category, doc_type, other_doc, version, "flowType", runtype
        """

        logger.debug(f"Executing normal save update for workflow ID {workflow_id}")

        # Convert workflow list to JSON string for JSONB column
        workflow_json = json.dumps(request.workflow)

        row = await pool.fetchrow(
            update_query,
            request.workflowName,
            request.description,
            request.category,
            request.doc_type,
            request.other_doc,
            request.flowType,
            request.runtype,
            workflow_json,
            composed_prompt,
            request.data_point,
            workflow_id
        )

        logger.info(f"Workflow {workflow_id} saved successfully")

        return {
            "success": True,
            "message": "Workflow saved successfully",
            "workflowId": workflow_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/workflows/{workflow_id}/save-version")
async def save_workflow_as_version(workflow_id: int, request: SaveWorkflowRequest):
    """
    Save workflow as new version - appends current workflow to historicalworkflow JSONB column
    """
    logger.info(f"PUT /workflows/{workflow_id}/save-version - Save as new version")
    logger.debug(f"Save details: name={request.workflowName}, steps count={len(request.workflow)}")

    try:
        pool = await get_db()

        # Check if workflow exists and get current historicalworkflow
        check_query = """
            SELECT id, historicalworkflow, workflow, version
            FROM common.mortgage_workflow
            WHERE id = $1
        """
        existing = await pool.fetchrow(check_query, workflow_id)

        if not existing:
            logger.warning(f"Workflow with ID {workflow_id} not found")
            raise HTTPException(status_code=404, detail=f"Workflow with ID {workflow_id} not found")

        # Get existing historical workflow or create empty dict
        historical = existing['historicalworkflow'] if existing['historicalworkflow'] else {}
        current_workflow = existing['workflow']
        current_version = existing['version'] if existing['version'] else 1

        # Calculate next version number for database version column
        new_version = current_version + 1

        # Calculate next historical version number (for JSON structure)
        if isinstance(historical, dict) and historical:
            # Get the highest version number in historical
            version_numbers = [int(k) for k in historical.keys() if k.isdigit()]
            next_historical_version = max(version_numbers) + 1 if version_numbers else current_version
        else:
            next_historical_version = current_version

        # If there's a current workflow, save it to historical with current version
        if current_workflow:
            historical[str(next_historical_version)] = current_workflow
            logger.info(f"Saving current workflow as historical version {next_historical_version}")
            logger.info(f"New version will be: {new_version}")

        # Compose prompt from workflow steps
        composed_prompt = compose_prompt(request.workflow)
        logger.debug(f"Composed prompt length: {len(composed_prompt)} characters")

        # Update the workflow with new steps, settings, and historical data
        update_query = """
            UPDATE common.mortgage_workflow
            SET
                "workflowName" = $1,
                description = $2,
                category = $3,
                doc_type = $4,
                other_doc = $5,
                "flowType" = $6,
                runtype = $7,
                workflow = $8,
                historicalworkflow = $9,
                version = $10,
                prompt = $11,
                data_point = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING id, "workflowName", version
        """

        logger.debug(f"Executing save as version update for workflow ID {workflow_id}")

        # Convert workflow list and historical dict to JSON strings for JSONB columns
        workflow_json = json.dumps(request.workflow)
        historical_json = json.dumps(historical)

        row = await pool.fetchrow(
            update_query,
            request.workflowName,
            request.description,
            request.category,
            request.doc_type,
            request.other_doc,
            request.flowType,
            request.runtype,
            workflow_json,
            historical_json,
            new_version,
            composed_prompt,
            request.data_point,
            workflow_id
        )

        logger.info(f"Workflow {workflow_id} saved as version {new_version} successfully")

        return {
            "success": True,
            "message": f"Workflow saved as version {new_version}",
            "workflowId": workflow_id,
            "versionNumber": new_version
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving workflow as version: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class PrepareTestDataRequest(BaseModel):
    workflowId: int
    workflowName: str
    description: Optional[str] = None
    category: str
    doc_type: str
    other_doc: Optional[List[str]] = None
    flowType: str
    runtype: str
    workflow: List[dict]
    data_point: Optional[str] = None

@router.post("/workflows/prepare-test")
async def prepare_test_data(request: PrepareTestDataRequest):
    """
    Prepare test data for workflow testing by:
    1. Compiling the complete workflow payload
    2. Querying sub_document_indexing table for loans/borrowers based on doc types and runtype
    """
    try:
        pool = await get_db()

        # Build list of document types to search for
        doc_types = [request.doc_type]
        if request.other_doc:
            doc_types.extend(request.other_doc)

        logger.info(f"Preparing test data for workflow {request.workflowId}")
        logger.info(f"Document types: {doc_types}")
        logger.info(f"Run type: {request.runtype}")

        # Query based on runtype
        if request.runtype == 'loan':
            # Get unique loan numbers for the specified document types
            query = """
                SELECT DISTINCT loan_number
                FROM common.sub_document_indexing
                WHERE doc_type = ANY($1)
                AND loan_number IS NOT NULL
                AND loan_number != ''
                ORDER BY loan_number
                LIMIT 100
            """

            rows = await pool.fetch(query, doc_types)
            loan_details = [
                {
                    'loanNumber': row['loan_number'],
                    'borrowerIDs': []
                }
                for row in rows
            ]

            logger.info(f"Found {len(loan_details)} unique loan numbers")

            return {
                "testWorkflow": {
                    "workflowName": request.workflowName,
                    "description": request.description,
                    "category": request.category,
                    "doc_type": request.doc_type,
                    "other_doc": request.other_doc,
                    "flowType": request.flowType,
                    "runtype": request.runtype,
                    "workflow": request.workflow,
                    "data_point": request.data_point
                },
                "loanDetails": loan_details
            }

        else:  # borrower level
            # Get loan numbers with their borrowers for the specified document types
            query = """
                SELECT DISTINCT loan_number, borrower_id
                FROM common.sub_document_indexing
                WHERE doc_type = ANY($1)
                AND loan_number IS NOT NULL
                AND loan_number != ''
                AND borrower_id IS NOT NULL
                AND borrower_id != ''
                ORDER BY loan_number, borrower_id
                LIMIT 200
            """

            rows = await pool.fetch(query, doc_types)

            # Group borrowers by loan number
            loans_dict = {}
            for row in rows:
                loan_num = row['loan_number']
                borrower = row['borrower_id']

                if loan_num not in loans_dict:
                    loans_dict[loan_num] = {
                        'loanNumber': loan_num,
                        'borrowerIDs': []
                    }

                if borrower not in [b['id'] for b in loans_dict[loan_num]['borrowerIDs']]:
                    # First borrower is primary, rest are not
                    is_primary = len(loans_dict[loan_num]['borrowerIDs']) == 0
                    loans_dict[loan_num]['borrowerIDs'].append({
                        'id': borrower,
                        'isPrimary': is_primary
                    })

            loan_details = list(loans_dict.values())

            logger.info(f"Found {len(loan_details)} unique loan numbers with borrowers")

            return {
                "testWorkflow": {
                    "workflowName": request.workflowName,
                    "description": request.description,
                    "category": request.category,
                    "doc_type": request.doc_type,
                    "other_doc": request.other_doc,
                    "flowType": request.flowType,
                    "runtype": request.runtype,
                    "workflow": request.workflow,
                    "data_point": request.data_point
                },
                "loanDetails": loan_details
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing test data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error preparing test data: {str(e)}")
