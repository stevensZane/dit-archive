from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    academic_year_id: int
    program_id: int
    level: str

class UserCreateAdmin(UserCreate):
    role: str = "admin"

class ChatRequest(BaseModel):
    query: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: list[Message] = []