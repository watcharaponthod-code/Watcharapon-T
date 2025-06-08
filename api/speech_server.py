"""
Speech server to bridge between React Native and the Python audio capabilities.
This simple Flask server exposes endpoints to speak text using the av.py functionality.

To run:
pip install flask flask-cors
python speech_server.py
"""

import os
import sys
import subprocess
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # Allow cross-domain requests

# Path to the av.py script
AV_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                            'screens', 'av.py')

current_process = None

def run_speech_process(text):
    """Run the speech process using the av.py script"""
    global current_process
    
    # Create a temporary file with the text to speak
    temp_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_speech.txt')
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(text)
    
    try:
        # Run the av.py script in text-to-speech mode
        cmd = [sys.executable, AV_SCRIPT_PATH, '--mode', 'none', '--speak', temp_file]
        current_process = subprocess.Popen(cmd)
        
        # Wait for the process to complete
        current_process.wait()
        current_process = None
    except Exception as e:
        print(f"Error running speech process: {e}")
    finally:
        # Clean up the temp file
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass

@app.route('/speak', methods=['POST'])
def speak():
    """Endpoint to speak a text"""
    global current_process
    
    if not request.json or 'text' not in request.json:
        return jsonify({'error': 'No text provided'}), 400
    
    text = request.json['text']
    
    # Stop any existing speech process
    if current_process:
        try:
            current_process.terminate()
            time.sleep(0.5)  # Give it some time to terminate
        except:
            pass
    
    # Start a new speech process in a separate thread
    thread = threading.Thread(target=run_speech_process, args=(text,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'speaking'})

@app.route('/stop_speaking', methods=['POST'])
def stop_speaking():
    """Endpoint to stop speaking"""
    global current_process
    
    if current_process:
        try:
            current_process.terminate()
            current_process = None
        except:
            pass
    
    return jsonify({'status': 'stopped'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
