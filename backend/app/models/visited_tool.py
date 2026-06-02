from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database.base import Base


class VisitedTool(Base):
    __tablename__ = "visited_tools"
    __table_args__ = (UniqueConstraint("user_id", "tool_id", name="uq_user_tool_visit"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    visited_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="visited_tools")
    tool = relationship("Tool", backref="visitors")
