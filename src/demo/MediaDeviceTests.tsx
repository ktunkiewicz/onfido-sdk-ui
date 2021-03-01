import { h, FunctionComponent } from 'preact'
import { memo, useEffect, useState } from 'preact/compat'

const MediaDevicesTests: FunctionComponent = () => {
  const [loading, setLoading] = useState(false)
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([])
  const [mediaSettings, setMediaSettings] = useState<MediaTrackSettings[]>([])
  const [error, setError] = useState<Error>(null)

  const getVideoTracks = async () => {
    setLoading(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          height: { min: 1280 },
          width: { min: 720 },
        },
      })
      const tracks = stream.getVideoTracks()
      setMediaSettings(tracks.map((track) => track.getSettings()))

      const devices = await navigator.mediaDevices.enumerateDevices()
      setMediaDevices(devices)
    } catch (error) {
      console.warn(error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const validate = (value: number, threshold: number) =>
    value >= threshold ? '✅' : '❌'

  useEffect(() => {
    getVideoTracks()
  }, [])

  if (loading) {
    return <span>Loading...</span>
  }

  return (
    <div style={{ maxWidth: '40em', margin: '0 auto' }}>
      <h1>Media devices test</h1>
      {mediaSettings.length > 0 && (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <td>No.</td>
              <td>ID</td>
              <td>Label</td>
              <td>Frame rate</td>
              <td>Height</td>
              <td>Width</td>
            </tr>
          </thead>
          <tbody>
            {mediaSettings.map(
              ({ deviceId, frameRate, height, width }, index) => {
                const device = mediaDevices.find(
                  (device) => device.deviceId === deviceId
                )

                return (
                  <tr key={deviceId}>
                    <td>{index + 1}</td>
                    <td>
                      <pre>{deviceId.substring(0, 6)}</pre>
                    </td>
                    <td>{device && device.label}</td>
                    <td>
                      {frameRate} {validate(frameRate, 24)}
                    </td>
                    <td>
                      {height} {validate(height, 1280)}
                    </td>
                    <td>
                      {width} {validate(height, 720)}
                    </td>
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      )}
      {error && <pre>{String(error)}</pre>}
    </div>
  )
}

export default memo(MediaDevicesTests)
