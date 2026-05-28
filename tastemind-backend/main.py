from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import jwt
from typing import List

# Define the database connection
SQLALCHEMY_DATABASE_URL = "sqlite:///tastemind.db"

# Create the database engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the base class for our models
Base = declarative_base()

# Define the User model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password = Column(String)
    is_active = Column(Boolean, default=True)

# Define the MenuItem model
class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    price = Column(Float)
    category = Column(String)
    image_url = Column(String)

# Define the TableReservation model
class TableReservation(Base):
    __tablename__ = "table_reservations"
    id = Column(Integer, primary_key=True)
    date = Column(DateTime)
    time = Column(String)
    guests = Column(Integer)
    status = Column(Enum("pending", "confirmed", "cancelled"))

# Create the database tables
Base.metadata.create_all(bind=engine)

# Define the FastAPI application
app = FastAPI()

# Define the OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Define the JWT secret key
JWT_SECRET_KEY = "tastemind_secret_key"

# Define the User Pydantic model
class UserPydantic(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

# Define the MenuItem Pydantic model
class MenuItemPydantic(BaseModel):
    id: int
    name: str
    price: float
    category: str
    image_url: str

# Define the TableReservation Pydantic model
class TableReservationPydantic(BaseModel):
    id: int
    date: str
    time: str
    guests: int
    status: str

# Define the UserCreate Pydantic model
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# Define the MenuItemCreate Pydantic model
class MenuItemCreate(BaseModel):
    name: str
    price: float
    category: str
    image_url: str

# Define the TableReservationCreate Pydantic model
class TableReservationCreate(BaseModel):
    date: str
    time: str
    guests: int

# Define the login function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Seed the database with menu items
def seed_menu_items(db):
    menu_items = [
        MenuItemCreate(name="Burger", price=10.99, category="Main Course", image_url="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400"),
        MenuItemCreate(name="Pizza", price=14.99, category="Main Course", image_url="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400"),
        MenuItemCreate(name="Salad", price=8.99, category="Salad", image_url="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400"),
        MenuItemCreate(name="Sandwich", price=9.99, category="Main Course", image_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"),
        MenuItemCreate(name="Fries", price=4.99, category="Side Dish", image_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"),
        MenuItemCreate(name="Dessert", price=6.99, category="Dessert", image_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"),
    ]
    for menu_item in menu_items:
        db.add(MenuItem(name=menu_item.name, price=menu_item.price, category=menu_item.category, image_url=menu_item.image_url))
    db.commit()

# Seed the database with menu items
db = SessionLocal()
seed_menu_items(db)

# Define the login endpoint
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.password == form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = jwt.encode(
        {"sub": user.username, "exp": datetime.utcnow() + access_token_expires},
        JWT_SECRET_KEY,
        algorithm="HS256",
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Define the register endpoint
@app.post("/register")
async def register(user_create: UserCreate):
    db = SessionLocal()
    user = db.query(User).filter(User.username == user_create.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    db.add(User(username=user_create.username, email=user_create.email, password=user_create.password))
    db.commit()
    return {"message": "User created successfully"}

# Define the get menu items endpoint
@app.get("/menu-items")
async def get_menu_items(db: SessionLocal = Depends(get_db)):
    menu_items = db.query(MenuItem).all()
    return [MenuItemPydantic(id=menu_item.id, name=menu_item.name, price=menu_item.price, category=menu_item.category, image_url=menu_item.image_url) for menu_item in menu_items]

# Define the create table reservation endpoint
@app.post("/table-reservations")
async def create_table_reservation(table_reservation_create: TableReservationCreate, db: SessionLocal = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    db.add(TableReservation(date=table_reservation_create.date, time=table_reservation_create.time, guests=table_reservation_create.guests, status="pending"))
    db.commit()
    return {"message": "Table reservation created successfully"}

# Define the get table reservations endpoint
@app.get("/table-reservations")
async def get_table_reservations(db: SessionLocal = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    table_reservations = db.query(TableReservation).all()
    return [TableReservationPydantic(id=table_reservation.id, date=table_reservation.date, time=table_reservation.time, guests=table_reservation.guests, status=table_reservation.status) for table_reservation in table_reservations]

# Enable CORS for localhost
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:3000", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)