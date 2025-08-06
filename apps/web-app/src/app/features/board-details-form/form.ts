import { FormGroup, FormControl, Validators } from "@angular/forms";

export const NotOnlyWhiteSpacePattern = /^(\s+\S+\s*)*(?!\s).*$/;
export type BoardSize = 9 | 16 | 25;
export type BoardForm = FormGroup<{
    Name: FormControl<string | null>;
    BoardSize: FormControl<BoardSize>;
    GameMode: FormControl<"traditional" | "todo">;
    CompletionDeadlineUtc: FormControl<Date | null>;
    CompletionReward: FormControl<string | null>;
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
    CompletionReward: new FormControl<string | null>(null)
  });