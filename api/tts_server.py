"""
TTS Server - Bridge between the React Native app and Gemini's voice capabilities

This server creates a simple API endpoint that accepts text to be spoken,
passes it to the av.py script, and returns the audio data.

Usage:
    python tts_server.py

Endpoints:
    POST /speak - Accepts JSON with text to speak, returns audio data
"""

import os
import sys
import asyncio
import subprocess
import tempfile
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
import io

# Path to the av.py script
AV_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                            'screens', 'av.py')

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextToSpeak(BaseModel):
    text: str
    voiceName: str = "Puck"
    apiKey: str = None

current_process = None
current_audio_file = None

@app.post("/speak")
async def speak_text(text_data: TextToSpeak, background_tasks: BackgroundTasks):
    global current_process, current_audio_file
    
    try:
        # Stop any currently running TTS process
        if current_process:
            try:
                current_process.terminate()
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Error stopping previous process: {e}")
        
        # Create a temporary file for the text
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as text_file:
            text_file.write(text_data.text)
            text_path = text_file.name
        
        # Create a temporary file for the output audio
        audio_fd, audio_path = tempfile.mkstemp(suffix='.wav')
        os.close(audio_fd)
        
        # Update the current audio file path
        if current_audio_file and os.path.exists(current_audio_file):
            try:
                os.remove(current_audio_file)
            except:
                pass
        current_audio_file = audio_path
        
        # Run the av.py script with the text and output path
        cmd = [
            sys.executable, 
            AV_SCRIPT_PATH, 
            "--mode", "none", 
            "--speak", text_path,
            "--output", audio_path
        ]
        
        if text_data.apiKey:
            cmd.extend(["--api-key", text_data.apiKey])
        
        if text_data.voiceName:
            cmd.extend(["--voice", text_data.voiceName])
        
        print(f"Running command: {' '.join(cmd)}")
        
        # Run the process
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        current_process = process
        stdout, stderr = await process.communicate()
        
        # Check if the process was successful
        if process.returncode != 0:
            print(f"Error running av.py: {stderr.decode()}")
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        # Clean up the text file
        background_tasks.add_task(os.remove, text_path)
        
        # Return the audio file
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=500, detail="Audio file was not generated")
            
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav"},
            background=background_tasks.add_task(os.remove, audio_path)
        )
        
    except Exception as e:
        print(f"Error in /speak endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop_speaking")
async def stop_speaking():
    global current_process
    
    if current_process:
        try:
            current_process.terminate()
            current_process = None
            return {"status": "stopped"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "no active process"}

if __name__ == "__main__":
    uvicorn.run("tts_server:app", host="0.0.0.0", port=8000, reload=True)
