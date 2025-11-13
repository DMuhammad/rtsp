import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js/dist/hls.js';
import { Helmet } from 'react-helmet-async';

const ICONS = {
  CONNECTING: (
    <svg
      className="w-16 h-16 text-cyan-400 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
  ERROR: (
    <svg
      className="w-16 h-16 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
  IDLE: (
    <svg
      className="w-16 h-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      ></path>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
};

function WebRTCPlayer({ serverUrl, streamName, title }) {
  const videoRef = useRef(null);
  // const readerRef = useRef(null);
  const hlsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [statusText, setStatusText] = useState('Menunggu koneksi...');

  useEffect(() => {
    const stopStreaming = () => {
      clearTimeout(reconnectTimerRef.current);
      // if (readerRef.current) {
      //   readerRef.current.close();
      //   readerRef.current = null;
      // }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    const scheduleReconnect = (errorMessage) => {
      stopStreaming();
      setStatus('error');
      setStatusText(`${errorMessage}. Menyambung ulang...`);

      reconnectTimerRef.current = setTimeout(() => {
        startStreaming();
      }, 5000);
    };

    const startStreaming = async () => {
      stopStreaming();

      if (!serverUrl || !streamName) {
        setStatus('error');
        setStatusText('URL Server tidak ada');
        return;
      }

      // if (typeof window.MediaMTXWebRTCReader === 'undefined') {
      //   const msg = 'MediaMTXWebRTCReader tidak ditemukan';
      //   console.error(
      //     `[${streamName}] ${msg} Pastikan script sudah dimuat di index.html`,
      //   );
      //   setStatus('error');
      //   setStatusText(msg);
      //   return;
      // }

      setStatus('connecting');
      setStatusText('Menghubungkan...');

      if (
        videoRef.current &&
        videoRef.current.canPlayType('application/vnd.apple.mpegurl')
      ) {
        videoRef.current.src = `${serverUrl}/${streamName}/index.m3u8`;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setStatus('live');
          setStatusText('LIVE');
        });

        videoRef.current.addEventListener('error', () => {
          scheduleReconnect('Gagal memuat stream native');
        });
      } else if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          autoStartLoad: true,
          startPosition: -1,
        });
        hlsRef.current = hls;

        hls.loadSource(`${serverUrl}/${streamName}/index.m3u8`);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log(`[${title}] Manifest HLS berhasil dimuat.`);
          setStatus('live');
          setStatusText('LIVE');
          videoRef.current.play();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error(`[${title}] Error HLS:`, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                scheduleReconnect('Network error');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError(); // Coba pulihkan
                break;
              default:
                scheduleReconnect('Stream error fatal');
                break;
            }
          }
        });
      } else {
        setStatus('error');
        setStatusText('HLS tidak didukung oleh browser ini.');
      }
    };

    startStreaming();

    return () => {
      stopStreaming();
    };
  }, [serverUrl, streamName, title]);

  return (
    <div className="relative bg-black aspect-video w-full rounded-lg overflow-hidden shadow-lg">
      {/* Judul Stream */}
      <div className="absolute top-0 left-0 p-2 bg-black bg-opacity-50 text-white font-semibold rounded-br-lg">
        {title}
      </div>

      {/* Video Player */}
      <video
        ref={videoRef}
        // className="w-full h-full"
        className="aspect-video video-player"
        autoPlay
        muted
        playsInline
        // Hapus 'controls' agar tidak bentrok dengan overlay
      ></video>

      {/* Overlay Status (hanya tampil saat tidak 'live') */}
      {status !== 'live' && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center transition-opacity duration-300">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto">
              {status === 'connecting' && ICONS.CONNECTING}
              {status === 'error' && ICONS.ERROR}
              {status === 'idle' && ICONS.IDLE}
            </div>
            <p className="text-lg font-semibold text-gray-300 mt-4">
              {statusText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RTSPPage() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  return (
    <>
      <Helmet>
        <title>RTSP Stream</title>
      </Helmet>

      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Tarami Area</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <WebRTCPlayer
            serverUrl={serverUrl}
            streamName={'packaging'}
            title={'Packaging'}
          />
          <WebRTCPlayer
            serverUrl={serverUrl}
            streamName={'filling'}
            title={'Filling'}
          />
          <WebRTCPlayer
            serverUrl={serverUrl}
            streamName={'mixing'}
            title={'Mixing'}
          />
        </div>
      </div>
    </>
  );
}
