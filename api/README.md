# TTS Server - Connecting React Native to Gemini Voice API

This server provides an API endpoint that allows the React Native app to use Gemini's realistic text-to-speech capabilities.

## Setup

1. Install the required dependencies:

```bash
pip install fastapi uvicorn google-generativeai python-multipart
```

2. Start the server:

```bash
cd c:\Users\ASUS\Desktop\project\mainProject\api
python tts_server.py
```

The server will start on port 8000.

## API Endpoints

### POST /speak

Converts text to speech using Gemini's voice API.

**Request Body:**

```json
{
  "text": "Text to be spoken",
  "voiceName": "Puck",  // Optional, default is "Puck"
  "apiKey": "YOUR_API_KEY"  // Optional
}
```

**Response:**

The endpoint returns the audio file in WAV format.

### POST /stop_speaking

Stops any currently running speech process.

**Response:**

```json
{
  "status": "stopped"
}
```

## Usage in the App

The React Native app connects to this server to get natural-sounding voice output for AI messages.
