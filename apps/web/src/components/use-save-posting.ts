'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '../lib/api';
import { useCreateApplication } from '../lib/queries';

export function useSavePosting() {
  const router = useRouter();
  const create = useCreateApplication();

  function open(applicationId: string) {
    router.push(`/pipeline?open=${applicationId}`);
  }

  function save(input: { postingId: string; company: string | null; role: string | null }) {
    create.mutate(
      { postingId: input.postingId },
      {
        onSuccess: (application) => {
          toast.success(`Saved ${application.company}`, {
            description: `${application.role} is now in your pipeline under Saved.`,
            action: { label: 'Open', onClick: () => open(application.id) },
          });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            toast(`${input.company ?? 'That posting'} is already in your pipeline`, {
              action: { label: 'Pipeline', onClick: () => router.push('/pipeline') },
            });
            return;
          }
          toast.error('Could not save that posting', {
            description: error instanceof ApiError ? error.message : undefined,
          });
        },
      },
    );
  }

  return { save, open, isPending: create.isPending, variables: create.variables };
}
