'use client';

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ 
  code, 
  language = 'typescript',
  filename,
  showLineNumbers = false 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="relative group">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
          <span className="text-xs font-mono text-gray-300">{filename}</span>
          {language && (
            <span className="text-xs font-mono text-gray-400 uppercase">{language}</span>
          )}
        </div>
      )}
      <div className={`relative bg-gray-900 ${filename ? '' : 'rounded-t-lg'} rounded-b-lg overflow-hidden`}>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          aria-label="Copy code"
        >
          {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
        </button>
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={`language-${language}`}>
            {showLineNumbers ? (
              <div className="flex">
                <div className="select-none text-gray-600 pr-4 text-right">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="flex-1">
                  {lines.map((line, i) => (
                    <div key={i} className="text-gray-100">
                      {line || ' '}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-gray-100">{code}</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

