from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, crud, database, gamification
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe_failover_key_change_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="token", 
    auto_error=False
)

# Create Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="AmblyoCare Clinical API",
    description="Backend for Vision Therapy Platform",
    version="1.0.0"
)

# CORS Middleware (Allow Frontend Access)
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "*"  # Allow all origins - restrict to Vercel domain after deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Frame-Options"] = "DENY"
    return response

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


async def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    user = crud.get_user_by_email(db, email=email)
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


@app.get("/")
def read_root():
    return {"status": "online", "system": "AmblyoCare Clinical Engine"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api"}

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_optional)
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(db=db, user=user)
    
    # Auto-provision profile based on role
    if user.role == "patient" or user.role == "patient": # Handle string/enum potential mismatch
        # Check if created by a doctor (override request body)
        doctor_id = None
        if user.doctor_id:
             # Explicit assignment (e.g. signup)
             doctor_id = user.doctor_id
        elif current_user and current_user.role == "doctor" and current_user.doctor_profile:
             # Implicit assignment (doctor creating patient)
             doctor_id = current_user.doctor_profile.id

        # Create empty profile
        crud.create_patient_profile(
            db=db, 
            profile=schemas.PatientProfileCreate(
                diagnosis="Pending Diagnosis",
                affected_eye="Both"
            ),
            user_id=new_user.id,
            doctor_id=doctor_id
        )

    elif user.role == "doctor":
        # Create empty doctor profile
        db_doc = models.DoctorProfile(
            user_id=new_user.id,
            clinic_name="Unassigned Clinic",
            license_number="PENDING"
        )
        db.add(db_doc)
        db.commit()

    elif user.role == "parent" and user.child_name:
        # Create Child User (Derived credentials for now)
        child_email = f"child_{new_user.email}" # Simple collision handling
        child_user_data = schemas.UserCreate(
            full_name=user.child_name,
            email=child_email,
            password=user.password, # Same password for simplicity
            role=models.UserRole.PATIENT
        )
        
        existing_child = crud.get_user_by_email(db, email=child_email)
        if not existing_child:
            child_user = crud.create_user(db=db, user=child_user_data)
            
            # Create Patient Profile for Child linked to Parent
            crud.create_patient_profile(
                db=db,
                profile=schemas.PatientProfileCreate(
                    diagnosis="Pending Diagnosis",
                    affected_eye="Both"
                ),
                user_id=child_user.id,
                parent_id=new_user.id
            )

    elif user.role == "parent" and user.child_email:
        # Link EXISTING child
        existing_child = crud.get_user_by_email(db, email=user.child_email)
        if existing_child and existing_child.role == "patient":
             # Find their profile
             patient_profile = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == existing_child.id).first()
             if patient_profile:
                 patient_profile.parent_id = new_user.id
                 db.commit()

    return new_user

