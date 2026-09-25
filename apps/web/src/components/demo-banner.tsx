'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FastForward, FlaskConical, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { demoClockOffsetDays, fastForward, resetDemo } from '../demo';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Tip } from './ui/tooltip';

export function DemoBanner() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(() => demoClockOffsetDays());
  const [confirming, setConfirming] = useState(false);

  function forward() {
    const result = fastForward(10);
    setOffset(demoClockOffsetDays());
    void queryClient.invalidateQueries();
    toast.success(`Clock moved 10 days ahead`, {
      description:
        result.sent > 0
          ? `${result.sent} reminder ${result.sent === 1 ? 'email' : 'emails'} went out. Read them under Settings → Account.`
          : 'Nothing was due yet. Move an application to Applied, then try again.',
    });
  }

  function reset() {
    resetDemo();
    setOffset(0);
    setConfirming(false);
    queryClient.clear();
    window.location.assign('/login');
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-accent/30 bg-accent-soft px-4 py-2 text-body-sm text-fg md:px-8">
      <span className="inline-flex items-center gap-2 font-medium">
        <FlaskConical className="size-4 text-accent" /> Demo
      </span>
      <span className="hidden text-muted sm:inline">
        Synthetic data that lives in this browser. Nothing here is a real company or posting.
        {offset > 0 ? ` Clock is ${offset} days ahead.` : ''}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <Tip content="Advance the clock ten days so pending reminders fire and their emails appear">
          <Button size="xs" variant="ghost" onClick={forward}>
            <FastForward className="size-4" /> Fast-forward 10 days
          </Button>
        </Tip>
        <Tip content="Restore the seeded data and sign out">
          <Button size="xs" variant="ghost" onClick={() => setConfirming(true)}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </Tip>
      </span>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent
          size="sm"
          title="Reset the demo?"
          description="Everything you changed in this browser goes back to the seeded state."
        >
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Keep my changes
            </Button>
            <Button variant="primary" size="sm" onClick={reset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
