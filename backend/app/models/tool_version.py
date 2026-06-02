from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database.base import Base


class ToolVersion(Base):
    __tablename__ = "tool_versions"

    id = Column(Integer, primary_key=True, index=True)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    version = Column(String(128), nullable=False)
    changelog = Column(Text, nullable=True)
    source_link = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tool = relationship("Tool", backref="versions")
