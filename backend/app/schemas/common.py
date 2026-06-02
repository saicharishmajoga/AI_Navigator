from pydantic import BaseModel


class ResponseModel(BaseModel):
    success: bool = True
    message: str | None = None

    model_config = {"populate_by_name": True}
