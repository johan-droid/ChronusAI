import asyncio
import uuid
import sys
import os

# Add backend directory to path so we can import app
sys.path.append(os.getcwd())

from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal as SessionLocal
from app.models.meeting import Meeting
from app.services.cleanup_service import CleanupService

async def verify_cleanup():
    print("🚀 Starting cleanup verification...")
    async with SessionLocal() as db:
        # 1. Create a unique identifier for our test data
        test_audit_str = f"cleanup_test_{uuid.uuid4()}"
        
        # 2. Insert one old meeting (10 days ago) and one new meeting (2 days ago)
        old_time = datetime.now(timezone.utc) - timedelta(days=10)
        new_time = datetime.now(timezone.utc) - timedelta(days=2)
        
        # Need a real user_id or a valid UUID that exists if FK is enforced
        # For simplicity, we'll try to find a user or create one if needed, 
        # but let's assume we can insert with a random UUID for this test if FK is not strictly enforced in this env
        # Actually, let's just use a valid UUID.
        user_id = uuid.uuid4() 
        
        print(f"Creating test meetings with start_times: {old_time} and {new_time}")
        
        old_meeting = Meeting(
            id=uuid.uuid4(),
            user_id=user_id,
            title="Old Meeting (Delete Me)",
            start_time=old_time,
            end_time=old_time + timedelta(hours=1),
            provider="google",
            status="scheduled",
            raw_user_input=test_audit_str
        )
        
        new_meeting = Meeting(
            id=uuid.uuid4(),
            user_id=user_id,
            title="Recent Meeting (Keep Me)",
            start_time=new_time,
            end_time=new_time + timedelta(hours=1),
            provider="google",
            status="scheduled",
            raw_user_input=test_audit_str
        )
        
        db.add_all([old_meeting, new_meeting])
        try:
            await db.commit()
        except Exception as e:
            print(f"❌ Failed to insert test data: {e}")
            return

        print(f"✅ Inserted test meetings for temporary user {user_id}")

        # 3. Run cleanup
        print("🧹 Running cleanup service...")
        await CleanupService.cleanup_old_meetings()

        # 4. Verify results
        result = await db.execute(select(Meeting).where(Meeting.raw_user_input == test_audit_str))
        remaining_meetings = result.scalars().all()
        
        print(f"📊 Remaining meetings: {len(remaining_meetings)}")
        for m in remaining_meetings:
            print(f" - {m.title} (Started: {m.start_time})")
            
        success = len(remaining_meetings) == 1 and remaining_meetings[0].title == "Recent Meeting (Keep Me)"
        
        # Cleanup verification data
        await db.execute(delete(Meeting).where(Meeting.raw_user_input == test_audit_str))
        await db.commit()
        
        if success:
            print("\n✨ VERIFICATION SUCCESSFUL: Old records purged, recent records safe.")
        else:
            print("\n❌ VERIFICATION FAILED: Cleanup logic did not behave as expected.")

if __name__ == "__main__":
    asyncio.run(verify_cleanup())
