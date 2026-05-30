import wave
import struct
import math
import random

def generate_drone(filename):
    sample_rate = 44100
    duration = 5.0 # 5 seconds, can be looped
    freq = 55.0
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(int(sample_rate * duration)):
            t = float(i) / sample_rate
            # Complex drone with LFO
            lfo = math.sin(2.0 * math.pi * 0.5 * t)
            value = int(10000 * math.sin(2.0 * math.pi * (freq + lfo * 5) * t))
            data = struct.pack('<h', value)
            wav_file.writeframesraw(data)

def generate_glitch(filename):
    sample_rate = 44100
    duration = 1.0 # 1 second of glitch
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(int(sample_rate * duration)):
            # Random harsh noise
            value = random.randint(-32767, 32767)
            data = struct.pack('<h', value)
            wav_file.writeframesraw(data)

def generate_keystroke(filename):
    sample_rate = 44100
    duration = 0.05 # 50ms click
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(int(sample_rate * duration)):
            # Fast decaying burst
            t = float(i) / sample_rate
            envelope = math.exp(-t * 100)
            value = int(random.randint(-15000, 15000) * envelope)
            data = struct.pack('<h', value)
            wav_file.writeframesraw(data)

if __name__ == "__main__":
    generate_drone("drone.wav")
    generate_glitch("glitch.wav")
    generate_keystroke("keystroke.wav")
    print("Audio generated.")
