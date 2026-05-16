'use client';
import { useState } from 'react';
import { Button } from './Button';

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
      <input 
        type="text" 
        readOnly 
        value={url} 
        className="bg-transparent border-none w-full text-sm text-gray-600 focus:ring-0 outline-none px-2"
      />
      <Button variant={copied ? 'secondary' : 'primary'} onClick={handleCopy} className="whitespace-nowrap px-4 py-2 text-sm h-auto">
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  );
}
