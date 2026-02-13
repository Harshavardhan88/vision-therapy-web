import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app, get_db
from backend.database import Base
from backend.models import User, UserRole

# Use a separate test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    # Dependency override
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    del app.dependency_overrides[get_db]

@pytest.fixture
def patient_token(client):
    email = "test_patient@example.com"
    # Create user
    res1 = client.post("/users/", json={"full_name": "Test Patient", "email": email, "password": "password", "role": "patient"})
    
    res2 = client.post("/token", data={"username": email, "password": "password"})
    if res2.status_code != 200:
        pytest.fail(f"Patient login failed: {res2.text}")
    return res2.json()["access_token"]

@pytest.fixture
def doctor_token(client):
    email = "test_doctor@example.com"
    client.post("/users/", json={"full_name": "Test Doctor", "email": email, "password": "password", "role": "doctor"})
    response = client.post("/token", data={"username": email, "password": "password"})
    return response.json()["access_token"]

@pytest.fixture
def parent_token(client):
    email = "test_parent@example.com"
    client.post("/users/", json={"full_name": "Test Parent", "email": email, "password": "password", "role": "parent"})
    response = client.post("/token", data={"username": email, "password": "password"})
    return response.json()["access_token"]
