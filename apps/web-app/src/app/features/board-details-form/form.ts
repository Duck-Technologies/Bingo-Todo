import { FormGroup, FormControl, Validators } from '@angular/forms';

export const NotOnlyWhiteSpacePattern = /^(\s+\S+\s*)*(?!\s).*$/;
export type BoardSize = 9 | 16 | 25;
export type BoardForm = FormGroup<{
  Name: FormControl<string | null>;
  BoardSize: FormControl<BoardSize>;
  GameMode: FormControl<'traditional' | 'todo'>;
  Visibility: FormControl<'local' | 'unlisted' | 'public'>;
  TraditionalGame: FormGroup<GameModeSettingsForm>;
  TodoGame: FormGroup<GameModeSettingsForm>;
}>;

export type GameModeSettingsForm = {
  CompletionDateUtc: FormControl<Date | null>;
  CompletionReward: FormControl<string | null>;
  CompletionDeadlineUtc: FormControl<Date | null>;
};

export const boardForm: BoardForm = new FormGroup({
  Name: new FormControl<string | null>(null),
  BoardSize: new FormControl<BoardSize>(9, {
    nonNullable: true,
  }),
  GameMode: new FormControl<'traditional' | 'todo'>('traditional', {
    nonNullable: true,
  }),
  Visibility: new FormControl<'local' | 'unlisted' | 'public'>('unlisted', {
    nonNullable: true,
  }),
  TraditionalGame: new FormGroup<GameModeSettingsForm>({
    CompletionDateUtc: new FormControl<Date | null>(null),
    CompletionReward: new FormControl<string | null>(null),
    CompletionDeadlineUtc: new FormControl<Date | null>(null),
  }),
  TodoGame: new FormGroup<GameModeSettingsForm>({
    CompletionDateUtc: new FormControl<Date | null>(null),
    CompletionReward: new FormControl<string | null>(null),
    CompletionDeadlineUtc: new FormControl<Date | null>(null),
  }),
});
