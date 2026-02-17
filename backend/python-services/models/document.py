from pydantic import BaseModel
from typing import Optional

class DocumentConfig(BaseModel):
    """Model for gpt_doc_config table"""
    doctype: str
    doc_category: Optional[str] = None
    doc_provider: Optional[str] = None
    is_multiborrower: Optional[bool] = None
    borrower_field_name: Optional[str] = None
    ssn_field_name: Optional[str] = None
    dynamic_borrower_tag: Optional[bool] = None

    class Config:
        from_attributes = True