@app.get("/users/", response_model=list[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/api/doctor/patients", response_model=list[schemas.UserResponse])
def read_doctor_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their patients")
    
    if not current_user.doctor_profile:
         return []
         
    return crud.get_patients_by_doctor(db, doctor_id=current_user.doctor_profile.id)

@app.get("/api/parent/children", response_model=list[schemas.UserResponse])
def get_parent_children(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view their children")
    
    # Assuming parents are linked via user.id since we didn't make a ParentProfile
    return crud.get_children_for_parent(db, parent_id=current_user.id)

@app.get("/api/public/doctors", response_model=list[schemas.UserResponse])
def get_public_doctors(db: Session = Depends(get_db)):
    """
    Public endpoint to list all doctors for selection during signup.
    """
    return crud.get_all_doctors(db)

@app.post("/api/sessions", response_model=schemas.SessionResponse)
def create_session(
    session: schemas.SessionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Require Auth
):
    # Enforce: The session belongs to the logged-in user
    # If admin/doctor, maybe allow acting on behalf, but for now strict:
    if current_user.role == "patient" and session.user_id != current_user.id:
        # Override or Reject? Rejection is safer for detecting bugs.
        raise HTTPException(status_code=403, detail="Cannot log session for another user")
        
    # Security: Force the user_id to match the token for patients
    session.user_id = current_user.id

    # 1. Create Session
    new_session = crud.create_therapy_session(db=db, session=session)
    
    # 2. Check Gamification
    # Ensure achievements exist in DB
    gamification.seed_achievements(db) 
    
    # Check for unlocks
    unlocked = gamification.check_for_new_achievements(db, session.user_id, new_session)
    
    if unlocked:
        print(f"User {session.user_id} unlocked: {unlocked}")
        # In a real app, we might return this in the response or send a WS notification
        
    return new_session



@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/leaderboard")
def read_leaderboard(db: Session = Depends(get_db)):
    """
    Returns top 10 players by total score (sum of all sessions).
    """
    # SQL: SELECT user_id, SUM(score) as total_score FROM sessions GROUP BY user_id ORDER BY total_score DESC LIMIT 10
    # Then join with User to get names.
    from sqlalchemy import func
    
    results = db.query(
        models.PatientProfile.user_id,
        models.User.full_name,
        func.sum(models.TherapySession.score).label("total_score")
    ).join(models.TherapySession, models.PatientProfile.id == models.TherapySession.patient_id)\
     .join(models.User, models.PatientProfile.user_id == models.User.id)\
     .group_by(models.PatientProfile.user_id)\
     .order_by(func.sum(models.TherapySession.score).desc())\
     .limit(10)\
     .all()
     
    return [
        {"rank": i+1, "player": r.full_name, "score": r.total_score}
        for i, r in enumerate(results)
    ]

@app.get("/api/stats/{user_id}")
def read_patient_stats(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Authorization: Only Self or Doctor
    if current_user.id != user_id and current_user.role != "doctor":
         raise HTTPException(status_code=403, detail="Not authorized to view this data")

    stats = crud.get_patient_stats(db, user_id)
    return stats



@app.get("/api/sessions/{user_id}", response_model=list[schemas.SessionResponse])
def get_sessions(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Authorization: Self, Doctor, or Parent
    if current_user.id != user_id and current_user.role != "doctor" and current_user.role != "parent":
         raise HTTPException(status_code=403, detail="Not authorized to view session history")

    sessions = crud.get_user_sessions(db=db, user_id=user_id)
    # Map back to response schema
    result = []
    for s in sessions:
        # s is TherapySession model
        result.append({
            "id": s.id,
            "user_id": user_id, 
            "game_type": s.game_type,
            "difficulty": s.difficulty,
            "duration_seconds": s.duration_seconds,
            "score": s.score,
            "balloons_popped": s.balloons_popped,
            "start_time": s.start_time,
            "created_at": s.start_time
        })
    return result

    return result

@app.post("/api/schedule/{patient_id}")
def schedule_session(
    patient_id: int, 
    date: datetime, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Authorization: Only Doctor
    if current_user.role != "doctor":
         raise HTTPException(status_code=403, detail="Only doctors can schedule sessions")

    # Create a wrapper session marked as scheduled
    # In real app, we might have a separate 'Schedule' table, but using TherapySession with future date works for MVP
    # We check if profile exists first
    patient = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    db_session = models.TherapySession(
        patient_id=patient.id,
        scheduled_date=date,
        game_type="space", # Default assignment
        difficulty="medium",
        duration_seconds=0,
        score=0
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return {"status": "success", "scheduled_date": date}

@app.post("/api/doctor/notes", response_model=schemas.DoctorNoteResponse)
def create_doctor_note(
    note: schemas.DoctorNoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create notes")
        
    if not current_user.doctor_profile:
        raise HTTPException(status_code=400, detail="Doctor profile not active")
        
    return crud.create_doctor_note(db=db, note=note, doctor_id=current_user.doctor_profile.id)

@app.get("/api/doctor/notes/{patient_id}", response_model=list[schemas.DoctorNoteResponse])
def get_doctor_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Auth: Doctor (any? or specific?) or Patient (self) or Parent
    # For now, let's say related users. 
    # Simplest: Doctor can see validation content.
    if current_user.role == "doctor":
         pass # Allow
    elif current_user.id == patient_id:
         pass # Allow patient to read their own notes? Maybe only suggestions.
    # Check parent
    elif current_user.role == "parent":
         # Check if this patient is their child
         children = crud.get_children_for_parent(db, current_user.id)
         child_ids = [c.id for c in children]
         if patient_id not in child_ids:
             raise HTTPException(status_code=403, detail="Not authorized")
    else:
         raise HTTPException(status_code=403, detail="Not authorized")

    return crud.get_doctor_notes(db, patient_id)

@app.post("/api/patients/link")
def link_doctor(
    doctor_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=400, detail="Only patients can link to doctors")
        
    # Find doctor by unique code (using license_number as proxy for now, or add a code column)
    # Using license_number as the "Invite Code" for this MVP
    doctor_profile = db.query(models.DoctorProfile).filter(models.DoctorProfile.license_number == doctor_code).first()
    
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Invalid doctor code")
        
    # Link
    patient_profile = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == current_user.id).first()
    if not patient_profile:
        # Create if missing
        patient_profile = crud.create_patient_profile(db, schemas.PatientProfileCreate(diagnosis="Unknown", affected_eye="Both"), current_user.id)
        
    patient_profile.doctor_id = doctor_profile.id
    db.commit()
    
    return {"status": "success", "doctor_name": doctor_profile.user.full_name, "clinic": doctor_profile.clinic_name}

# --- Ghost Mode / Real-Time Monitoring ---
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Map: patient_id -> list[WebSocket] (Doctors)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, patient_id: str):
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)

    def disconnect(self, websocket: WebSocket, patient_id: str):
        if patient_id in self.active_connections:
            self.active_connections[patient_id].remove(websocket)
            if not self.active_connections[patient_id]:
                del self.active_connections[patient_id]

    async def broadcast(self, message: str, patient_id: str):
        if patient_id in self.active_connections:
            for connection in self.active_connections[patient_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/patient/{patient_id}")
async def websocket_patient_endpoint(websocket: WebSocket, patient_id: str):
    # Patient connects here to STREAM data
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast every message from patient to listener doctors
            await manager.broadcast(data, patient_id)
    except WebSocketDisconnect:
        # Patient disconnected, maybe notify doctors?
        pass

@app.websocket("/ws/doctor/{patient_id}")
async def websocket_doctor_endpoint(websocket: WebSocket, patient_id: str):
    # Doctor connects here to RECEIVE data
    await manager.connect(websocket, patient_id)
    try:
        while True:
            # Keep connection open
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket, patient_id)

