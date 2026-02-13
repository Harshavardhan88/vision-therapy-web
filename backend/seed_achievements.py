from database import SessionLocal
from models import Achievement

def seed_achievements():
    """Seed initial achievements into the database"""
    db = SessionLocal()
    
    # Check if achievements already exist
    existing = db.query(Achievement).first()
    if existing:
        print("Achievements already seeded")
        db.close()
        return
    
    achievements = [
        {
            "name": "First Pop",
            "description": "Pop your first balloon",
            "icon": "🎈",
            "requirement_type": "balloons_popped",
            "requirement_value": 1
        },
        {
            "name": "Sharpshooter",
            "description": "Pop 50 balloons in a single session",
            "icon": "🎯",
            "requirement_type": "session_score",
            "requirement_value": 50
        },
        {
            "name": "Century Club",
            "description": "Pop 100 balloons total",
            "icon": "💯",
            "requirement_type": "total_balloons",
            "requirement_value": 100
        },
        {
            "name": "Dedicated",
            "description": "Complete 5 therapy sessions",
            "icon": "⭐",
            "requirement_type": "sessions_completed",
            "requirement_value": 5
        },
        {
            "name": "Week Warrior",
            "description": "Complete sessions 7 days in a row",
            "icon": "🔥",
            "requirement_type": "streak_days",
            "requirement_value": 7
        },
        {
            "name": "Speed Demon",
            "description": "Complete a session on Hard difficulty",
            "icon": "⚡",
            "requirement_type": "hard_mode_complete",
            "requirement_value": 1
        },
        {
            "name": "Marathon",
            "description": "Play for 30 minutes total",
            "icon": "⏱️",
            "requirement_type": "total_minutes",
            "requirement_value": 30
        },
        {
            "name": "Perfectionist",
            "description": "Score 100+ in a single session",
            "icon": "👑",
            "requirement_type": "session_score",
            "requirement_value": 100
        }
    ]
    
    for ach_data in achievements:
        achievement = Achievement(**ach_data)
        db.add(achievement)
    
    db.commit()
    db.close()
    print(f"Seeded {len(achievements)} achievements")

if __name__ == "__main__":
    seed_achievements()
