'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface QueueItem {
  id: string;
  file: File;
  preview: string;
  answer: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';
  error?: string;
}

interface PuzzleUploaderProps {
  uploadType: 'room' | 'pack';
  roomId?: string;
  hostId: string;
  packName?: string;
  uploadedCount?: number;
  totalRounds?: number;
  onUploadComplete?: () => void;
}

export function PuzzleUploader({ 
  uploadType, 
  roomId, 
  hostId, 
  packName, 
  uploadedCount = 0, 
  totalRounds = 10, 
  onUploadComplete 
}: PuzzleUploaderProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newItems: QueueItem[] = [];

    for (const file of arr) {
      // Skip if filename already in queue
      if (queue.some(q => q.file.name === file.name)) continue;
      newItems.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        answer: '',
        status: 'pending'
      });
    }

    setQueue(prev => [...prev, ...newItems]);
  }, [queue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const setAnswer = (id: string, answer: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, answer } : q));
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const uploadAll = async () => {
    const pending = queue.filter(q => q.status === 'pending' && q.answer.trim());
    if (!pending.length) return;
    setUploadingAll(true);

    for (const item of pending) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));

      const formData = new FormData();
      formData.append('image', item.file);
      formData.append('answer', item.answer.trim());
      
      const endpoint = uploadType === 'room' 
        ? `/api/rooms/${roomId}/upload-puzzle` 
        : `/api/packs/upload`;

      if (uploadType === 'pack' && packName) {
        formData.append('packName', packName);
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'x-host-id': hostId },
          body: formData
        });
        const data = await res.json();

        if (res.status === 409) {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'duplicate' } : q));
        } else if (!res.ok) {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: data.error } : q));
        } else {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done' } : q));
        }
      } catch {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: 'Network error' } : q));
      }
    }

    setUploadingAll(false);
  };

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const readyCount = queue.filter(q => q.status === 'pending' && q.answer.trim()).length;
  const doneCount = queue.filter(q => q.status === 'done' || q.status === 'duplicate').length;

  return (
    <div className="space-y-5">

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center py-10 px-6 text-center
          ${dragging
            ? 'border-brand-500 bg-orange-50 scale-[1.01]'
            : 'border-gray-200 hover:border-brand-400 hover:bg-orange-50/30'}`}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-semibold text-gray-700">Drop images here or click to browse</p>
        <p className="text-sm text-gray-400 mt-1">Select <span className="font-medium text-brand-500">multiple images</span> at once — PNG, JPG, WEBP</p>
      </div>

      {/* Queue — answer grid */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-600">
                {queue.length} image{queue.length !== 1 ? 's' : ''} — fill in the answers below
              </span>
              <div className="flex items-center gap-2">
                {doneCount > 0 && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {doneCount} uploaded ✓
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-xs font-medium text-brand-500 bg-orange-50 px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {queue.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-4 px-5 py-3 ${item.status === 'done' || item.status === 'duplicate' ? 'bg-green-50/40' : item.status === 'error' ? 'bg-red-50/40' : ''}`}
                >
                  {/* Index */}
                  <span className="text-xs font-bold text-gray-300 w-5 text-center flex-shrink-0">{i + 1}</span>

                  {/* Thumbnail */}
                  <img
                    src={item.preview}
                    alt=""
                    className="w-16 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0 shadow-sm"
                  />

                  {/* Filename + Answer input */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate mb-1">{item.file.name}</p>
                    {item.status === 'pending' || item.status === 'uploading' ? (
                      <input
                        type="text"
                        placeholder="Type the answer..."
                        value={item.answer}
                        onChange={(e) => setAnswer(item.id, e.target.value)}
                        disabled={item.status === 'uploading'}
                        className="w-full text-sm font-medium border-b border-gray-200 focus:border-brand-500 outline-none bg-transparent pb-0.5 transition-colors placeholder:text-gray-300 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-700">{item.answer}</p>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                        title="Remove"
                      >✕</button>
                    )}
                    {item.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {(item.status === 'done' || item.status === 'duplicate') && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-500 font-semibold" title={item.error}>Err</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Upload button */}
            {pendingCount > 0 && (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
                {readyCount < pendingCount && (
                  <p className="text-xs text-amber-600 font-medium text-center">
                    ⚠ {pendingCount - readyCount} image{pendingCount - readyCount !== 1 ? 's' : ''} still need{pendingCount - readyCount === 1 ? 's' : ''} an answer
                  </p>
                )}
                <Button
                  onClick={uploadAll}
                  loading={uploadingAll}
                  disabled={uploadingAll || readyCount === 0}
                  className="w-full"
                >
                  Upload {readyCount > 0 ? `${readyCount} Puzzle${readyCount !== 1 ? 's' : ''}` : 'All'}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            animate={{ width: totalRounds > 0 ? `${Math.min((uploadedCount / totalRounds) * 100, 100)}%` : '0%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <span className={`text-sm font-semibold tabular-nums ${uploadedCount >= totalRounds ? 'text-green-600' : 'text-brand-500'}`}>
          {uploadedCount} / {totalRounds} uploaded
        </span>
      </div>
    </div>
  );
}
