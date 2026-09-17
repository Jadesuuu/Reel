# Step 10 — Applications and stage transitions

## What this step adds

The pipeline: rows you own, moving through stages, with an append-only history of every move.

## Files, in reading order

1. **`applications/stage-machine.ts`** — 20 lines, zero dependencies, the entire rule set.
2. **`applications/stage-machine.spec.ts`** — one test per row of the table.
3. **`applications/applications.service.ts`** — ownership, transitions, transactions.
4. **`applications/applications.controller.ts`** — six routes.
5. **`reminders/reminders.service.ts`** — a stub at this point; step 11 fills it in.

## Concepts

**A state machine as data, not code.**

```ts
export const ALLOWED: Record<Stage, Stage[]> = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  ...
  REJECTED: [],
};
```

`Record<Stage, Stage[]>` forces you to list **every** stage — add a seventh to the enum and this
object stops compiling until you decide where it can go. An `if/else` chain gives you no such
alarm. `canTransition` is then a one-line lookup, and the UI can read the same table to decide
which buttons to show.

Terminal stages are `[]`, not a special case. "Nowhere to go" falls out of the data.

**Ownership is a `where` clause, not an `if`.** Every method funnels through:

```ts
findFirst({ where: { id, userId } });
```

Not "fetch by id, then compare the owner". If the row belongs to someone else the query returns
nothing and you get a 404 — which also leaks less than a 403, since it does not confirm the id
exists.

**`$transaction` for the two writes that must agree.** Changing a stage updates the application
and appends a `StageEvent`. If the first succeeded and the second failed you would have a
pipeline with no history of how it got there:

```ts
const [updated] = await this.prisma.$transaction([
  this.prisma.application.update({ ... }),
  this.prisma.stageEvent.create({ ... }),
]);
```

The array form runs both in one transaction and returns results in order — hence the
destructuring to grab the first.

**Reminders are scheduled _after_ the transaction commits.** Queue jobs are not transactional. If
you enqueued inside the transaction and it then rolled back, you would have a job referring to a
change that never happened.

**Nested create for the first event.** Creating an application writes its `SAVED` event in the
same statement:

```ts
events: { create: { fromStage: null, toStage: 'SAVED' } }
```

`fromStage: null` is what "this is the beginning" looks like in the data, which is why the column
is nullable.

## The PATCH spread

```ts
data: {
  ...(dto.company === undefined ? {} : { company: dto.company }),
  ...(dto.notes === undefined ? {} : { notes: dto.notes }),
}
```

The comparison is against `undefined` specifically, not falsiness. `notes: ''` and `notes: null`
are both meaningful — the user clearing the field — and `if (dto.notes)` would silently ignore
them. Only "the client did not mention this field" means leave it alone.

## Gotchas

**Validation lives in the service, not the DTO.** "company and role are required unless you gave
a postingId" is a rule about the relationship between fields. The plan offers `@ValidateIf` and
says use the service instead; the service throws `BadRequestException` after trying to fill the
gaps from the posting.

**Error messages name the legal moves.** `Cannot move from SAVED to OFFER. Allowed: APPLIED,
WITHDRAWN`. The client mirrors the table for its buttons, but a bad request still gets told why.

**Same-stage moves are 400, not silently ignored.** Checked before `canTransition`, because
`ALLOWED[stage]` never contains `stage` itself and the generic message would be confusing.
