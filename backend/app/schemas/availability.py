from pydantic import BaseModel, Field
from typing import List


class TimeSlotResponse(BaseModel):
    start_time: str = Field(..., description="ISO format datetime")
    end_time: str = Field(..., description="ISO format datetime")
    is_available: bool
    timezone: str


class AvailabilityRequest(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    timezone: str | None = Field(None, description="Timezone (e.g., America/New_York)")


class AvailabilityResponse(BaseModel):
    date: str
    timezone: str
    slots: List[TimeSlotResponse]
    available_count: int
    busy_count: int
