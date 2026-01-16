'use client';

import { useState } from 'react';
import { CoachButton } from './coach-button';
import { CoachPanel } from './coach-panel';

interface CoachProviderProps {
  contextUser?: {
    name: string;
    email: string;
    status: string;
  } | null;
}

export function Coach({ contextUser }: CoachProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <CoachButton
        onClick={() => setIsOpen(true)}
        hasNotification={false}
      />
      <CoachPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contextUser={contextUser}
      />
    </>
  );
}

export { CoachButton } from './coach-button';
export { CoachPanel } from './coach-panel';
