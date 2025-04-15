from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status, Depends, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Annotated, Optional
from datetime import datetime, timedelta
import pytz
import shutil
import os

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY, DateTime

from sqlalchemy.orm import Session,declarative_base

from passlib.context import CryptContext

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL_db = 'postgresql://postgres:password@localhost:5432/Auction' 

engine = create_engine(URL_db)
sessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)
Base=declarative_base()

class Items(Base):
    __tablename__ = 'Items'
    id = Column(Integer,primary_key=True,index=True)
    name = Column(String, index=True)
    description = Column(String, index=True)
    image_url = Column(String, index=True)
    starting_bid = Column(Integer, index=True)
    closing_bid = Column(Integer, index=True)
    end_date = Column(DateTime)
    user_id = Column(Integer,index=True)
    winning_user = Column(Integer,index=True)

class Users(Base):
    __tablename__ = 'Users'
    id = Column(Integer,primary_key=True,index=True)
    email = Column(String, index=True)
    password = Column(String, index=True)
    username = Column(String, index=True)

class UserInfo(BaseModel):
    email:str
    password:str
    username:str

class Login(BaseModel):
    email:str
    password:str


Base.metadata.create_all(bind=engine)

def get_db():
    db=sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency=Annotated[Session,Depends(get_db)]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.post("/register",status_code=status.HTTP_201_CREATED)
async def register(user:UserInfo,db:db_dependency):
    db_user = db.query(Users).filter(Users.email==user.email).first()
    if db_user:
        raise HTTPException(status_code=302,detail="Account already exists with this email !")
    db_user = db.query(Users).filter(func.lower(Users.username)==user.username.lower()).first()
    if db_user:
        raise HTTPException(status_code=302,detail="Username already exits")
    db_user_password = pwd_context.hash(user.password)
    db_user = Users(email=user.email,password=db_user_password,username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message":"New User created"}

@app.post("/login",status_code=status.HTTP_200_OK)
async def login(user:Login,db:db_dependency):
    db_user = db.query(Users).filter(Users.email==user.email).first()
    if db_user:
        if pwd_context.verify(user.password,db_user.password):
            return {"message":"Login Success", "user_id":db_user.id}
        else:
            raise HTTPException(status_code=404,detail="Invalid email or password!")
    raise HTTPException(status_code=404,detail="Invalid email or password!")

all_otp = {}

@app.post("/code",status_code=status.HTTP_200_OK)
async def code(email:str,db:db_dependency):
    db_user = db.query(Users).filter(Users.email==email).first()
    if not db_user:
        raise HTTPException(status_code=404,detail="Email doesnt exist")
    code = f"{random.randint(0, 999999):06}"
    all_otp[email] = {"code":code,"expires":datetime.now()+timedelta(minutes=5)}
    service = Service(executable_path="chromedriver.exe")
    driver = webdriver.Chrome(service=service)
    driver.get("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&emr=1&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=AXH0vVt86mt7i6bhv8EZvXuyaR7kWN4K4-u8q61I6qnUga4y-0zTJljpaLm3qOEfkFS8TLm4BwzwFQ&osid=1&passive=1209600&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S68860218%3A1742620308666354")
    WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID,"identifierId")))
    input_email = driver.find_element(By.ID,"identifierId")
    input_email.send_keys("your@mail.id"+Keys.ENTER)
    WebDriverWait(driver,30).until(EC.presence_of_element_located((By.NAME,"Passwd")))
    input_password = driver.find_element(By.NAME,"Passwd")
    input_password.send_keys("password"+Keys.ENTER)
    WebDriverWait(driver,10).until(EC.presence_of_element_located((By.XPATH, "//div[text()='Compose']")))
    compose_button = driver.find_element(By.XPATH, "//div[text()='Compose']")
    compose_button.click()
    WebDriverWait(driver,10).until(EC.element_to_be_clickable((By.CLASS_NAME,"agP")))
    input_to = driver.find_element(By.CLASS_NAME,"agP")
    input_to.send_keys(email)
    input_subject = driver.find_element(By.NAME,"subjectbox")
    input_subject.send_keys("Code for Password Reset")
    input_text = driver.find_element(By.XPATH, "//div[@aria-label='Message Body']")
    input_text.send_keys(code+Keys.CONTROL+Keys.ENTER)
    time.sleep(2)
    driver.quit()
    return {"message":"Code sent"}

@app.post("/verify",status_code=status.HTTP_200_OK)
async def verify(email:str,code:str):
    current_otp = all_otp.get(email)
    if not current_otp:
        raise HTTPException(status_code=404,detail="couldnt get code")
    if datetime.now()>current_otp["expires"]:
        del all_otp[email]
        raise HTTPException(status_code=404,detail="The time has expired")
    if current_otp["code"]==code:
        del all_otp[email]
        return {"message":"Success"}
    raise HTTPException(status_code=400, detail="Invalid code")

