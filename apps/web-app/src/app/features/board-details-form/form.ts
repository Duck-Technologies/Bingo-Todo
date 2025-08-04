import { FormGroup, FormControl } from "@angular/forms";

export type BoardSize = 9 | 16 | 25;
export type BoardForm = FormGroup<{
    Name: FormControl<string | null>;
    BoardSize: FormControl<BoardSize>;
    GameMode: FormControl<"traditional" | "todo">;
    CompletionDeadlineUtc: FormControl<Date | null>;
    Visibility: FormControl<'local' | 'unlisted' | 'public'>;
}>;

export const boardForm: BoardForm = new FormGroup({
    Name: new FormControl<string | null>(null),
    BoardSize: new FormControl<BoardSize>(9, {
      nonNullable: true
    }),
    GameMode: new FormControl<'traditional' | 'todo'>('traditional', {
      nonNullable: true,
    }),
    CompletionDeadlineUtc: new FormControl<Date | null>(null),
    Visibility: new FormControl<'local' | 'unlisted' | 'public'>('unlisted', {
      nonNullable: true,
    }),
  });