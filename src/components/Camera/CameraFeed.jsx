export default function CameraFeed({ apiBase, ts }) {
  return (
    <div className="text-center mt-5">
      <img
        src={`${apiBase}/udp/camera/latest?ts=${ts}`}
        alt="Camera Feed"
        className="max-w-full h-auto border border-border rounded-lg"
        onError={(e) => { e.target.style.display = 'none' }}
        onLoad={(e) => { e.target.style.display = 'block' }}
      />
    </div>
  )
}
