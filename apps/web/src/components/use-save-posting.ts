'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '../lib/api';
import { useCreateApplication } from '../lib/queries';

export function useSavePosting() {
  const router = useRouter();
  const create = useCreateApplication();

  function save(input: { postingId: string; company: string | null; role: string | null }) {
    create.mutate(
      { postingId: input.postingId },
      {
        onSuccess: (application) => {
          toast.success(`Saved ${application.company}`, {
            description: `${application.role} is now in your pipeline under Saved.`,
            action: {
              label: 'Open',
              onClick: () => router.push(`/pipeline?open=${application.id}`),
            },
          });
        },
        onError: (error) => {
          toast.error('Could not save that posting', {
            description: error instanceof ApiError ? error.message : undefined,
          });
        },
      },
    );
  }

  return { save, isPending: create.isPending, variables: create.variables };
}
