import { Helmet } from 'react-helmet-async';

export function RTSPPage() {
  const rtspURLPackaging = import.meta.env.VITE_RTSP_PACKAGING;
  const rtspURLFilling = import.meta.env.VITE_RTSP_FILLING;
  const rtspURLMixing = import.meta.env.VITE_RTSP_MIXING;
  return (
    <>
      <Helmet>
        <title>RTSP Stream</title>
      </Helmet>

      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Tarami Area</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <video controls autoPlay className="aspect-video">
              <source
                // src="https://rtsp-server.boedakoding.com/stream?url=rtsp://admin:admin@192.168.1.185:554/cam/realmonitor?channel=1%26subtype=1"
                src={rtspURLPackaging}
                type="video/mp4"
              />
            </video>
          </div>
          <div>
            <video controls autoPlay className="aspect-video">
              <source src={rtspURLFilling} type="video/mp4" />
            </video>
          </div>
          <div className="lg:col-span-1">
            <video controls autoPlay className="aspect-video">
              <source src={rtspURLMixing} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </>
  );
}