@app.post("/new-password",status_code=status.HTTP_200_OK)
async def new_password(user:Login,db:db_dependency):
    db_user = db.query(Users).filter(Users.email==user.email).first()
    db_user_password = pwd_context.hash(user.password)
    db_user.password=db_user_password
    db.commit()
    db.refresh(db_user)
    return {"message":"Password reset successfully"}

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/new-listing-item",status_code=status.HTTP_201_CREATED)
async def new_listing_item(user_id:int,db:db_dependency,image: UploadFile = File(...),name:str = Form(...),description:str = Form(...),starting_bid:float = Form(...),end_date:str=Form(...) ):
    file_location = f"uploads/{image.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    try:
        local_naive = datetime.strptime(end_date, "%Y-%m-%dT%H:%M")
        local_tz = pytz.timezone("Asia/Dubai")
        local_dt = local_tz.localize(local_naive)
        utc_dt = local_dt.astimezone(pytz.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    db_item = Items(name=name,description=description,starting_bid=starting_bid,closing_bid=starting_bid,image_url=file_location,end_date=utc_dt,user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"message":"New Item Listing Created","filename": image.filename, "url": file_location}

@app.get("/all-listings",status_code=status.HTTP_200_OK)
async def all_listings(db:db_dependency,user_id:Optional [int] = Query(None)):
    if not user_id:
        current_time = datetime.now(pytz.utc)
        items = db.query(Items).filter( Items.end_date > current_time).order_by(Items.id.desc()).all()
    else:
        items = db.query(Items).filter(Items.user_id==user_id).order_by(Items.id.desc()).all()
    return [{"name":item.name,"description":item.description,"starting_bid":item.starting_bid,"image_url":item.image_url,"end_date":item.end_date,"closing_bid":item.closing_bid,"item_id":item.id,"user_id":item.user_id} for item in items]

@app.get("/item",status_code=status.HTTP_200_OK)
async def get_item(item_id:int,db:db_dependency):
    item = db.query(Items).filter(Items.id==item_id).first()
    return {"name":item.name,"description":item.description,"starting_bid":item.starting_bid,"image_url":item.image_url,"end_date":item.end_date,"closing_bid":item.closing_bid,"item_id":item.id}

@app.post("/bid",status_code=status.HTTP_200_OK)
async def bid(amount:int,item_id:int,user_id:int,db:db_dependency):
    db_item = db.query(Items).filter(Items.id==item_id).first()
    db_item.closing_bid += amount
    db_item.winning_user = user_id
    db.commit()
    db.refresh(db_item)
    await manager.broadcast(item_id, str(db_item.closing_bid))
    return{"message":"bid accepted"}

@app.post("/delete",status_code=status.HTTP_200_OK)
async def delete(item_id:int,db:db_dependency):
    db_item = db.query(Items).filter(Items.id==item_id).first()
    db.delete(db_item)
    db.commit()
    return {"message":"Item Deleted"}

@app.post("/edit",status_code=status.HTTP_200_OK)
async def edit(item_id:int,db:db_dependency,image:Optional [UploadFile] = File(None),name:str = Form(...),description:str = Form(...),starting_bid:float = Form(...),end_date:str=Form(...) ):
    db_item = db.query(Items).filter(Items.id==item_id).first()
    if image:
        file_location = db_item.image_url
        base_path = os.path.dirname(__file__)
        full_path = os.path.join(base_path, db_item.image_url)
        if os.path.exists(full_path):
            os.remove(full_path)
        file_location = f"uploads/{image.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        db_item.image_url = file_location
    try:
        local_naive = datetime.strptime(end_date, "%Y-%m-%dT%H:%M")
        local_tz = pytz.timezone("Asia/Dubai")
        local_dt = local_tz.localize(local_naive)
        utc_dt = local_dt.astimezone(pytz.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    db_item.name = name
    db_item.description = description
    db_item.starting_bid = starting_bid 
    db_item.end_date = utc_dt
    db.commit()
    db.refresh(db_item)
    return {"message":"item updated"}

class ConnectionManager():
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = {}
    
    async def connect(self,websocket:WebSocket,item_id:int):
        await websocket.accept()
        if item_id not in self.connections:
            self.connections[item_id] = []
        self.connections[item_id].append(websocket) 
    
    def disconnect(self,websocket:WebSocket,item_id:int):
        if item_id in self.connections:
            self.connections[item_id].remove(websocket)
            if not self.connections[item_id]:
                del self.connections[item_id]
    
    async def broadcast(self,item_id:int,price:str):
        if item_id in self.connections:
            for connection in self.connections[item_id]:
                await connection.send_text(price)

manager = ConnectionManager()

@app.websocket("/ws/{item_id}")
async def websocket_broadcast(websocket:WebSocket,item_id:int):
    await manager.connect(websocket,item_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket,item_id)