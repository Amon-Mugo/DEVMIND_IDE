from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import base64
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API = "https://api.github.com"

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
}


class CreateRepoRequest(BaseModel):
    name: str
    description: str = ""


class PushFileRequest(BaseModel):
    owner: str
    repo: str
    filename: str
    content: str
    message: str = "DevMind export"


@app.get("/github/user")
async def get_github_user():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{GITHUB_API}/user", headers=HEADERS)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="GitHub API error")
        return response.json()


@app.post("/github/create-repo")
async def create_repo(body: CreateRepoRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GITHUB_API}/user/repos",
            headers=HEADERS,
            json={
                "name": body.name,
                "description": body.description,
                "private": False,
                "auto_init": True,
            },
        )
        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=response.status_code, detail=response.json())
        return response.json()


@app.post("/github/push-file")
async def push_file(body: PushFileRequest):
    async with httpx.AsyncClient() as client:
        sha = None
        check = await client.get(
            f"{GITHUB_API}/repos/{body.owner}/{body.repo}/contents/{body.filename}",
            headers=HEADERS,
        )
        if check.status_code == 200:
            sha = check.json().get("sha")

        encoded = base64.b64encode(body.content.encode("utf-8")).decode("utf-8")

        payload = {
            "message": body.message,
            "content": encoded,
        }
        if sha:
            payload["sha"] = sha

        response = await client.put(
            f"{GITHUB_API}/repos/{body.owner}/{body.repo}/contents/{body.filename}",
            headers=HEADERS,
            json=payload,
        )
        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=response.status_code, detail=response.json())
        return response.json()