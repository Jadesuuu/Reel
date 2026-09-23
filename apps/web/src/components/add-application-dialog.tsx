'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '../lib/api';
import { fromDateInputValue } from '../lib/format';
import { useCreateApplication } from '../lib/queries';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Field, Input, Textarea } from './ui/input';

const VIA_SUGGESTIONS = [
  'LinkedIn',
  'Referral',
  'Company site',
  'Recruiter',
  'Wellfound',
  'Indeed',
];

const EMPTY = {
  company: '',
  role: '',
  url: '',
  via: '',
  location: '',
  salaryText: '',
  nextStepAt: '',
  contactName: '',
  contactEmail: '',
  notes: '',
};

export function AddApplicationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const create = useCreateApplication();
  const [form, setForm] = useState(EMPTY);
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setMore(false);
    }
  }, [open]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  const valid = form.company.trim().length > 0 && form.role.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Add an application"
        description="For a job you found anywhere — a referral, LinkedIn, a company site. It starts in Saved."
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            create.mutate(
              {
                company: form.company.trim(),
                role: form.role.trim(),
                ...(form.url.trim() ? { url: form.url.trim() } : {}),
                ...(form.via.trim() ? { via: form.via.trim() } : {}),
                ...(form.location.trim() ? { location: form.location.trim() } : {}),
                ...(form.salaryText.trim() ? { salaryText: form.salaryText.trim() } : {}),
                ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
                ...(form.contactName.trim() ? { contactName: form.contactName.trim() } : {}),
                ...(form.contactEmail.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
                ...(fromDateInputValue(form.nextStepAt)
                  ? { nextStepAt: fromDateInputValue(form.nextStepAt)! }
                  : {}),
              },
              {
                onSuccess: (application) => {
                  onOpenChange(false);
                  toast.success(`Added ${application.company}`, {
                    description: 'Drag it to Applied once you have sent it.',
                    action: {
                      label: 'Open',
                      onClick: () => router.push(`/pipeline?open=${application.id}`),
                    },
                  });
                  onCreated?.(application.id);
                },
                onError: (error) =>
                  toast.error('Could not add it', {
                    description: error instanceof ApiError ? error.message : undefined,
                  }),
              },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company" htmlFor="add-company">
              <Input
                id="add-company"
                autoFocus
                required
                value={form.company}
                onChange={(event) => set('company', event.target.value)}
              />
            </Field>
            <Field label="Role" htmlFor="add-role">
              <Input
                id="add-role"
                required
                value={form.role}
                onChange={(event) => set('role', event.target.value)}
              />
            </Field>
          </div>

          <Field label="Link to the posting" htmlFor="add-url" hint="optional">
            <Input
              id="add-url"
              type="url"
              placeholder="https://"
              value={form.url}
              onChange={(event) => set('url', event.target.value)}
            />
          </Field>

          <div>
            <Field label="Found via" htmlFor="add-via" hint="optional">
              <Input
                id="add-via"
                value={form.via}
                onChange={(event) => set('via', event.target.value)}
              />
            </Field>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {VIA_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => set('via', item)}
                  className={`rounded-sm border px-1.5 py-0.5 text-[11px] transition-colors ${
                    form.via === item
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-dashed border-line text-muted hover:border-line-strong hover:text-fg'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {more ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Location" htmlFor="add-location">
                <Input
                  id="add-location"
                  value={form.location}
                  onChange={(event) => set('location', event.target.value)}
                />
              </Field>
              <Field label="Salary" htmlFor="add-salary">
                <Input
                  id="add-salary"
                  placeholder="$140k–$170k"
                  value={form.salaryText}
                  onChange={(event) => set('salaryText', event.target.value)}
                />
              </Field>
              <Field label="Next step" htmlFor="add-next">
                <Input
                  id="add-next"
                  type="date"
                  value={form.nextStepAt}
                  onChange={(event) => set('nextStepAt', event.target.value)}
                />
              </Field>
              <Field label="Contact" htmlFor="add-contact">
                <Input
                  id="add-contact"
                  value={form.contactName}
                  onChange={(event) => set('contactName', event.target.value)}
                />
              </Field>
              <Field label="Contact email" htmlFor="add-contact-email" className="sm:col-span-2">
                <Input
                  id="add-contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => set('contactEmail', event.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor="add-notes" className="sm:col-span-2">
                <Textarea
                  id="add-notes"
                  className="min-h-20"
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                />
              </Field>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => setMore(true)}
            >
              Add location, salary, contact, notes…
            </button>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!valid}
              loading={create.isPending}
            >
              Add to pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
