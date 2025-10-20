import os
import subprocess
import threading
import queue
import time
from flask import Flask, request, Response
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

rtspURLPackaging = os.environ.get('RTSP_PACKAGING')
rtspURLFilling = os.environ.get('RTSP_FILLING')
rtspURLMixing = os.environ.get('RTSP_MIXING')

active_streams = {}
stream_lock = threading.Lock()

class StreamManager:
    def __init__(self, rtsp_url):
        self.rtsp_url = rtsp_url
        self.process = None
        self.data_queue = queue.Queue(maxsize=100)
        self.last_client_time = time.time()
        self.client_count = 0
        self.is_running = False

    def start(self):
        self.is_running = True
        command = [
            'ffmpeg',
            '-rtsp_transport', 'tcp',
            '-i', self.rtsp_url,
            '-c:v', 'copy',
            '-an',
            '-f', 'mp4',
            '-movflags', 'frag_keyframe+empty_moov',
            # '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            'pipe:1'
        ]

        try:
            self.process = subprocess.Popen(
                command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            self.stream_thread = threading.Thread(
                target=self._read_stream_data)
            self.stream_thread.daemon = True
            self.stream_thread.start()
        except FileNotFoundError:
            self.is_running = False
            raise RuntimeError('FFmpeg tidak ditemukan.')
        except Exception as e:
            self.is_running = False
            raise RuntimeError(f"Gagal memulai proses FFmpeg: {str(e)}")

    def _read_stream_data(self):
        while self.is_running:
            try:
                data = self.process.stdout.read(4096)
                if not data:
                    print("No more data from FFmpeg process.")
                    break
                try:
                    self.data_queue.put_nowait(data)
                except queue.Full:
                    pass
            except Exception:
                break
        self.stop()

    def get_data(self):
        self.last_client_time = time.time()
        self.client_count += 1

        while self.is_running:
            try:
                data = self.data_queue.get(timeout=3)
                yield data
            except queue.Empty:
                if time.time() - self.last_client_time > 10 and self.client_count == 0:
                    self.stop()
                    break
            except Exception:
                break

        self.client_count -= 1

    def stop(self):
        if self.is_running:
            self.is_running = False
            self.process.terminate()
            self.process.wait()

            with stream_lock:
                if self.rtsp_url in active_streams:
                    del active_streams[self.rtsp_url]
            print(f"Stream {self.rtsp_url} dihentikan.")

@app.route('/stream/packaging-tarami')
def streamPackagingTarami():
    with stream_lock:
        try:
            if rtspURLPackaging in active_streams:
                del active_streams[rtspURLPackaging]
            manager = StreamManager(rtspURLPackaging)
            manager.start()
            active_streams[rtspURLPackaging] = manager
            print(f"Memulai stream baru untuk {rtspURLPackaging}")
        except RuntimeError as e:
            return str(e), 500

    manager = active_streams[rtspURLPackaging]
    return Response(manager.get_data(), mimetype='video/mp4')

@app.route('/stream/filling-tarami')
def streamFillingTarami():
    with stream_lock:
        try:
            if rtspURLFilling in active_streams:
                del active_streams[rtspURLFilling]
            manager = StreamManager(rtspURLFilling)
            manager.start()
            active_streams[rtspURLFilling] = manager
            print(f"Memulai stream baru untuk {rtspURLFilling}")
        except RuntimeError as e:
            return str(e), 500

    manager = active_streams[rtspURLFilling]
    return Response(manager.get_data(), mimetype='video/mp4')

@app.route('/stream/mixing-tarami')
def streamMixingTarami():
    with stream_lock:
        try:
            if rtspURLMixing in active_streams:
                del active_streams[rtspURLMixing]
            manager = StreamManager(rtspURLMixing)
            manager.start()
            active_streams[rtspURLMixing] = manager
            print(f"Memulai stream baru untuk {rtspURLMixing}")
        except RuntimeError as e:
            return str(e), 500

    manager = active_streams[rtspURLMixing]
    return Response(manager.get_data(), mimetype='video/mp4')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
