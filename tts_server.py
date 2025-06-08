"""
Simple TTS Server

This server creates an API endpoint for text-to-speech using the av.py script.
It doesn't require babel-plugin-module-resolver or other complex dependencies.

Usage:
    python tts_server.py
"""

import os
import sys
import json
import subprocess
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Path to the av.py script
AV_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                            'screens', 'av.py')

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        
        # Create a temporary file to store the text
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(text)
            text_path = temp_file.name
        
        # Run the av.py script
        cmd = [sys.executable, AV_SCRIPT_PATH, "--mode", "none", "--speak", text_path]
        
        # Start the process
        subprocess.Popen(cmd)
        
        # Clean up the temp file after a delay
        def cleanup_file():
            import time
            time.sleep(2)  # Wait for the file to be read
            try:
                os.remove(text_path)
            except:
                pass
                
        import threading
        threading.Thread(target=cleanup_file).start()
        
        return jsonify({'status': 'speaking'})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/stop', methods=['POST'])
def stop():
    # In a real implementation, you would need to track and terminate the speaking process
    # For now, we'll just return success
    return jsonify({'status': 'stopped'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
