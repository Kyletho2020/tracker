import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MonitorUp, Camera, Send, Trash2, AlertTriangle } from 'lucide-react';
import { GlowEffect } from 'react-visual-effects';

const assistantEndpoint = import.meta.env.VITE_SCREEN_ASSISTANT_URL;

interface AssistantResponse {
  answer: string;
}

export function ScreenAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCapture = useCallback(() => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaStream(null);
    setIsCapturing(false);
  }, [mediaStream]);

  const startCapture = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen capture is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });

      setMediaStream(stream);
      setIsCapturing(true);
      setCapturedImage(null);
      setAnswer('');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      if ((err as DOMException).name !== 'NotAllowedError') {
        setError('Failed to start screen capture.');
      }
    }
  }, []);

  const captureScreenshot = useCallback(() => {
    setError(null);

    if (!videoRef.current || !canvasRef.current) {
      setError('Screen capture is not ready yet.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Unable to capture screenshot.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    setAnswer('');
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!assistantEndpoint) {
      setError('Assistant endpoint is not configured.');
      return;
    }

    if (!capturedImage) {
      setError('Capture a screenshot before asking a question.');
      return;
    }

    if (!question.trim()) {
      setError('Please enter a question for the assistant.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(assistantEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim(), screenshot: capturedImage }),
      });

      if (!response.ok) {
        throw new Error('Assistant request failed');
      }

      const data = (await response.json()) as AssistantResponse;
      setAnswer(data.answer ?? 'The assistant did not return a response.');
    } catch (err) {
      console.error('Assistant request failed', err);
      setError('Unable to get an answer from the assistant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [capturedImage, question]);

  const clearCapture = useCallback(() => {
    setCapturedImage(null);
    setAnswer('');
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Screen Assistant</h1>
        <p className="text-gray-400 mt-1">
          Share your screen, capture a snapshot, and ask a question for the AI assistant to answer.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/60 bg-red-500/10 p-3 text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <GlowEffect className="rounded-xl" style={{ width: '100%' }} intensity="sm" color="#14b8a6">
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-2">
                  <span className="text-sm font-medium text-gray-300">Live preview</span>
                  <div className="flex gap-2">
                    {!isCapturing ? (
                      <button
                        onClick={startCapture}
                        className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        <MonitorUp className="h-4 w-4" />
                        Start sharing
                      </button>
                    ) : (
                      <button
                        onClick={stopCapture}
                        className="inline-flex items-center gap-2 rounded-md bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Stop sharing
                      </button>
                    )}
                    <button
                      onClick={captureScreenshot}
                      disabled={!mediaStream}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-100 transition hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4" />
                      Capture screenshot
                    </button>
                  </div>
                </div>

                <div className="aspect-video bg-black">
                  {mediaStream ? (
                    <video ref={videoRef} className="h-full w-full object-contain" autoPlay muted />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                      <p>Start sharing to preview your screen.</p>
                    </div>
                  )}
                </div>
              </div>
            </GlowEffect>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold text-white">Your screenshot</h2>
            {capturedImage ? (
              <div className="mt-3 space-y-3">
                <img src={capturedImage} alt="Captured screenshot" className="w-full rounded-md border border-gray-800" />
                <button
                  onClick={clearCapture}
                  className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-white/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard screenshot
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">No screenshot captured yet.</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
            <label htmlFor="assistant-question" className="text-sm font-medium text-gray-200">
              Question for the assistant
            </label>
            <textarea
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What would you like to know about this screenshot?"
              className="min-h-[120px] w-full rounded-md border border-gray-800 bg-gray-950 p-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending to assistant
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ask assistant
                </>
              )}
            </button>
          </div>

          {answer && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="text-lg font-semibold text-white">Assistant response</h2>
              <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
