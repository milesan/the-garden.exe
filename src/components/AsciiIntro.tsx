import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const ASCII_ART = `████████╗██╗  ██╗███████╗     ██████╗  █████╗ ██████╗ ██████╗ ███████╗███╗   ██╗
╚══██╔══╝██║  ██║██╔════╝    ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗  ██║
   ██║   ███████║█████╗      ██║  ███╗███████║██████╔╝██║  ██║█████╗  ██╔██╗ ██║
   ██║   ██╔══██║██╔══╝      ██║   ██║██╔══██║██╔══██╗██║  ██║██╔══╝  ██║╚██╗██║
   ██║   ██║  ██║███████╗    ╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗██║ ╚████║
   ╚═╝   ╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═══╝`;

export function AsciiIntro({ onComplete }: Props) {
  const [asciiLines, setAsciiLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    setAsciiLines(ASCII_ART.split('\n'));
  }, []);

  useEffect(() => {
    if (asciiLines.length === 0 || currentLine >= asciiLines.length) return;

    const line = asciiLines[currentLine];
    if (currentChar >= line.length) {
      setTimeout(() => {
        setCurrentLine(prev => prev + 1);
        setCurrentChar(0);
      }, 100);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentChar(prev => prev + 1);
    }, 7);

    return () => clearTimeout(timer);
  }, [asciiLines, currentLine, currentChar]);

  useEffect(() => {
    if (currentLine >= asciiLines.length && asciiLines.length > 0) {
      setTimeout(onComplete, 500);
    }
  }, [currentLine, asciiLines.length, onComplete]);

  return (
    <motion.div className="min-h-screen bg-garden-dark flex items-center justify-center font-mono">
      <pre className="text-garden-gold whitespace-pre">
        {asciiLines.slice(0, currentLine).map((line, i) => (
          <div key={i}>
            {i === currentLine - 1 ? line.slice(0, currentChar) : line}
          </div>
        ))}
      </pre>
    </motion.div>
  );
}