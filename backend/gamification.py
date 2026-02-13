from sqlalchemy.orm import Session
from . import models, crud
from datetime import datetime

# Define Achievements hardcoded for MVP
# In a larger app, this would be in the DB
ACHIEVEMENT_RULES = [
    {
        "slug": "first_steps",
        "name": "First Steps",
        "description": "Complete your first therapy session.",
        "icon": "🌱",
        "type": "count",
        "target": 1
    },
    {
        "slug": "balloon_popper",
        "name": "Balloon Popper",
        "description": "Pop 100 balloons total.",
        "icon": "🎈",
        "type": "balloons",
        "target": 100
    },
    {
        "slug": "sharpshooter",
        "name": "Sharp Shooter",
        "description": "Achieve > 90% accuracy in a session.",
        "icon": "🎯",
        "type": "accuracy",
        "target": 0.90
    },
    {
        "slug": "week_warrior",
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak.",
        "icon": "🔥",
        "type": "streak",
        "target": 7
    }
]

def seed_achievements(db: Session):
    for rule in ACHIEVEMENT_RULES:
        exists = db.query(models.Achievement).filter(models.Achievement.name == rule["name"]).first()
        if not exists:
            new_ach = models.Achievement(
                name=rule["name"],
                description=rule["description"],
                icon=rule["icon"],
                requirement_type=rule["type"],
                requirement_value=rule["target"] # using target as value
            )
            db.add(new_ach)
    db.commit()

def check_for_new_achievements(db: Session, user_id: int, current_session: models.TherapySession):
    """
    Evaluates user stats against achievement rules and awards new ones.
    Returns a list of newly unlocked achievement names.
    """
    # Get current stats
    stats = crud.get_patient_stats(db, user_id)
    
    # Get existing user achievements
    existing_ids = [ua.achievement_id for ua in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()]
    existing_slugs = [] # We'll just check IDs against DB content
    
    new_unlocks = []
    
    all_achievements = db.query(models.Achievement).all()
    
    for ach in all_achievements:
        if ach.id in existing_ids:
            continue
            
        unlocked = False
        
        if ach.requirement_type == "count" and stats["total_sessions"] >= ach.requirement_value:
            unlocked = True
        elif ach.requirement_type == "balloons" and stats["balloons_popped"] >= ach.requirement_value:
            unlocked = True
        elif ach.requirement_type == "streak" and stats["streak_days"] >= ach.requirement_value:
            unlocked = True
        elif ach.requirement_type == "accuracy" and current_session.accuracy >= ach.requirement_value: # Check strictly against current session for "high score" types
             unlocked = True
             
        if unlocked:
            user_ach = models.UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(user_ach)
            new_unlocks.append(ach.name)
            
    db.commit()
    return new_unlocks
