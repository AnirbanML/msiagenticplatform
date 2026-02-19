from pydantic import BaseModel
from typing import Optional, List

class WorkflowDetail(BaseModel):
    """Model for mortgage_workflow table"""
    id: int
    workflowName: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    doc_type: Optional[str] = None
    other_doc: Optional[List[str]] = None
    version: Optional[int] = None
    flowType: Optional[str] = None
    data_point: Optional[str] = None
    runtype: Optional[str] = None

    class Config:
        from_attributes = True
