import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RetroQuestionField } from './RetroQuestionField';
import { Sprout, Send, ChevronRight, LogOut, Terminal } from 'lucide-react';
import type { ApplicationQuestion } from '../../types/application';
import { supabase } from '../../lib/supabase';

interface Props {
  questions: ApplicationQuestion[];
  onSubmit: (data: any) => void;
}

export function RetroApplicationForm({ questions, onSubmit }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAutoAdvance = () => {
    setCurrentSection(prev => Math.min(sectionNames.length - 1, prev + 1));
  };

  // Group questions by section
  const sections = questions.reduce((acc, question) => {
    const section = question.section || 'Other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(question);
    return acc;
  }, {} as Record<string, ApplicationQuestion[]>);

  const sectionNames = Object.keys(sections);
  const currentSectionName = sectionNames[currentSection];
  const currentQuestions = sections[currentSectionName] || [];
  
  const progress = ((currentSection + 1) / sectionNames.length) * 100;

  return (
    <div className="min-h-screen bg-garden-dark text-garden-gold font-mono p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Sprout className="w-16 h-16" />
              <pre className="absolute -top-2 -right-2 text-[8px] text-garden-gold/60">
                ╔═╗
                ║*║
                ╚═╝
              </pre>
            </div>
            <div>
              <h1 className="text-5xl font-display mb-2">The Garden</h1>
              <div className="relative">
                <div className="w-full bg-garden-gold/20 h-1">
                  <motion.div 
                    className="h-full bg-garden-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <pre className="absolute -top-8 left-0 right-0 text-[12px] text-garden-gold/60 text-center">
╔════════════════════════════════════════╗
║     COMPLETING THIS APPLICATION IS     ║
║      NOT A CONFIRMED ENTRY TO THE      ║
║              GARDEN                    ║
╚════════════════════════════════════════╝</pre>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 text-garden-gold hover:text-garden-accent transition-colors pixel-corners relative"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
            <pre className="absolute -bottom-4 left-0 text-[8px] text-garden-gold/40 group-hover:text-garden-gold/60 transition-colors">
              └──┘
            </pre>
          </button>
        </motion.div>

        {/* Section Navigation */}
        <div className="relative flex gap-8 mb-12 overflow-x-auto pb-4 scrollbar-thin">
          {sectionNames.map((name, index) => (
            <button
              key={name}
              onClick={() => setCurrentSection(index)}
              className={`text-2xl font-display whitespace-nowrap transition-all group ${
                index === currentSection
                  ? 'text-garden-gold scale-110'
                  : 'text-garden-gold/40 hover:text-garden-gold/60'
              }`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
              {index === currentSection && (
                <pre className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-garden-gold/60">
                  ▲
                </pre>
              )}
            </button>
          ))}
          <pre className="absolute -bottom-2 left-0 right-0 text-[8px] text-garden-gold/20">
            {'═'.repeat(100)}
          </pre>
        </div>

        {/* Current Section Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionName}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-12"
          >
            {currentQuestions.map(question => (
              <div 
                key={question.order_number}
                className="space-y-6"
              >
                <RetroQuestionField
                  question={question}
                  value={formData[question.order_number]}
                  onChange={(value) => handleChange(question.order_number, value)}
                  onAutoAdvance={handleAutoAdvance}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="fixed bottom-8 right-8 left-8 flex justify-between items-center max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
            className={`group px-6 py-3 text-lg font-display transition-all ${
              currentSection === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-garden-gold hover:text-garden-accent'
            }`}
          >
            <span>Previous</span>
            <pre className="absolute -bottom-2 left-0 text-[8px] text-garden-gold/40 group-hover:text-garden-gold/60">
              ◄──
            </pre>
          </button>

          {currentSection === sectionNames.length - 1 ? (
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="group flex items-center gap-2 bg-garden-gold text-garden-dark px-8 py-4 text-xl font-display hover:bg-garden-accent transition-colors pixel-corners relative"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-garden-dark border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Submit
                </>
              )}
              <pre className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-garden-gold/60 group-hover:text-garden-gold">
                ▲▲▲
              </pre>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentSection(prev => Math.min(sectionNames.length - 1, prev + 1))}
              className="group flex items-center gap-2 text-garden-gold hover:text-garden-accent px-6 py-3 text-lg font-display transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
              <pre className="absolute -bottom-2 right-0 text-[8px] text-garden-gold/40 group-hover:text-garden-gold/60">
                ──►
              </pre>
            </button>
          )}
        </div>

        {/* Terminal Decoration */}
        <div className="fixed bottom-4 left-4 text-garden-gold/20">
          <Terminal className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}