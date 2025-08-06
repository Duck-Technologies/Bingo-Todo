import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  interval,
  startWith,
  map,
  combineLatest,
  tap,
  Subscription,
  Observable,
} from 'rxjs';
import {
  boardForm,
  NotOnlyWhiteSpacePattern,
} from '../board-details-form/form';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { calculateDateFromNow } from '../calculations/date-calculations';

@Component({
  selector: 'app-deadline-reward-form',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatTimepickerModule,
    DatePipe,
    AsyncPipe,
    MatIcon,
    MatIconButton,
    MatButton,
    MatTooltip,
  ],
  templateUrl: './deadline-reward-form.html',
  styleUrl: './deadline-reward-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'form',
    'aria-label': 'Inputs for setting the deadline and rewards',
  },
})
export class DeadlineRewardForm implements OnDestroy {
  // in edit mode if the game mode is finished we prevent the user from
  // changing the deadline or the reward (they can remove them though)
  public readonly canOnlyRemove = input<boolean>(false);
  public readonly createMode = input.required<boolean>();

  private static readonly minDateMinutesFromNow = 15;

  public readonly boardForm = boardForm;
  public readonly deadlineInputsViewMode = signal<'none' | 'display'>('none');
  public readonly completionRewardHint$ =
    this.boardForm.controls.CompletionReward.valueChanges.pipe(
      map((reward) =>
        reward?.length && reward?.match(NotOnlyWhiteSpacePattern)?.length
          ? `You've earned ${reward}`
          : null
      )
    );

  // min date's time if today, else no min time
  public readonly minTime$ =
    boardForm.controls.CompletionDeadlineUtc.valueChanges.pipe(
      map((deadline) => {
        if (deadline) {
          deadline = new Date(deadline);

          if (deadline.getDay() === new Date().getDay()) {
            return DeadlineRewardForm.calculateMinDate();
          }
        }

        return null;
      })
    );

  public minDate$: Observable<Date> | undefined;
  private minDateSubscription: Subscription | undefined;

  ngOnInit(): void {
    if (this.createMode()) {
      this.showDeadlineInputs();
    }
  }

  ngOnDestroy(): void {
    this.minDateSubscription?.unsubscribe();
  }

  public commitDeadline(cancel: boolean = false) {
    this.minDateSubscription?.unsubscribe();

    if (cancel) {
      this.boardForm.controls.CompletionDeadlineUtc.setValue(null);
    }

    this.deadlineInputsViewMode.set('none');
    this.boardForm.enable();
  }

  public showDeadlineInputs() {
    if (!this.createMode()) {
      this.boardForm.disable();
      this.boardForm.controls.CompletionDeadlineUtc.enable();
    }

    this.minDate$ = interval(5 * 60000).pipe(
      startWith(DeadlineRewardForm.calculateMinDate()),
      map((_) => DeadlineRewardForm.calculateMinDate())
    );

    this.minDateSubscription = combineLatest([
      this.minDate$,
      boardForm.controls.CompletionDeadlineUtc.valueChanges,
    ])
      .pipe(
        tap(([_, currentDate]) => {
          if (!!currentDate) {
            const date = new Date(currentDate);
            const minDate = DeadlineRewardForm.calculateMinDate();

            // set the deadline to minDate if it's less than it
            if (date < minDate) {
              boardForm.controls.CompletionDeadlineUtc.setValue(minDate);
            }
          }
        })
      )
      .subscribe();

    this.deadlineInputsViewMode.set('display');
  }

  public setTime(date: Date | null) {
    if (date?.toString() === 'Invalid Date') {
      return;
    }

    if (date) {
      this.boardForm.controls.CompletionDeadlineUtc.setValue(date);
      return;
    }

    // if the user erased the time, fall back to midnight of the selected date
    let currentDate = this.boardForm.getRawValue().CompletionDeadlineUtc;

    if (!!currentDate) {
      currentDate = new Date(currentDate);
      currentDate.setHours(0, 0, 0, 0);
      this.boardForm.controls.CompletionDeadlineUtc.setValue(currentDate);
    }
  }

  private static calculateMinDate() {
    return calculateDateFromNow(
      DeadlineRewardForm.minDateMinutesFromNow
    );
  }
}
