'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/cn';
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  STAGE_HINT,
  STAGE_LABEL,
  STAGE_TEXT,
  canTransition,
} from '../lib/stages';
import type { ApplicationListItem, Stage } from '../lib/types';
import { ApplicationCard } from './application-card';

function DraggableCard({
  application,
  onOpen,
}: {
  application: ApplicationListItem;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { stage: application.stage },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <ApplicationCard
        ref={setNodeRef}
        application={application}
        dragging={isDragging}
        style={{ transform: CSS.Translate.toString(transform) }}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onOpen();
          }
        }}
        className="cursor-grab touch-manipulation active:cursor-grabbing"
        {...listeners}
        {...attributes}
      />
    </motion.div>
  );
}

function Column({
  stage,
  items,
  activeStage,
  onOpen,
  collapsed,
  onToggle,
}: {
  stage: Stage;
  items: ApplicationListItem[];
  activeStage: Stage | null;
  onOpen: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const legal = activeStage !== null && canTransition(activeStage, stage);
  const illegal = activeStage !== null && !legal && activeStage !== stage;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex h-full min-h-40 w-12 shrink-0 flex-col items-center gap-3 rounded-md border-t border-line-strong py-4 text-muted hover:text-fg"
        aria-label={`Show ${STAGE_LABEL[stage]}`}
      >
        <ChevronRight className="size-4" />
        <span className={cn('stamp [writing-mode:vertical-rl]', STAGE_TEXT[stage])}>
          {STAGE_LABEL[stage]}
        </span>
        <span className="tabular font-mono text-measure-sm">{items.length}</span>
      </button>
    );
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STAGE_LABEL[stage]} column`}
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-md transition-[background-color,box-shadow] duration-150 sm:w-80 lg:w-auto lg:min-w-64 lg:flex-1',
        isOver && legal && 'bg-accent-soft ring-1 ring-accent/60',
        isOver && illegal && 'bg-danger-soft ring-1 ring-danger/60',
        illegal && !isOver && 'opacity-60',
      )}
    >
      <header className="border-b border-line-strong px-1 py-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('stamp', STAGE_TEXT[stage])}>{STAGE_LABEL[stage]}</span>
          <span className="tabular font-mono text-measure-sm text-muted">{items.length}</span>
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="ml-auto text-faint hover:text-fg"
              aria-label={`Collapse ${STAGE_LABEL[stage]}`}
            >
              <ChevronDown className="size-4" />
            </button>
          ) : null}
        </div>
        <p className="mt-1 hidden text-caption text-muted lg:block">{STAGE_HINT[stage]}</p>
      </header>
      <div className="flex min-h-40 flex-1 flex-col gap-2.5 py-3 pr-1">
        <AnimatePresence initial={false}>
          {items.map((application) => (
            <DraggableCard
              key={application.id}
              application={application}
              onOpen={() => onOpen(application.id)}
            />
          ))}
        </AnimatePresence>
        {items.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line px-4 py-8 text-center text-caption text-muted">
            {activeStage && legal ? 'Drop here' : STAGE_HINT[stage]}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PipelineBoard({
  items,
  onOpen,
  onMove,
  showClosed,
}: {
  items: ApplicationListItem[];
  onOpen: (id: string) => void;
  onMove: (id: string, from: Stage, to: Stage) => void;
  showClosed: boolean;
}) {
  const [active, setActive] = useState<ApplicationListItem | null>(null);
  const [expandedClosed, setExpandedClosed] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function byStage(stage: Stage) {
    return items.filter((item) => item.stage === stage);
  }

  function handleStart(event: DragStartEvent) {
    setActive(items.find((item) => item.id === event.active.id) ?? null);
  }

  function handleEnd(event: DragEndEvent) {
    const application = active;
    setActive(null);
    if (!application || !event.over) return;
    const to = event.over.id as Stage;
    if (to === application.stage) return;
    onMove(application.id, application.stage, to);
  }

  const closedColumns = showClosed
    ? CLOSED_STAGES
    : CLOSED_STAGES.filter((stage) => byStage(stage).length > 0);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        {ACTIVE_STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            items={byStage(stage)}
            activeStage={active?.stage ?? null}
            onOpen={onOpen}
          />
        ))}
        {closedColumns.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            items={byStage(stage)}
            activeStage={active?.stage ?? null}
            onOpen={onOpen}
            collapsed={!showClosed && !expandedClosed[stage]}
            onToggle={() => setExpandedClosed((state) => ({ ...state, [stage]: !state[stage] }))}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {active ? <ApplicationCard application={active} overlay className="w-72 sm:w-80" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
